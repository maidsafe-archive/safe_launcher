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
mod rsa_key_exchange;
mod secure_communication;

const IPC_STREAM_THREAD_NAME: &'static str = "IpcStreamThread";
const IPC_SESSION_THREAD_NAME: &'static str = "IpcSessionThread";

pub struct IpcSession {
    app_id                 : Option<::routing::NameType>,
    temp_id                : u32,
    ipc_stream             : ::std::net::TcpStream,
    _raii_joiner           : ::safe_core::utility::RAIIThreadJoiner,
    safe_drive_access      : Option<::std::sync::Arc<::std::sync::Mutex<bool>>>, // TODO(Spandan) change to 3-level permission instead of 2
    event_catagory_tx      : ::std::sync::mpsc::Sender<events::IpcSessionEventCategory>,
    event_catagory_rx      : ::std::sync::mpsc::Receiver<events::IpcSessionEventCategory>,
    external_event_rx      : ::std::sync::mpsc::Receiver<events::ExternalEvent>,
    secure_comm_event_rx   : ::std::sync::mpsc::Receiver<events::SecureCommunicationEvent>,
    secure_comm_event_tx   : ::std::sync::mpsc::Sender<events::SecureCommunicationEvent>,
    key_exchange_event_rx  : ::std::sync::mpsc::Receiver<events::RsaKeyExchangeEvent>,
    key_exchange_event_tx  : ::std::sync::mpsc::Sender<events::RsaKeyExchangeEvent>,
    authentication_event_rx: ::std::sync::mpsc::Receiver<events::AppAuthenticationEvent>,
    ipc_server_event_sender: ::launcher::ipc_server::EventSenderToServer<::launcher::ipc_server::events::IpcSessionEvent>,
}

impl IpcSession {
    pub fn new(server_event_sender: ::launcher::ipc_server::EventSenderToServer<::launcher::ipc_server::events::IpcSessionEvent>,
               temp_id            : u32,
               ipc_stream         : ::std::net::TcpStream) -> Result<(::safe_core::utility::RAIIThreadJoiner,
                                                                      EventSenderToSession<events::ExternalEvent>),
                                                                     ::errors::LauncherError> {
        let (event_catagory_tx, event_catagory_rx) = ::std::sync::mpsc::channel();
        let (external_event_tx, external_event_rx) = ::std::sync::mpsc::channel();
        let (secure_comm_event_tx, secure_comm_event_rx) = ::std::sync::mpsc::channel();
        let (key_exchange_event_tx, key_exchange_event_rx) = ::std::sync::mpsc::channel();
        let (authentication_event_tx, authentication_event_rx) = ::std::sync::mpsc::channel();

        let authentication_event_sender = EventSenderToSession::<events::AppAuthenticationEvent>
                                                              ::new(authentication_event_tx,
                                                                    events::IpcSessionEventCategory::AppAuthenticationEvent,
                                                                    event_catagory_tx.clone());

        let joiner = authenticate_app::verify_launcher_nonce(try!(ipc_stream.try_clone()
                                                                            .map_err(|err| ::errors
                                                                                           ::LauncherError
                                                                                           ::IpcStreamCloneError(err))),
                                                             authentication_event_sender);

        let ipc_session = IpcSession {
            app_id                 : None,
            temp_id                : temp_id,
            ipc_stream             : ipc_stream,
            _raii_joiner           : joiner,
            safe_drive_access      : None,
            event_catagory_tx      : event_catagory_tx.clone(),
            event_catagory_rx      : event_catagory_rx,
            external_event_rx      : external_event_rx,
            secure_comm_event_rx   : secure_comm_event_rx,
            secure_comm_event_tx   : secure_comm_event_tx,
            key_exchange_event_rx  : key_exchange_event_rx,
            key_exchange_event_tx  : key_exchange_event_tx,
            authentication_event_rx: authentication_event_rx,
            ipc_server_event_sender: server_event_sender,
        };

        let ipc_session_joiner = eval_result!(::std::thread::Builder::new().name(IPC_SESSION_THREAD_NAME.to_string())
                                                                           .spawn(move || {
            IpcSession::activate_ipc_session(ipc_session);
            debug!("Exiting Thread {:?}", IPC_SESSION_THREAD_NAME);
        }));

        let external_event_sender = EventSenderToSession::<events::ExternalEvent>
                                                        ::new(external_event_tx,
                                                              events::IpcSessionEventCategory::ExternalEvent,
                                                              event_catagory_tx);

        Ok((::safe_core::utility::RAIIThreadJoiner::new(ipc_session_joiner), external_event_sender))
    }

    fn activate_ipc_session(mut ipc_session: IpcSession) {
        for event_category in ipc_session.event_catagory_rx.iter() {
            match event_category {
                events::IpcSessionEventCategory::AppAuthenticationEvent => {
                    if let Ok(authentication_event) = ipc_session.authentication_event_rx.try_recv() {
                        match authentication_event {
                            events::AppAuthenticationEvent::ReceivedNonce(nonce) => ipc_session.on_received_nonce(nonce),
                            _ => unimplemented!(),
                        }
                    }
                },
                events::IpcSessionEventCategory::RsaKeyExchangeEvent => {
                    if let Ok(rsa_key_exchg_event) = ipc_session.key_exchange_event_rx.try_recv() {
                        match rsa_key_exchg_event {
                            _ => unimplemented!(),
                        }
                    }
                },
                events::IpcSessionEventCategory::SecureCommunicationEvent => {
                    if let Ok(secure_comm_event) = ipc_session.secure_comm_event_rx.try_recv() {
                        match secure_comm_event {
                            _ => unimplemented!(),
                        }
                    }
                },
                events::IpcSessionEventCategory::ExternalEvent => {
                    if let Ok(external_event) = ipc_session.external_event_rx.try_recv() {
                        match external_event {
                            events::ExternalEvent::AppDetailReceived(app_detail) => ipc_session.on_app_detail_received(app_detail),
                            events::ExternalEvent::ChangeSafeDriveAccess(is_allowed) => ipc_session.on_change_safe_drive_access(is_allowed),
                            events::ExternalEvent::Terminate => break,
                        }
                    }
                },
            }
        }
    }

    fn on_received_nonce(&self, nonce: String) {
        self.ipc_server_event_sender.send(::launcher
                                          ::ipc_server
                                          ::events
                                          ::IpcSessionEvent::VerifySession(self.temp_id, nonce));
    }

    fn on_app_detail_received(&self, app_detail: Box<events::event_data::AppDetail>) {
        ;
    }

    fn on_change_safe_drive_access(&self, is_allowed: bool) {
        ;
    }
}

impl Drop for IpcSession {
    fn drop(&mut self) {
        if let Err(err) = self.ipc_stream.shutdown(::std::net::Shutdown::Both) {
            debug!("Failed to gracefully shutdown session for app-id {:?} with error {:?}",
                   self.app_id, err);
        }
    }
}
