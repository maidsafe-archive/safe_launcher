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

use maidsafe_utilities::thread::RaiiThreadJoiner;
use launcher::ipc_server::ipc_session;

const NONCE_VERIFIER_THREAD_NAME: &'static str = "LauncherNonceVerifierThread";
const APP_AUTHENTICATION_ENDPOINT: &'static str = "safe-api/v1.0/handshake/authenticate-app";

pub fn verify_launcher_nonce(
            mut ipc_stream : ipc_session::stream::IpcStream,
            event_sender   : ipc_session::EventSenderToSession<
                ipc_session::events::AppAuthenticationEvent>)
        -> RaiiThreadJoiner {
    let joiner = thread!(NONCE_VERIFIER_THREAD_NAME, move || {
        use rustc_serialize::base64::FromBase64;
        use rustc_serialize::json;
        use sodiumoxide::crypto::box_;
        use errors::LauncherError;
        use launcher::ipc_server::ipc_session::events::event_data::AuthData;

        let payload = eval_send_one!(ipc_stream.read_payload(), &event_sender);
        let payload_as_str = eval_send_one!(parse_result!(String::from_utf8(payload),
                                                          "Invalid UTF-8"),
                                            &event_sender);
        let handshake_request: HandshakeRequest = eval_send_one!(json::decode(&payload_as_str),
                                                                 &event_sender);

        if handshake_request.endpoint != APP_AUTHENTICATION_ENDPOINT {
            eval_send_one!(Err(LauncherError::SpecificParseError("Invalid endpoint for \
                                                                  app-auhtentication"
                                                                     .to_string())),
                           &event_sender);
        }

        let vec_nonce = eval_send_one!(parse_result!(handshake_request.data
                                                                      .asymm_nonce
                                                                      .from_base64(),
                                                     "Nonce -> Base64"),
                                       &event_sender);
        if vec_nonce.len() != box_::NONCEBYTES {
            eval_send_one!(Err(LauncherError::SpecificParseError("Invalid asymmetric nonce \
                                                                  length."
                                                                     .to_string())),
                           &event_sender);
        }

        let vec_pub_key = eval_send_one!(parse_result!(handshake_request.data
                                                                        .asymm_pub_key
                                                                        .from_base64(),
                                                       "PublicKey -> Base64"),
                                         &event_sender);
        if vec_pub_key.len() != box_::PUBLICKEYBYTES {
            eval_send_one!(Err(LauncherError::SpecificParseError("Invalid asymmetric public \
                                                                  key length."
                                                                     .to_string())),
                           &event_sender);
        }

        let mut asymm_nonce = box_::Nonce([0; box_::NONCEBYTES]);
        let mut asymm_pub_key = box_::PublicKey([0; box_::PUBLICKEYBYTES]);

        for it in vec_nonce.into_iter().enumerate() {
            asymm_nonce.0[it.0] = it.1;
        }
        for it in vec_pub_key.into_iter().enumerate() {
            asymm_pub_key.0[it.0] = it.1;
        }

        if let Err(err) = send_one!(Ok(AuthData {
                                        str_nonce: handshake_request.data.launcher_string,
                                        asymm_nonce: asymm_nonce,
                                        asymm_pub_key: asymm_pub_key,
                                    }),
                                    &event_sender) {
            debug!("{:?} Error sending authentication data to IPCSession.", err);
        }

        debug!("Exiting thread {:?}", NONCE_VERIFIER_THREAD_NAME);
    });

    RaiiThreadJoiner::new(joiner)
}

#[derive(RustcDecodable, Debug)]
struct HandshakeRequest {
    data: HandshakeData,
    endpoint: String,
}

#[derive(RustcDecodable, Debug)]
struct HandshakeData {
    asymm_nonce: String,
    asymm_pub_key: String,
    launcher_string: String,
}
