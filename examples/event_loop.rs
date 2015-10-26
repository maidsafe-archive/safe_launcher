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

const CLI_EVENT_LOOP_THREAD_NAME: &'static str = "CLI-Event-Loop";

#[derive(Debug)]
pub struct Terminate;

pub struct EventLoop {
    ipc_rx             : ::std::sync::mpsc::Receiver<::safe_launcher::observer::IpcEvent>,
    owner_rx           : ::std::sync::mpsc::Receiver<Terminate>,
    managed_apps       : ::std::sync::Arc<::std::sync::Mutex<Vec<::safe_launcher::launcher::event_data::ManagedApp>>>,
    running_apps       : ::std::sync::Arc<::std::sync::Mutex<Vec<::routing::NameType>>>,
    app_handling_rx    : ::std::sync::mpsc::Receiver<::safe_launcher::observer::AppHandlingEvent>,
    pending_add_request: ::std::sync::Arc<::std::sync::Mutex<::std::collections::HashMap<String, bool>>>,
}

impl EventLoop {
    pub fn new(launcher : &::safe_launcher::launcher::Launcher,
               app_lists: &::Lists) -> (::safe_core::utility::RAIIThreadJoiner,
                                        ::safe_launcher::observer::Observer<Terminate>) {
        let cloned_managed_apps = app_lists.managed_apps.clone();
        let cloned_running_apps = app_lists.running_apps.clone();
        let cloned_pending_add_request = app_lists.pending_add_request.clone();

        let (ipc_tx, ipc_rx) = ::std::sync::mpsc::channel();
        let (owner_tx, owner_rx) = ::std::sync::mpsc::channel();
        let (category_tx, category_rx) = ::std::sync::mpsc::channel();
        let (app_handling_tx, app_handling_rx) = ::std::sync::mpsc::channel();

        // Sync the list the first time
        let (managed_apps_tx, managed_apps_rx) = ::std::sync::mpsc::channel();
        eval_result!(launcher.get_app_handler_event_sender().send(::safe_launcher::launcher::AppHandlerEvent::GetAllManagedApps(managed_apps_tx)));
        *eval_result!(cloned_managed_apps.lock()) = eval_result!(eval_result!(managed_apps_rx.recv()));

        // Register observer to IPC events
        {
            let ipc_event_obs = ::safe_launcher::observer::IpcObserver::new(ipc_tx,
                                                                            ::safe_launcher ::observer
                                                                                            ::LauncherEventCategoy
                                                                                            ::IpcEvent,
                                                                            category_tx.clone());

            eval_result!(launcher.get_ipc_event_sender().send(::safe_launcher
                                                              ::launcher
                                                              ::IpcExternalEvent
                                                              ::RegisterVerifiedSessionObserver(ipc_event_obs)));
        }

        // Register observer to App Handling events
        {
            let app_event_obs = ::safe_launcher::observer::AppHandlerObserver::new(app_handling_tx,
                                                                                   ::safe_launcher::observer
                                                                                                  ::LauncherEventCategoy
                                                                                                  ::AppHandlingEvent,
                                                                                   category_tx.clone());

            eval_result!(launcher.get_app_handler_event_sender().send(::safe_launcher
                                                                      ::launcher
                                                                      ::AppHandlerEvent
                                                                      ::RegisterAppAddObserver(app_event_obs.clone())));
            eval_result!(launcher.get_app_handler_event_sender().send(::safe_launcher
                                                                      ::launcher
                                                                      ::AppHandlerEvent
                                                                      ::RegisterAppRemoveObserver(app_event_obs)));
        }

        let internal_event_sender = ::safe_launcher
                                    ::observer
                                    ::Observer
                                    ::<Terminate>
                                    ::new(owner_tx,
                                          ::safe_launcher::observer::LauncherEventCategoy::OwnerCategory,
                                          category_tx);

        let joiner = eval_result!(::std::thread::Builder::new()
                                                         .name(CLI_EVENT_LOOP_THREAD_NAME.to_string())
                                                         .spawn(move || {
            let event_loop = EventLoop {
                ipc_rx             : ipc_rx,
                owner_rx           : owner_rx,
                managed_apps       : cloned_managed_apps,
                running_apps       : cloned_running_apps,
                app_handling_rx    : app_handling_rx,
                pending_add_request: cloned_pending_add_request,
            };

            event_loop.run(category_rx);

            debug!("Exiting Thread {:?}", CLI_EVENT_LOOP_THREAD_NAME);
        }));

        (::safe_core::utility::RAIIThreadJoiner::new(joiner), internal_event_sender)
    }

    fn run(&self, category_rx: ::std::sync::mpsc::Receiver<::safe_launcher::observer::LauncherEventCategoy>) {
        for it in category_rx.iter() {
            match it {
                ::safe_launcher::observer::LauncherEventCategoy::IpcEvent => {
                    if let Ok(app_handling_event) = self.ipc_rx.try_recv() {
                        match app_handling_event {
                            ::safe_launcher::observer::IpcEvent::VerifiedSessionUpdate(data) => self.on_verified_session_update(data),
                            _ => println!("Ignoring incoming event {:?} for this example.", app_handling_event),
                        }
                    }
                },
                ::safe_launcher::observer::LauncherEventCategoy::AppHandlingEvent => {
                    if let Ok(app_handling_event) = self.app_handling_rx.try_recv() {
                        match app_handling_event {
                            ::safe_launcher::observer::AppHandlingEvent::AppAdded(data) => self.on_add_app(data),
                            ::safe_launcher::observer::AppHandlingEvent::AppRemoved(data) => self.on_remove_app(data),
                        }
                    }
                },
                ::safe_launcher::observer::LauncherEventCategoy::OwnerCategory => {
                    if let Ok(_terminate) = self.owner_rx.try_recv() {
                        break;
                    }
                },
            }
        }
    }

    fn on_verified_session_update(&self, data: ::safe_launcher::observer::event_data::VerifiedSession) {
        match data.action {
            ::safe_launcher::observer::event_data::Action::Added => eval_result!(self.running_apps.lock()).push(data.id),
            ::safe_launcher::observer::event_data::Action::Removed(err_opt) => {
                let ref mut running_apps = *eval_result!(self.running_apps.lock());

                if let Some(err) = err_opt {
                    println!("Session {:?} removed due to {:?}", data.id, err);
                }

                let remove_id = data.id;
                if let Some(pos) = running_apps.iter().position(|id| *id == remove_id) {
                    let _ = running_apps.remove(pos);
                }
            },
        }
    }

    fn on_add_app(&self, data: ::safe_launcher::observer::event_data::AppAdded) {
        let safe_drive_access = eval_option!(eval_result!(self.pending_add_request.lock()).remove(&data.local_path),
                                                          "Logic Error - Main thread should have put this data in here by now - Report a bug.");
        match data.result {
            Ok(app_id) => {
                let managed_app = ::safe_launcher::launcher::event_data::ManagedApp {
                    id               : app_id,
                    local_path       : Some(data.local_path),
                    reference_count  : 1,
                    safe_drive_access: safe_drive_access,
                };
                eval_result!(self.managed_apps.lock()).push(managed_app);
            },
            Err(err) => println!("Error {:?} adding app {:?} to Launcher", err, data.local_path),
        }
    }

    fn on_remove_app(&self, data: ::safe_launcher::observer::event_data::AppRemoved) {
        match data.result {
            Some(err) => println!("Error {:?} removing app from Launcher", err),
            None => {
                let ref mut managed_apps = *eval_result!(self.managed_apps.lock());

                if let Some(pos) = managed_apps.iter().position(|element| element.id == data.id) {
                    let _ = managed_apps.remove(pos);
                }
            },
        }
    }
}
