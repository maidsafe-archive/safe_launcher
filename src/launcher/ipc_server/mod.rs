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

use xor_name::XorName;
use maidsafe_utilities::thread::RaiiThreadJoiner;
use maidsafe_utilities::event_sender::EventSender;

pub mod events;

pub type EventSenderToServer<EventSubset> = EventSender<events::IpcServerEventCategory,
                                                        EventSubset>;

mod misc;
mod ipc_session;

const IPC_SERVER_THREAD_NAME: &'static str = "IpcServerThread";
const IPC_LISTENER_THREAD_NAME: &'static str = "IpcListenerThread";
const LISTENER_THIRD_OCTATE_START: u8 = 0;
const LISTENER_FOURTH_OCTATE_START: u8 = 1;

pub struct IpcServer {
    client: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
    temp_id: u32,
    _raii_joiner: RaiiThreadJoiner,
    session_event_tx: ::std::sync::mpsc::Sender<events::IpcSessionEvent>,
    session_event_rx: ::std::sync::mpsc::Receiver<events::IpcSessionEvent>,
    listener_event_rx: ::std::sync::mpsc::Receiver<events::IpcListenerEvent>,
    external_event_rx: ::std::sync::mpsc::Receiver<events::ExternalEvent>,
    event_catagory_tx: ::std::sync::mpsc::Sender<events::IpcServerEventCategory>,
    listener_endpoint: String,
    listener_stop_flag: ::std::sync::Arc<::std::sync::atomic::AtomicBool>,
    verified_sessions: ::std::collections::HashMap<XorName, misc::SessionInfo>,
    unverified_sessions: ::std::collections::HashMap<u32, misc::SessionInfo>,
    pending_verifications: ::std::collections::HashMap<String, misc::AppInfo>,
    verified_session_observers: Vec<::observer::IpcObserver>,
    unverified_session_observers: Vec<::observer::IpcObserver>,
    pending_verification_observers: Vec<::observer::IpcObserver>,
}

impl IpcServer {
    pub fn new(client: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>)
               -> Result<(RaiiThreadJoiner, EventSenderToServer<events::ExternalEvent>),
                         ::errors::LauncherError> {
        let (session_event_tx, session_event_rx) = ::std::sync::mpsc::channel();
        let (listener_event_tx, listener_event_rx) = ::std::sync::mpsc::channel();
        let (external_event_tx, external_event_rx) = ::std::sync::mpsc::channel();
        let (event_catagory_tx, event_catagory_rx) = ::std::sync::mpsc::channel();

        let stop_flag = ::std::sync::Arc::new(::std::sync::atomic::AtomicBool::new(false));
        let listener_event_sender =
            EventSenderToServer::<events::IpcListenerEvent>::new(listener_event_tx,
                events::IpcServerEventCategory::IpcListenerEvent, event_catagory_tx.clone());

        let (joiner, endpoint) = try!(IpcServer::spawn_acceptor(listener_event_sender,
                                                                stop_flag.clone()));
        let cloned_event_catagory_tx = event_catagory_tx.clone();

        let ipc_server_joiner = thread!(IPC_SERVER_THREAD_NAME, move || {
            let mut ipc_server = IpcServer {
                client: client,
                temp_id: 0,
                _raii_joiner: joiner,
                session_event_tx: session_event_tx,
                session_event_rx: session_event_rx,
                listener_event_rx: listener_event_rx,
                external_event_rx: external_event_rx,
                event_catagory_tx: cloned_event_catagory_tx,
                listener_endpoint: endpoint,
                listener_stop_flag: stop_flag,
                verified_sessions: ::std::collections::HashMap::new(),
                unverified_sessions: ::std::collections::HashMap::new(),
                pending_verifications: ::std::collections::HashMap::new(),
                verified_session_observers: Vec::with_capacity(2),
                unverified_session_observers: Vec::with_capacity(2),
                pending_verification_observers: Vec::with_capacity(2),
            };

            ipc_server.run(event_catagory_rx);

            debug!("Exiting Thread {:?}", IPC_SERVER_THREAD_NAME);
        });

        let external_event_sender =
            EventSenderToServer::<events::ExternalEvent>::new(external_event_tx,
                events::IpcServerEventCategory::ExternalEvent, event_catagory_tx);

        Ok((RaiiThreadJoiner::new(ipc_server_joiner),
            external_event_sender))
    }

    fn run(&mut self,
           event_catagory_rx: ::std::sync::mpsc::Receiver<events::IpcServerEventCategory>) {
        for event_category in event_catagory_rx.iter() {
            match event_category {
                events::IpcServerEventCategory::IpcListenerEvent => {
                    if let Ok(listner_event) = self.listener_event_rx.try_recv() {
                        match listner_event {
                            events::IpcListenerEvent::IpcListenerAborted(error) => {
                                self.on_ipc_listener_aborted(error)
                            }
                            events::IpcListenerEvent::SpawnIpcSession(tcp_stream) => {
                                self.on_spawn_ipc_session(tcp_stream)
                            }
                        }
                    }
                }
                events::IpcServerEventCategory::IpcSessionEvent => {
                    if let Ok(session_event) = self.session_event_rx.try_recv() {
                        match session_event {
                            events::IpcSessionEvent::VerifySession(detail) => {
                                self.on_verify_session(detail)
                            }
                            events::IpcSessionEvent::IpcSessionTerminated(detail) => {
                                self.on_ipc_session_terminated(detail)
                            }
                        }
                    }
                }
                events::IpcServerEventCategory::ExternalEvent => {
                    if let Ok(external_event) = self.external_event_rx.try_recv() {
                        match external_event {
                            events::ExternalEvent::EndSession(app_id) => {
                                self.on_end_session(app_id)
                            }
                            events::ExternalEvent::GetListenerEndpoint(sender) => {
                                self.on_get_listener_endpoint(sender)
                            }
                            events::ExternalEvent::AppActivated(activation_detail) => {
                                self.on_app_activated(activation_detail)
                            }
                            events::ExternalEvent::ChangeSafeDriveAccess(app_id, is_allowed) => {
                                self.on_change_safe_drive_access(app_id, is_allowed)
                            }
                            events::ExternalEvent::RegisterVerifiedSessionObserver(obs) => {
                                self.on_register_verified_session_observer(obs)
                            }
                            events::ExternalEvent::RegisterUnverifiedSessionObserver(obs) => {
                                self.on_register_unverified_session_observer(obs)
                            }
                            events::ExternalEvent::RegisterPendingVerificationObserver(obs) => {
                                self.on_register_pending_verification_observer(obs)
                            }
                            events::ExternalEvent::Terminate => break,
                        }
                    }
                }
            }
        }
    }

    fn on_spawn_ipc_session(&mut self, stream: ::std::net::TcpStream) {
        let event_sender = EventSenderToServer::<events::IpcSessionEvent>
                                              ::new(self.session_event_tx.clone(),
                                                    events::IpcServerEventCategory::IpcSessionEvent,
                                                    self.event_catagory_tx.clone());
        match ipc_session::IpcSession::new(event_sender, self.temp_id, stream) {
            Ok((raii_joiner, event_sender)) => {
                if let Some(_) = self.unverified_sessions
                                     .insert(self.temp_id,
                                             misc::SessionInfo::new(raii_joiner, event_sender)) {
                    debug!("Unverified session existed even after all temporary ids are \
                            exhausted. Terminating that session ...");
                } else {
                    let data = ::observer::event_data::UnverifiedSession {
                        id: self.temp_id,
                        action: ::observer::event_data::Action::Added,
                    };
                    group_send!(data, &mut self.unverified_session_observers);
                }
            }
            Err(err) => debug!("IPC Session spawning failed for peer {:?}", err),
        }
        self.temp_id = self.temp_id.wrapping_add(1);
    }

    #[allow(unused)]
    fn on_ipc_listener_aborted(&self, error: Box<::errors::LauncherError>) {
        let error = *error;
    }

    fn on_verify_session(&mut self, detail: Box<(u32, String)>) {
        let (temp_id, nonce) = *detail;

        match (self.unverified_sessions.remove(&temp_id),
               self.pending_verifications.remove(&nonce)) {
            (Some(session_info), Some(app_info)) => {
                let app_detail = ipc_session::events::event_data::AppDetail {
                    client: self.client.clone(),
                    app_id: app_info.app_id.clone(),
                    app_root_dir_key: app_info.app_root_dir_key,
                    safe_drive_access: app_info.safe_drive_access,
                };

                if send_one!(app_detail, &session_info.event_sender).is_err() {
                    debug!("Unable to communicate with the session via channel. Session will be \
                            terminated.");
                } else if let Some(_) = self.verified_sessions
                                     .insert(app_info.app_id.clone(), session_info) {
                    debug!("Detected an attempt by an app to connect twice. Previous instance \
                            will be terminated.");
                } else {
                    let data = ::observer::event_data::VerifiedSession {
                        id: app_info.app_id,
                        action: ::observer::event_data::Action::Added,
                    };
                    group_send!(data, &mut self.verified_session_observers);
                }
            }
            _ => {
                debug!("Temp Id {:?} and/or Nonce {:?} invalid. Possible security breach - \
                        situation salvaged.",
                       temp_id,
                       nonce)
            }
        }

        let data = ::observer::event_data::UnverifiedSession {
            id: temp_id,
            action: ::observer::event_data::Action::Removed(None),
        };
        group_send!(data, &mut self.unverified_session_observers);

        let data = ::observer::event_data::PendingVerification {
            nonce: nonce,
            action: ::observer::event_data::Action::Removed(None),
        };
        group_send!(data, &mut self.pending_verification_observers);
    }

    fn on_ipc_session_terminated(&mut self,
                                 detail: Box<events::event_data::SessionTerminationDetail>) {
        let detail = *detail;

        match detail.id {
            events::event_data::SessionId::AppId(app_id) => {
                let _ = self.verified_sessions.remove(&*app_id);

                let data = ::observer::event_data::VerifiedSession {
                    id: *app_id,
                    action: ::observer::event_data::Action::Removed(Some(detail.reason)),
                };
                group_send!(data, &mut self.verified_session_observers);
            }
            events::event_data::SessionId::TempId(temp_id) => {
                let _ = self.unverified_sessions.remove(&temp_id);

                let data = ::observer::event_data::UnverifiedSession {
                    id: temp_id,
                    action: ::observer::event_data::Action::Removed(Some(detail.reason)),
                };
                group_send!(data, &mut self.unverified_session_observers);
            }
        };
    }

    fn on_app_activated(&mut self, activation_detail: Box<events::event_data::ActivationDetail>) {
        let detail = *activation_detail;
        if let Some(_) = self.pending_verifications
                             .insert(detail.nonce.clone(),
                                     misc::AppInfo::new(detail.app_id,
                                                        detail.app_root_dir_key,
                                                        detail.safe_drive_access)) {
            // TODO(Spandan) handle this security hole.
            error!("Same nonce was already given to an app pending verification. This is a \
                    security hole not fixed in this iteration.");
            error!("Issues like mixed-up safe drive access could arise.");
            error!("Dropping the previous app information and re-assigning nonce to a new app");
        } else {
            let data = ::observer::event_data::PendingVerification {
                nonce: detail.nonce,
                action: ::observer::event_data::Action::Added,
            };
            group_send!(data, &mut self.pending_verification_observers);
        }
    }

    fn on_change_safe_drive_access(&mut self, app_id: XorName, is_allowed: bool) {
        let mut send_failed = false;

        if let Some(session_info) = self.verified_sessions.get_mut(&app_id) {
            send_failed = session_info.event_sender.send(
                ::launcher::ipc_server::ipc_session::events
                ::ExternalEvent::ChangeSafeDriveAccess(is_allowed)).is_err();
        } else {
            for (_, app_info) in self.pending_verifications.iter_mut() {
                if app_info.app_id == app_id {
                    app_info.safe_drive_access = is_allowed;
                    break;
                }
            }
        }

        if send_failed {
            let _ = self.verified_sessions.remove(&app_id);

            let data = ::observer::event_data::VerifiedSession {
                id    : app_id,
                action: ::observer::event_data::Action::Removed(
                    Some(::errors::LauncherError::ReceiverChannelDisconnected)),
            };
            group_send!(data, &mut self.verified_session_observers);
        }
    }

    fn on_get_listener_endpoint(&self, sender: ::std::sync::mpsc::Sender<String>) {
        if let Err(err) = sender.send(self.listener_endpoint.clone()) {
            debug!("Error Sending Endpoint: {:?}", err);
        }
    }

    fn on_register_verified_session_observer(&mut self, observer: ::observer::IpcObserver) {
        self.verified_session_observers.push(observer);
    }

    fn on_register_unverified_session_observer(&mut self, observer: ::observer::IpcObserver) {
        self.unverified_session_observers.push(observer);
    }

    fn on_register_pending_verification_observer(&mut self, observer: ::observer::IpcObserver) {
        self.pending_verification_observers.push(observer);
    }

    fn on_end_session(&mut self, app_id: XorName) {
        if self.verified_sessions.remove(&app_id).is_none() {
            let mut found = None;
            for (launcher_nonce, app_info) in &self.pending_verifications {
                if app_info.app_id == app_id {
                    found = Some(launcher_nonce.clone());
                    break;
                }
            }

            if let Some(launcher_nonce) = found {
                let _ = unwrap_option!(self.pending_verifications.remove(&launcher_nonce),
                                       "Logic Error - Report a bug.");
            } else {
                debug!("IPC Server has no knowledge of the given App-Id {:?} for removal",
                       app_id);
            }
        }
    }

    fn spawn_acceptor(event_sender: EventSenderToServer<events::IpcListenerEvent>,
                      stop_flag: ::std::sync::Arc<::std::sync::atomic::AtomicBool>)
                      -> Result<(RaiiThreadJoiner, String), ::errors::LauncherError> {
        let mut third_octate = LISTENER_THIRD_OCTATE_START;
        let mut fourth_octate = LISTENER_FOURTH_OCTATE_START;

        let ipc_listener;

        loop {
            let local_ip = ::std::net::Ipv4Addr::new(127, 0, third_octate, fourth_octate);
            let local_endpoint = (local_ip, 0);

            match ::std::net::TcpListener::bind(local_endpoint) {
                Ok(listener) => {
                    ipc_listener = listener;
                    break;
                }
                Err(err) => {
                    debug!("Failed binding IPC Server on 127.0.{}.{} with error {:?}. Trying net \
                            IP...",
                           third_octate,
                           fourth_octate,
                           err);

                    if fourth_octate == 255 {
                        if third_octate == 255 {
                            return Err(::errors::LauncherError::IpcListenerCouldNotBeBound);
                        } else {
                            third_octate += 1;
                            fourth_octate = LISTENER_FOURTH_OCTATE_START;
                        }
                    } else {
                        fourth_octate += 1;
                    }
                }
            }
        }

        let local_endpoint = format!("{}", unwrap_result!(ipc_listener.local_addr()));

        let joiner = thread!(IPC_LISTENER_THREAD_NAME, move || {
            IpcServer::handle_accept(ipc_listener, event_sender, stop_flag);

            debug!("Exiting Thread {:?}", IPC_LISTENER_THREAD_NAME);
        });

        Ok((RaiiThreadJoiner::new(joiner), local_endpoint))
    }

    fn handle_accept(ipc_listener: ::std::net::TcpListener,
                     event_sender: EventSenderToServer<events::IpcListenerEvent>,
                     stop_flag: ::std::sync::Arc<::std::sync::atomic::AtomicBool>) {
        loop {
            match ipc_listener.accept()
                              .map_err(|e| ::errors::LauncherError::IpcListenerAborted(e)) {
                Ok((stream, _)) => {
                    if stop_flag.load(::std::sync::atomic::Ordering::SeqCst) {
                        break;
                    } else {
                        if let Err(_) =
                               event_sender.send(events::IpcListenerEvent::SpawnIpcSession(stream)) {
                            break;
                        }
                    }
                }
                Err(accept_error) => {
                    debug!("IPC Listener aborted !!");
                    let _ = event_sender.send(
                        events::IpcListenerEvent::IpcListenerAborted(Box::new(accept_error)));
                    break;
                }
            }
        }
    }
}

impl Drop for IpcServer {
    fn drop(&mut self) {
        self.listener_stop_flag.store(true, ::std::sync::atomic::Ordering::SeqCst);
        if let Ok(stream) = ::std::net::TcpStream::connect(&self.listener_endpoint[..]) {
            if let Err(err) = stream.shutdown(::std::net::Shutdown::Both) {
                debug!("Error shutting down terminator stream: {:?}", err);
            }
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use std::io::Read;
    use std::sync::{Arc, Mutex};
    use maidsafe_utilities::thread::RaiiThreadJoiner;

    #[test]
    fn spawn_and_shut_ipc_server() {
        let client =
            Arc::new(Mutex::new(unwrap_result!(::safe_core::utility::test_utils::get_client())));

        let (_raii_joiner_0, event_sender) = unwrap_result!(IpcServer::new(client));

        let (tx, rx) = ::std::sync::mpsc::channel();
        unwrap_result!(event_sender.send(
            ::launcher::ipc_server::events::ExternalEvent::GetListenerEndpoint(tx)));
        let listener_ep = unwrap_result!(rx.recv());

        let mut stream = unwrap_result!(::std::net::TcpStream::connect(&listener_ep[..]));

        let _raii_joiner_1 = RaiiThreadJoiner::new(thread!("ReaderThread", move || {
            let mut buffer = [0; 5];
            assert_eq!(unwrap_result!(stream.read(&mut buffer)), 0);
        }));

        let duration = ::std::time::Duration::from_millis(3000);
        ::std::thread::sleep(duration);
        // Terminate to exit this test - otherwise the raii_joiners will hang this test - this is
        // by design. So there is no way out but graceful termination which is what this entire
        // design strives for.
        unwrap_result!(event_sender.send(::launcher::ipc_server::events::ExternalEvent::Terminate));
    }
}
