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

const SECURE_COMM_THREAD_NAME: &'static str = "SecureCommunicationThread";

pub struct SecureCommunication {
    observers        : Vec<::launcher::ipc_server::ipc_session::EventSenderToSession<::launcher
                                                                                     ::ipc_server
                                                                                     ::ipc_session
                                                                                     ::events::SecureCommunicationEvent>>,
    symm_key         : ::sodiumoxide::crypto::secretbox::Key,
    symm_nonce       : ::sodiumoxide::crypto::secretbox::Nonce,
    ipc_stream       : ::launcher::ipc_server::ipc_session::stream::IpcStream,
    parser_parameters: ::launcher::parser::ParameterPacket,
}

impl SecureCommunication {
    pub fn new(client            : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
               observer          : ::launcher::ipc_server::ipc_session::EventSenderToSession<::launcher
                                                                                             ::ipc_server
                                                                                             ::ipc_session
                                                                                             ::events::SecureCommunicationEvent>,
               symm_key          : ::sodiumoxide::crypto::secretbox::Key,
               symm_nonce        : ::sodiumoxide::crypto::secretbox::Nonce,
               ipc_stream        : ::launcher::ipc_server::ipc_session::stream::IpcStream,
               app_root_dir_key  : ::safe_nfs::metadata::directory_key::DirectoryKey,
               safe_drive_access : ::std::sync::Arc<::std::sync::Mutex<bool>>) -> ::safe_core::utility::RAIIThreadJoiner {
        let joiner = eval_result!(::std::thread::Builder::new()
                                                         .name(SECURE_COMM_THREAD_NAME.to_string())
                                                         .spawn(move || {
            let mut observers = vec![observer];

            let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(client.clone());
            // TODO(Spandan) this is wrong - Fix it in nfs to get safe_drive listing directly.
            let safe_drive_dir_key = eval_send!(dir_helper.get_user_root_directory_listing(), &mut observers).get_key().clone();

            let parameter_packet = ::launcher::parser::ParameterPacket {
                client            : client,
                app_root_dir_key  : app_root_dir_key,
                safe_drive_access : safe_drive_access,
                safe_drive_dir_key: safe_drive_dir_key,
            };

            let mut secure_comm_obj = SecureCommunication {
                observers        : observers,
                symm_key         : symm_key,
                symm_nonce       : symm_nonce,
                ipc_stream       : ipc_stream,
                parser_parameters: parameter_packet,
            };

            secure_comm_obj.start();

            debug!("Exiting Thread {:?}", SECURE_COMM_THREAD_NAME);
        }));

        ::safe_core::utility::RAIIThreadJoiner::new(joiner)
    }

    fn start(&mut self) {
        loop {
            let cipher_text = eval_send!(self.ipc_stream.read_payload(), &mut self.observers);

            match ::sodiumoxide::crypto::secretbox::open(&cipher_text, &self.symm_nonce, &self.symm_key) {
                Ok(plain_text) => {
                    match parse_result!(String::from_utf8(plain_text), "Invalid UTF-8") {
                        Ok(json_str) => {
                            match ::rustc_serialize::json::Json::from_str(&json_str) {
                                Ok(json_request) => {
                                    match ::launcher::parser::begin_parse(self.parser_parameters.clone(),
                                                                          &mut ::rustc_serialize::json::Decoder::new(json_request)) {
                                        Ok(parser_response) => {
                                            if let Some(response_json_str) = parser_response {
                                               match self.get_encrypted_normal_response(&cipher_text, response_json_str) {
                                                    Ok(response_cipher) => eval_send!(self.ipc_stream.write(response_cipher), &mut self.observers),
                                                    Err(err) => debug!("{:?} - Failed to construct a normal response for peer.", err),
                                                }
                                            }
                                        },
                                        Err(err) => {
                                           match self.get_encrypted_error_response(&cipher_text, err) {
                                                Ok(response_cipher) => eval_send!(self.ipc_stream.write(response_cipher), &mut self.observers),
                                                Err(err) => debug!("{:?} - Failed to construct a response error for peer.", err),
                                            }
                                        },
                                    }
                                },
                                Err(err) => {
                                   match self.get_encrypted_error_response(&cipher_text, ::errors::LauncherError::from(err)) {
                                        Ok(response_cipher) => eval_send!(self.ipc_stream.write(response_cipher), &mut self.observers),
                                        Err(err) => debug!("{:?} - Failed to construct a response error for peer.", err),
                                    }
                                },
                            }
                        },
                        Err(err) => {
                            match self.get_encrypted_error_response(&cipher_text, err) {
                                Ok(response_cipher) => eval_send!(self.ipc_stream.write(response_cipher), &mut self.observers),
                                Err(err) => debug!("{:?} - Failed to construct a response error for peer.", err),
                            }
                        },
                    }
                },
                Err(()) => {
                    match self.get_encrypted_error_response(&cipher_text, ::errors::LauncherError::SymmetricDecipherFailure) {
                        Ok(response_cipher) => eval_send!(self.ipc_stream.write(response_cipher), &mut self.observers),
                        Err(err) => debug!("{:?} - Failed to construct a response error for peer.", err),
                    }
                },
            }
        }
    }

    fn get_encrypted_normal_response(&self,
                                     orig_payload: &[u8],
                                     data        : String) -> Result<Vec<u8>, ::errors::LauncherError> {
        let normal_response = LauncherNormalResponse {
            id  : SecureCommunication::get_response_id(orig_payload),
            data: data,
        };

        let json_str = try!(::rustc_serialize::json::encode(&normal_response));

        let cipher_text = ::sodiumoxide::crypto::secretbox::seal(&json_str.into_bytes(), &self.symm_nonce, &self.symm_key);

        Ok(cipher_text)
    }

    fn get_encrypted_error_response(&self,
                                    orig_payload: &[u8],
                                    error       : ::errors::LauncherError) -> Result<Vec<u8>, ::errors::LauncherError> {
        let response_id = SecureCommunication::get_response_id(orig_payload);
        let debug_description = format!("{:?}", error);

        let error_code: i32 = error.into();

        let error_detail = ErrorDetail {
            code       : error_code as i64,
            description: debug_description,
        };

        let error_response = LauncherErrorResponse {
            id   : response_id,
            error: error_detail,
        };

        let json_str = try!(::rustc_serialize::json::encode(&error_response));

        let cipher_text = ::sodiumoxide::crypto::secretbox::seal(&json_str.into_bytes(), &self.symm_nonce, &self.symm_key);

        Ok(cipher_text)
    }

    fn get_response_id(orig_payload: &[u8]) -> String {
        use rustc_serialize::base64::ToBase64;

        let digest = ::sodiumoxide::crypto::hash::sha512::hash(orig_payload);
        digest.0.to_base64(::config::get_base64_config())
    }
}

#[derive(RustcEncodable, Debug)]
struct LauncherNormalResponse {
    id  : String,
    data: String,
}

#[derive(RustcEncodable, Debug)]
struct LauncherErrorResponse {
    id   : String,
    error: ErrorDetail,
}

#[derive(RustcEncodable, Debug)]
struct ErrorDetail {
    code       : i64,
    description: String,
}
