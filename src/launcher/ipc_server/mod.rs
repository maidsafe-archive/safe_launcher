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

const LISTENER_PORT_RESET: u16 = 30000;
const LISTENER_OCTATE_START: u8 = 9;
const IPC_SERVER_THREAD_NAME: &'static str = "IpcServerThread";
const IPC_LISTENER_THREAD_NAME: &'static str = "IpcListenerThread";

pub struct IpcServer {
    client            : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
    _raii_joiner      : ::safe_core::utility::RAIIThreadJoiner,
    listener_stop_flag: ::std::sync::Arc<::std::sync::atomic::AtomicBool>,
}

impl IpcServer {
    pub fn new(client: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>) -> Result<(::safe_core::utility::RAIIThreadJoiner,
                                                                                                     ::std::sync::mpsc::Sender<::events::IpcServerEvent>),
                                                                                                    ::errors::LauncherError> {
        let (tx, rx) = ::std::sync::mpsc::channel();
        let stop_flag = ::std::sync::Arc::new(::std::sync::atomic::AtomicBool::new(false));
        let (joiner, endpoint) = try!(IpcServer::spawn_acceptor(client.clone(), stop_flag.clone(), tx.clone()));
        let ipc_server = IpcServer {
            client: client,
            _raii_joiner: joiner,
            listener_stop_flag: stop_flag,
        };

        let ipc_server_joiner = eval_result!(::std::thread::Builder::new().name(IPC_LISTENER_THREAD_NAME.to_string())
                                                                          .spawn(move || {
            IpcServer::activate_ipc_server(ipc_server);
        }));

        Ok((::safe_core::utility::RAIIThreadJoiner::new(ipc_server_joiner), tx))
    }

    fn activate_ipc_server(ipc_server: IpcServer) {
    }

    fn spawn_acceptor(client        : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
                      stop_flag     : ::std::sync::Arc<::std::sync::atomic::AtomicBool>,
                      event_notifier: ::std::sync::mpsc::Sender<::events::IpcServerEvent>) -> Result<(::safe_core::utility::RAIIThreadJoiner,
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

        let stop_flag_clone = stop_flag.clone();
        let joiner = eval_result!(::std::thread::Builder::new().name(IPC_LISTENER_THREAD_NAME.to_string())
                                                               .spawn(move || {
            IpcServer::handle_accept(client, stop_flag_clone, ipc_listener, event_notifier);
        }));

        let ep_string = format!("{}.{}.{}.{}:{}", 127u8.to_string(),
                                                  0u8.to_string(),
                                                  third_octate.to_string(),
                                                  fourth_octate.to_string(),
                                                  port.to_string());

        Ok((::safe_core::utility::RAIIThreadJoiner::new(joiner), ep_string))
    }

    fn handle_accept(client        : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
                     stop_flag     : ::std::sync::Arc<::std::sync::atomic::AtomicBool>,
                     ipc_listener  : ::std::net::TcpListener,
                     event_notifier: ::std::sync::mpsc::Sender<::events::IpcServerEvent>) {
        loop  {
            match ipc_listener.accept() {
                Ok((ipc_stream, _)) => {
                    if stop_flag.load(::std::sync::atomic::Ordering::SeqCst) {
                        break;
                    } else {
                        //let ipc_session = ::launcher::ipc::ipc_session::IpcSession::new(ipc_stream);
                    }
                },
                Err(error) => {
                    debug!("IPC Listener aborted !!");
                    let event = ::events::IpcServerEvent::IpcListenerError(::errors::LauncherError::IpcListenerAborted(error));
                    match event_notifier.send(event) {
                        Ok(_) => (),
                        Err(error) => debug!("Ipc Listener channel error: {:?}", error),
                    }
                    break;
                },
            }
        }
    }
}
