// Copyright 2015 MaidSafe.net limited.
//
// This SAFE Network Software is licensed to you under (1) the MaidSafe.net Commercial License,
// version 1.0 or later, or (2) The General Public License (GPL), version 3, depending on which
// licence you accepted on initial access to the Software (the "Licences").
//
// By contributing code to the SAFE Network Software, or to this project generally, you agree to be
// bound by the terms of the MaidSafe Contributor Agreement, version 1.0.  This, along with the
// Licenses can be found in the root directory of this project at LICENSE, COPYING and CONTRIBUTOR.
//
// Unless required by applicable law or agreed to in writing, the SAFE Network Software distributed
// under the GPL Licence is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.
//
// Please review the Licences for the specific language governing permissions and limitations
// relating to use of the SAFE Network Software.

const NONCE_VERIFIER_THREAD_NAME: &'static str = "LauncherNonceVerifierThread";
const APP_AUTHENTICATION_ENDPOINT: &'static str = "safe-api/v1.0/handshake/authenticate-app";

pub fn verify_launcher_nonce(mut ipc_stream  : ::launcher::ipc_server::ipc_session::stream::IpcStream,
                             event_sender    : ::launcher::ipc_server::ipc_session
                                               ::EventSenderToSession<::launcher::ipc_server::ipc_session
                                                                      ::events::AppAuthenticationEvent>) -> ::safe_core
                                                                                                            ::utility
                                                                                                            ::RAIIThreadJoiner {
    let joiner = eval_result!(::std::thread::Builder::new().name(NONCE_VERIFIER_THREAD_NAME.to_string())
                                                           .spawn(move || {
        use std::error::Error;
        use rustc_serialize::base64::FromBase64;

        let mut senders = vec![event_sender];

        let payload = eval_send!(ipc_stream.read_payload(), &mut senders);
        let payload_as_str = eval_send!(String::from_utf8(payload).map_err(|err| ::errors
                                                                                 ::LauncherError
                                                                                 ::SpecificParseError(err.description().to_string())),
                                        &mut senders);
        let json = eval_send!(::rustc_serialize::json::Json::from_str(&payload_as_str), &mut senders);
        let json_obj = eval_send!(parse_option!(json.as_object(), "Could not parse as JSON object."),
                                  &mut senders);
        let json_endpoint = eval_send!(parse_option!(json_obj.get("endpoint"), "Expected \"endpoint\" token not present."),
                                       &mut senders);
        let endpoint = eval_send!(parse_option!(json_endpoint.as_string(), "Could not parse endpoint as String."),
                                  &mut senders);

        if endpoint != APP_AUTHENTICATION_ENDPOINT {
            eval_send!(Err(::errors::LauncherError::SpecificParseError("Invalid endpoint for app-auhtentication".to_string())),
                       &mut senders);
        }

        let json_data = eval_send!(parse_option!(json_obj.get("data"), "Expected \"data\" token not present."),
                                   &mut senders);
        let json_data_obj = eval_send!(parse_option!(json_data.as_object(), "Could not parse \"data\" as JSON object."),
                                       &mut senders);
        let json_str_nonce = eval_send!(parse_option!(json_data_obj.get("launcher_string"),
                                                      "Expected \"launcher_string\" token not present."),
                                        &mut senders);
        let json_asymm_nonce = eval_send!(parse_option!(json_data_obj.get("nonce"),
                                                        "Expected \"nonce\" token not present."),
                                          &mut senders);
        let json_asymm_pub_key = eval_send!(parse_option!(json_data_obj.get("public_encryption_key"),
                                                          "Expected \"public_encryption_key\" token not present."),
                                            &mut senders);

        let str_nonce = eval_send!(parse_option!(json_str_nonce.as_string(), "Could not parse launcher nonce as String."),
                                   &mut senders);
        let str_asymm_nonce = eval_send!(parse_option!(json_asymm_nonce.as_string(), "Could not parse asymm nonce as String."),
                                         &mut senders);
        let str_asymm_pub_key = eval_send!(parse_result!(json_asymm_pub_key.as_string(), "Could not parse asymm public key as String."),
                                           &mut senders);

        let vec_nonce = eval_send!(str_asymm_nonce.from_base64().map_err(|err| ::errors
                                                                               ::LauncherError
                                                                               ::SpecificParseError(format!("{:?}", err))),
                                   &mut senders);
        if vec_nonce.len() != ::sodiumoxide::crypto::box_::NONCEBYTES {
            eval_send!(Err(::errors::LauncherError::SpecificParseError("Invalid nonce length.".to_string())),
                       &mut senders);
        }

        let vec_pub_key = eval_send!(str_asymm_pub_key.from_base64().map_err(|err| ::errors
                                                                                   ::LauncherError
                                                                                   ::SpecificParseError(format!("{:?}", err))),
                                     &mut senders);
        if vec_pub_key.len() != ::sodiumoxide::crypto::box_::PUBLICKEYBYTES {
            eval_send!(Err(::errors::LauncherError::SpecificParseError("Invalid public encryption key length.".to_string())),
                       &mut senders);
        }

        let mut asymm_nonce = ::sodiumoxide::crypto::box_::Nonce([0; ::sodiumoxide::crypto::box_::NONCEBYTES]);
        let mut asymm_pub_key = ::sodiumoxide::crypto::box_::PublicKey([0; ::sodiumoxide::crypto::box_::PUBLICKEYBYTES]);

        for it in vec_nonce.into_iter().enumerate() {
            asymm_nonce.0[it.0] = it.1;
        }
        for it in vec_pub_key.into_iter().enumerate() {
            asymm_pub_key.0[it.0] = it.1;
        }

        group_send!(Ok(::launcher::ipc_server::ipc_session::events::event_data::AuthData {
            str_nonce    : str_nonce.to_string(),
            asymm_nonce  : asymm_nonce,
            asymm_pub_key: asymm_pub_key,
        }), &mut senders);

        debug!("Exiting thread {:?}", NONCE_VERIFIER_THREAD_NAME);
    }));

    ::safe_core::utility::RAIIThreadJoiner::new(joiner)
}
