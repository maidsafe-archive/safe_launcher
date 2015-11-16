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

pub mod events;

pub type EventSenderToSession<EventSubset> = ::event_sender::EventSender<events::IpcSessionEventCategory, EventSubset>;

mod stream;
mod authenticate_app;
mod ecdh_key_exchange;
mod secure_communication;

const IPC_SESSION_THREAD_NAME: &'static str = "IpcSessionThread";

pub struct IpcSession {
    app_id                 : Option<::routing::NameType>,
    temp_id                : u32,
    stream                 : ::std::net::TcpStream,
    app_nonce              : Option<::sodiumoxide::crypto::box_::Nonce>,
    app_pub_key            : Option<::sodiumoxide::crypto::box_::PublicKey>,
    raii_joiner            : ::safe_core::utility::RAIIThreadJoiner,
    safe_drive_access      : Option<::std::sync::Arc<::std::sync::Mutex<bool>>>, // TODO(Spandan) change to 3-level permission instead of 2
    event_catagory_tx      : ::std::sync::mpsc::Sender<events::IpcSessionEventCategory>,
    external_event_rx      : ::std::sync::mpsc::Receiver<events::ExternalEvent>,
    secure_comm_event_rx   : ::std::sync::mpsc::Receiver<events::SecureCommunicationEvent>,
    secure_comm_event_tx   : ::std::sync::mpsc::Sender<events::SecureCommunicationEvent>,
    authentication_event_rx: ::std::sync::mpsc::Receiver<events::AppAuthenticationEvent>,
    ipc_server_event_sender: ::launcher::ipc_server::EventSenderToServer<::launcher::ipc_server::events::IpcSessionEvent>,
}

impl IpcSession {
    pub fn new(server_event_sender: ::launcher::ipc_server::EventSenderToServer<::launcher::ipc_server::events::IpcSessionEvent>,
               temp_id            : u32,
               stream             : ::std::net::TcpStream) -> Result<(::safe_core::utility::RAIIThreadJoiner,
                                                                      EventSenderToSession<events::ExternalEvent>),
                                                                     ::errors::LauncherError> {
        let ipc_stream = try!(stream::IpcStream::new(try!(stream.try_clone()
                                                                .map_err(|err| ::errors
                                                                               ::LauncherError
                                                                               ::IpcStreamCloneError(err)))));

        let (event_catagory_tx, event_catagory_rx) = ::std::sync::mpsc::channel();
        let (external_event_tx, external_event_rx) = ::std::sync::mpsc::channel();
        let (secure_comm_event_tx, secure_comm_event_rx) = ::std::sync::mpsc::channel();
        let (authentication_event_tx, authentication_event_rx) = ::std::sync::mpsc::channel();

        let cloned_event_catagory_tx = event_catagory_tx.clone();

        let ipc_session_joiner = eval_result!(::std::thread::Builder::new().name(IPC_SESSION_THREAD_NAME.to_string())
                                                                           .spawn(move || {
            let authentication_event_sender = EventSenderToSession::<events::AppAuthenticationEvent>
                                                                  ::new(authentication_event_tx,
                                                                        events::IpcSessionEventCategory::AppAuthenticationEvent,
                                                                        cloned_event_catagory_tx.clone());

            let joiner = authenticate_app::verify_launcher_nonce(ipc_stream, authentication_event_sender);

            let mut ipc_session = IpcSession {
                app_id                 : None,
                temp_id                : temp_id,
                stream                 : stream,
                app_nonce              : None,
                app_pub_key            : None,
                raii_joiner            : joiner,
                safe_drive_access      : None,
                event_catagory_tx      : cloned_event_catagory_tx,
                external_event_rx      : external_event_rx,
                secure_comm_event_rx   : secure_comm_event_rx,
                secure_comm_event_tx   : secure_comm_event_tx,
                authentication_event_rx: authentication_event_rx,
                ipc_server_event_sender: server_event_sender,
            };

            ipc_session.run(event_catagory_rx);

            debug!("Exiting Thread {:?}", IPC_SESSION_THREAD_NAME);
        }));

        let external_event_sender = EventSenderToSession::<events::ExternalEvent>
                                                        ::new(external_event_tx,
                                                              events::IpcSessionEventCategory::ExternalEvent,
                                                              event_catagory_tx);

        Ok((::safe_core::utility::RAIIThreadJoiner::new(ipc_session_joiner), external_event_sender))
    }

    fn run(&mut self, event_catagory_rx: ::std::sync::mpsc::Receiver<events::IpcSessionEventCategory>) {
        for event_category in event_catagory_rx.iter() {
            match event_category {
                events::IpcSessionEventCategory::AppAuthenticationEvent => {
                    if let Ok(authentication_event) = self.authentication_event_rx.try_recv() {
                        match authentication_event {
                            Ok(auth_data) => self.on_auth_data_received(auth_data),
                            Err(err)      => self.terminate_session(err),
                        }
                    }
                },
                events::IpcSessionEventCategory::SecureCommunicationEvent => {
                    if let Ok(secure_comm_event) = self.secure_comm_event_rx.try_recv() {
                        match secure_comm_event {
                            Ok(())   => (),
                            Err(err) => self.terminate_session(err),
                        }
                    }
                },
                events::IpcSessionEventCategory::ExternalEvent => {
                    if let Ok(external_event) = self.external_event_rx.try_recv() {
                        match external_event {
                            events::ExternalEvent::AppDetailReceived(app_detail)     => self.on_app_detail_received(app_detail),
                            events::ExternalEvent::ChangeSafeDriveAccess(is_allowed) => self.on_change_safe_drive_access(is_allowed),
                            events::ExternalEvent::Terminate => break,
                        }
                    }
                },
            }
        }
    }

    fn on_auth_data_received(&mut self, auth_data: events::event_data::AuthData) {
        self.app_nonce = Some(auth_data.asymm_nonce);
        self.app_pub_key = Some(auth_data.asymm_pub_key);

        let _ = send_one!((self.temp_id, auth_data.str_nonce), &self.ipc_server_event_sender);
    }

    fn on_app_detail_received(&mut self, app_detail: Box<events::event_data::AppDetail>) {
        let app_detail = *app_detail;

        self.app_id = Some(app_detail.app_id);
        self.safe_drive_access = Some(::std::sync::Arc::new(::std::sync::Mutex::new(app_detail.safe_drive_access)));

        if let Some(mut ipc_stream) = self.get_ipc_stream_or_terminate() {
            match ecdh_key_exchange::perform_ecdh_exchange(&mut ipc_stream,
                                                           eval_option!(self.app_nonce, "Logic Error - Report a bug."),
                                                           eval_option!(self.app_pub_key, "Logice Error - Report a bug.")) {
                Ok((symm_nonce, symm_key)) => {
                    let safe_drive_access = if let Some(ref access) = self.safe_drive_access {
                        access.clone()
                    } else {
                        panic!("Logic Error - Report a bug.")
                    };

                    let event_sender = EventSenderToSession::<events::SecureCommunicationEvent>
                                                           ::new(self.secure_comm_event_tx.clone(),
                                                                 events::IpcSessionEventCategory::SecureCommunicationEvent,
                                                                 self.event_catagory_tx.clone());

                    self.raii_joiner = secure_communication::SecureCommunication::new(app_detail.client,
                                                                                      event_sender,
                                                                                      symm_key,
                                                                                      symm_nonce,
                                                                                      ipc_stream,
                                                                                      app_detail.app_root_dir_key,
                                                                                      safe_drive_access);
                },
                Err(err) => {
                    debug!("ECDH Key Exchange unsuccessful {:?}", err);
                    self.terminate_session(err);
                },
            }
        }
    }

    fn on_change_safe_drive_access(&self, is_allowed: bool) {
        if let Some(ref safe_drive_access) = self.safe_drive_access {
            *(eval_result!(safe_drive_access.lock())) = is_allowed;
        }
    }

    fn get_ipc_stream_or_terminate(&self) -> Option<stream::IpcStream> {
        match self.get_ipc_stream() {
            Ok(stream) => Some(stream),
            Err(err) => {
                self.terminate_session(err);
                None
            },
        }
    }

    fn terminate_session(&self, reason: ::errors::LauncherError) {
        let id = if let Some(ref app_id) = self.app_id {
            ::launcher::ipc_server::events::event_data::SessionId::AppId(Box::new(app_id.clone()))
        } else {
            ::launcher::ipc_server::events::event_data::SessionId::TempId(self.temp_id)
        };

        let termination_detail = ::launcher::ipc_server::events::event_data::SessionTerminationDetail {
            id    : id,
            reason: reason,
        };

        if let Err(err) = send_one!(termination_detail, &self.ipc_server_event_sender) {
            debug!("Error {:?} - Sending termination notice to server.", err);
        }
    }

    fn get_ipc_stream(&self) -> Result<stream::IpcStream, ::errors::LauncherError> {
        let stream = try!(self.stream.try_clone().map_err(|err| ::errors
                                                                ::LauncherError
                                                                ::IpcStreamCloneError(err)));
        stream::IpcStream::new(stream)
    }
}

impl Drop for IpcSession {
    fn drop(&mut self) {
        if let Err(err) = self.stream.shutdown(::std::net::Shutdown::Both) {
            debug!("Failed to gracefully shutdown session for app-id {:?} with error {:?}",
                   self.app_id, err);
        }
    }
}

#[cfg(test)]
mod tests {
    #[derive(Debug)]
    struct HandshakeRequest {
        pub endpoint: String,
        pub data: HandshakePayload,
    }

    #[derive(Debug)]
    struct HandshakePayload {
        pub launcher_string: String,
        pub nonce: [u8; ::sodiumoxide::crypto::box_::NONCEBYTES],
        pub public_encryption_key: [u8; ::sodiumoxide::crypto::box_::PUBLICKEYBYTES],
    }

    impl ::rustc_serialize::json::ToJson for HandshakePayload {
        fn to_json(&self) -> ::rustc_serialize::json::Json {
            use ::rustc_serialize::base64::ToBase64;

            let mut tree = ::std::collections::BTreeMap::new();
            let config = ::config::get_base64_config();
            let base64_nonce = (&self.nonce).to_base64(config);
            let base64_pub_encryption_key = (&self.public_encryption_key).to_base64(config);

            assert!(tree.insert("launcher_string".to_string(), self.launcher_string.to_json()).is_none());
            assert!(tree.insert("asymm_nonce".to_string(), base64_nonce.to_json()).is_none());
            assert!(tree.insert("asymm_pub_key".to_string(), base64_pub_encryption_key.to_json()).is_none());

            ::rustc_serialize::json::Json::Object(tree)
        }
    }


    impl ::rustc_serialize::json::ToJson for HandshakeRequest {
        fn to_json(&self) -> ::rustc_serialize::json::Json {
            let mut tree = ::std::collections::BTreeMap::new();

            assert!(tree.insert("endpoint".to_string(), self.endpoint.to_json()).is_none());
            assert!(tree.insert("data".to_string(), self.data.to_json()).is_none());

            ::rustc_serialize::json::Json::Object(tree)
        }
    }

    #[test]
    fn application_handshake() {
        use ::rustc_serialize::json::ToJson;

        let client = ::std
                     ::sync
                     ::Arc::new(::std
                                ::sync
                                ::Mutex::new(eval_result!(::safe_core::utility::test_utils::get_client())));

        let (_raii_joiner_0, event_sender) = eval_result!(::launcher::ipc_server::IpcServer::new(client));

        let (tx, rx) = ::std::sync::mpsc::channel();
        eval_result!(event_sender.send(::launcher::ipc_server::events::ExternalEvent::GetListenerEndpoint(tx)));
        let listener_ep = eval_result!(rx.recv());

        let app_id = ::routing::NameType(eval_result!(::safe_core::utility::generate_random_array_u8_64()));
        let dir_id = ::routing::NameType(eval_result!(::safe_core::utility::generate_random_array_u8_64()));
        let directory_key = ::safe_nfs::metadata::directory_key::DirectoryKey::new(dir_id,
                                                                                   10u64,
                                                                                   false,
                                                                                   ::safe_nfs::AccessLevel::Private);
        let activation_details = ::launcher::ipc_server::events::event_data::ActivationDetail {
            nonce            : "mock_nonce_string".to_string(),
            app_id           : app_id,
            app_root_dir_key : directory_key,
            safe_drive_access: false,
        };
        let activate_event = ::launcher::ipc_server::events::ExternalEvent::AppActivated(Box::new(activation_details));
        eval_result!(event_sender.send(activate_event));

        let stream = eval_result!(::std::net::TcpStream::connect(&listener_ep[..]));

        let _raii_joiner_1 = ::safe_core
                             ::utility
                             ::RAIIThreadJoiner
                             ::new(eval_result!(::std
                                                ::thread
                                                ::Builder::new().name("AppHandshakeThread".to_string())
                                                                .spawn(move || {
                let mut ipc_stream = eval_result!(::launcher
                                                  ::ipc_server
                                                  ::ipc_session
                                                  ::stream
                                                  ::IpcStream::new(stream));
                let app_nonce = ::sodiumoxide::crypto::box_::gen_nonce();
                let (app_public_key, _) = ::sodiumoxide::crypto::box_::gen_keypair();
                let payload = HandshakePayload {
                    launcher_string      : "mock_nonce_string".to_string(),
                    nonce                : app_nonce.0,
                    public_encryption_key: app_public_key.0,
                };
                let request = HandshakeRequest {
                    endpoint: "safe-api/v1.0/handshake/authenticate-app".to_string(),
                    data     : payload,
                };

                let json_obj = request.to_json();
                eval_result!(ipc_stream.write(json_obj.to_string().into_bytes()));

                // TODO(Krishna) -> use response
                let _response = eval_result!(ipc_stream.read_payload());
                assert!(ipc_stream.read_payload().is_err())

        })));

        let duration = ::std::time::Duration::from_millis(3000);
        ::std::thread::sleep(duration);
        eval_result!(event_sender.send(::launcher::ipc_server::events::ExternalEvent::Terminate));
    }
}
