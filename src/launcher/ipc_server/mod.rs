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

mod events;
mod event_sender;

const LISTENER_PORT_RESET: u16 = 30000;
const LISTENER_OCTATE_START: u8 = 9;
const IPC_SERVER_THREAD_NAME: &'static str = "IpcServerThread";
const IPC_LISTENER_THREAD_NAME: &'static str = "IpcListenerThread";

pub struct IpcServer {
    client            : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
    _raii_joiner      : ::safe_core::utility::RAIIThreadJoiner,
    session_event_rx  : ::std::sync::mpsc::Receiver<events::IpcSessionEvent>,
    listener_event_rx : ::std::sync::mpsc::Receiver<events::IpcListenerEvent>,
    external_event_rx : ::std::sync::mpsc::Receiver<events::ExternalEvent>,
    event_catagory_rx : ::std::sync::mpsc::Receiver<events::IpcServerEventCategory>,
    event_catagory_tx : ::std::sync::mpsc::Sender<events::IpcServerEventCategory>,
    listener_endpoint : String,
    listener_stop_flag: ::std::sync::Arc<::std::sync::atomic::AtomicBool>,
}

impl IpcServer {
    pub fn new(client: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>) -> Result<(::safe_core::utility::RAIIThreadJoiner,
                                                                                                     event_sender::EventSender<events::ExternalEvent>),
                                                                                                    ::errors::LauncherError> {
        let (session_event_tx, session_event_rx) = ::std::sync::mpsc::channel();
        let (listener_event_tx, listener_event_rx) = ::std::sync::mpsc::channel();
        let (external_event_tx, external_event_rx) = ::std::sync::mpsc::channel();
        let (event_catagory_tx, event_catagory_rx) = ::std::sync::mpsc::channel();

        let stop_flag = ::std::sync::Arc::new(::std::sync::atomic::AtomicBool::new(false));

        let listener_event_sender = event_sender::EventSender::<events::IpcListenerEvent>::new(listener_event_tx,
                                                                                               events::IpcServerEventCategory::IpcListenerEvent,
                                                                                               event_catagory_tx.clone());

        let (joiner, endpoint) = try!(IpcServer::spawn_acceptor(listener_event_sender,
                                                                stop_flag.clone()));

        let ipc_server = IpcServer {
            client            : client,
            _raii_joiner      : joiner,
            session_event_rx  : session_event_rx,
            listener_event_rx : listener_event_rx,
            external_event_rx : external_event_rx,
            event_catagory_rx : event_catagory_rx,
            event_catagory_tx : event_catagory_tx.clone(),
            listener_endpoint : endpoint,
            listener_stop_flag: stop_flag,
        };

        let ipc_server_joiner = eval_result!(::std::thread::Builder::new().name(IPC_LISTENER_THREAD_NAME.to_string())
                                                                          .spawn(move || {
            IpcServer::activate_ipc_server(ipc_server);
        }));

        let external_event_sender = event_sender::EventSender::<events::ExternalEvent>::new(external_event_tx,
                                                                                            events::IpcServerEventCategory::ExternalEvent,
                                                                                            event_catagory_tx);
        Ok((::safe_core::utility::RAIIThreadJoiner::new(ipc_server_joiner), external_event_sender))
    }

    fn activate_ipc_server(ipc_server: IpcServer) {
        for event_category in ipc_server.event_catagory_rx.iter() {
            match event_category {
                events::IpcServerEventCategory::IpcListenerEvent => {
                    if let Ok(listner_event) = ipc_server.listener_event_rx.try_recv() {
                        match listner_event {
                           events::IpcListenerEvent::IpcListenerAborted(error) => {
                               ;
                           },
                           events::IpcListenerEvent::SpawnIpcSession(tcp_stream) => {
                               ;
                           },
                        }
                    }
                },
                events::IpcServerEventCategory::IpcSessionEvent => {
                    if let Ok(session_event) = ipc_server.session_event_rx.try_recv() {
                        match session_event {
                            events::IpcSessionEvent::IpcSessionWriteFailed(app_id) => {
                                ;
                            },
                        }
                    }
                },
                events::IpcServerEventCategory::ExternalEvent => {
                    if let Ok(external_event) = ipc_server.external_event_rx.try_recv() {
                        match external_event {
                            events::ExternalEvent::ChangeSafeDriveAccess(app_id, is_allowed) => {
                                ;
                            },
                            events::ExternalEvent::Terminate => {
                                ;
                            },
                        }
                    }
                },
            }
        }
    }

    fn spawn_acceptor(event_sender: event_sender::EventSender<events::IpcListenerEvent>,
                      stop_flag   : ::std::sync::Arc<::std::sync::atomic::AtomicBool>) -> Result<(::safe_core::utility::RAIIThreadJoiner,
                                                                                                  String),
                                                                                                 ::errors::LauncherError> {
        let mut port = LISTENER_PORT_RESET;
        let mut third_octate = LISTENER_OCTATE_START;
        let mut fourth_octate = LISTENER_OCTATE_START;

        let ipc_listener;

        loop {
            let local_ip = ::std::net::Ipv4Addr::new(127, 0, third_octate, fourth_octate);
            let local_endpoint = (local_ip, port);
            
            match ::std::net::TcpListener::bind(local_endpoint) {
                Ok(listener) => {
                    ipc_listener = listener;
                    break;
                },
                Err(err) => {
                    debug!("Failed binding IPC Server: {:?}", err);

                    if port == 65535 {
                        if fourth_octate == 255 {
                            if third_octate == 255 {
                                return Err(::errors::LauncherError::IpcListenerCouldNotBeBound)
                            } else {
                                third_octate += 1;
                                fourth_octate = 0;
                            }
                        } else {
                            fourth_octate += 1;
                        }

                        port = LISTENER_PORT_RESET;
                    } else {
                        port += 1;
                    }
                }
            }
        }

        let joiner = eval_result!(::std::thread::Builder::new().name(IPC_LISTENER_THREAD_NAME.to_string())
                                                               .spawn(move || {
            IpcServer::handle_accept(ipc_listener,
                                     event_sender,
                                     stop_flag);

            debug!("Exiting Thread {:?}", IPC_LISTENER_THREAD_NAME.to_string());
        }));

        let ep_string = format!("{}.{}.{}.{}:{}", 127u8.to_string(),
                                                  0u8.to_string(),
                                                  third_octate.to_string(),
                                                  fourth_octate.to_string(),
                                                  port.to_string());

        Ok((::safe_core::utility::RAIIThreadJoiner::new(joiner), ep_string))
    }

    fn handle_accept(ipc_listener: ::std::net::TcpListener,
                     event_sender: event_sender::EventSender<events::IpcListenerEvent>,
                     stop_flag        : ::std::sync::Arc<::std::sync::atomic::AtomicBool>) {
        loop  {
            match ipc_listener.accept() {
                Ok((ipc_stream, _)) => {
                    if stop_flag.load(::std::sync::atomic::Ordering::SeqCst) {
                        break;
                    } else {
                        if let Err(_) = event_sender.send(events::IpcListenerEvent::SpawnIpcSession(ipc_stream)) {
                            break;
                        }
                    }
                },
                Err(accept_error) => {
                    debug!("IPC Listener aborted !!");
                    let _ = event_sender.send(events::IpcListenerEvent::IpcListenerAborted(accept_error));
                    break;
                },
            }
        }
    }
}
