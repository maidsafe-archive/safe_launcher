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
mod authenticate_app;
mod secure_communication;

const IPC_STREAM_THREAD_NAME: &'static str = "IpcStreamThread";
const IPC_SESSION_THREAD_NAME: &'static str = "IpcSessionThread";

pub struct IpcSession {
    app_id           : Option<::routing::NameType>,
    ipc_stream       : ::std::net::TcpStream,
    _raii_joiner     : ::safe_core::utility::RAIIThreadJoiner,
    stream_event_rx  : ::std::sync::mpsc::Receiver<events::IpcStreamEvent>,
    external_event_rx: ::std::sync::mpsc::Receiver<events::ExternalEvent>,
    event_catagory_rx: ::std::sync::mpsc::Receiver<events::IpcSessionEventCategory>,
    safe_drive_access: Option<::std::sync::Arc<::std::sync::Mutex<bool>>>, // TODO change to 3-level permission instead of 2
}

impl IpcSession {
    pub fn new(client    : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
               ipc_stream: ::std::net::TcpStream) -> Result<(::safe_core::utility::RAIIThreadJoiner,
                                                             event_sender::EventSender<events::ExternalEvent>),
                                                            ::errors::LauncherError> {
        let (stream_event_tx, stream_event_rx) = ::std::sync::mpsc::channel();
        let (external_event_tx, external_event_rx) = ::std::sync::mpsc::channel();
        let (event_catagory_tx, event_catagory_rx) = ::std::sync::mpsc::channel();

        let stream_event_sender = event_sender::EventSender::<events::IpcStreamEvent>::new(stream_event_tx,
                                                                                           events::IpcSessionEventCategory::IpcStreamEvent,
                                                                                           event_catagory_tx.clone());

        let joiner = IpcSession::activate_stream(try!(ipc_stream.try_clone()
                                                                .map_err(|err| ::errors::LauncherError::IpcStreamCloneError(err))),
                                                 stream_event_sender);

        let ipc_session = IpcSession {
            app_id           : None,
            ipc_stream       : ipc_stream,
            _raii_joiner     : joiner,
            stream_event_rx  : stream_event_rx,
            external_event_rx: external_event_rx,
            event_catagory_rx: event_catagory_rx,
            safe_drive_access: None,
        };

        let ipc_session_joiner = eval_result!(::std::thread::Builder::new().name(IPC_SESSION_THREAD_NAME.to_string())
                                                                           .spawn(move || {
            IpcSession::activate_ipc_session(ipc_session);
            debug!("Exiting Thread {:?}", IPC_SESSION_THREAD_NAME.to_string());
        }));

        let external_event_sender = event_sender::EventSender::<events::ExternalEvent>::new(external_event_tx,
                                                                                            events::IpcSessionEventCategory::ExternalEvent,
                                                                                            event_catagory_tx);
        Ok((::safe_core::utility::RAIIThreadJoiner::new(ipc_session_joiner), external_event_sender))
    }

    fn activate_ipc_session(mut ipc_session: IpcSession) {
        for event_category in ipc_session.event_catagory_rx.iter() {
            match event_category {
                events::IpcSessionEventCategory::IpcStreamEvent => {
                    if let Ok(stream_event) = ipc_session.stream_event_rx.try_recv() {
                        match stream_event {
                            _ => unimplemented!(),
                        }
                    }
                }, // IpcStreamEvent
                events::IpcSessionEventCategory::ExternalEvent => {
                    if let Ok(external_event) = ipc_session.external_event_rx.try_recv() {
                        match external_event {
                            events::ExternalEvent::ChangeSafeDriveAccess(is_allowed) => ipc_session.on_change_safe_drive_access(is_allowed),
                            events::ExternalEvent::Terminate => break,
                        }
                    }
                }, // ExternalEvent
            }
        }
    }

    fn on_change_safe_drive_access(&self, is_allowed: bool) {
        ;
    }

    fn activate_stream(ipc_stream  : ::std::net::TcpStream,
                       event_sender: event_sender::EventSender<events::IpcStreamEvent>) -> ::safe_core::utility::RAIIThreadJoiner {
        let joiner = eval_result!(::std::thread::Builder::new().name(IPC_STREAM_THREAD_NAME.to_string())
                                                               .spawn(move || {
            debug!("Exiting Thread {:?}", IPC_STREAM_THREAD_NAME.to_string());
        }));

        ::safe_core::utility::RAIIThreadJoiner::new(joiner)
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
