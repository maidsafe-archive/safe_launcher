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

#[derive(Debug)]
pub struct Terminate;

pub fn run_event_loop(launcher : &::safe_launcher::launcher::Launcher,
                      app_lists: &::Lists) -> (::safe_core::utility::RAIIThreadJoiner,
                                               ::safe_launcher::observer::Observer<Terminate>) {
    let cloned_managed_apps = app_lists.managed_apps.clone();
    let _cloned_running_apps = app_lists.running_apps.clone(); // TODO(Spandan) remove leading underscore

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
                                                     .name("CLI-Event-Loop".to_string())
                                                     .spawn(move || {
        for it in category_rx.iter() {
            match it {
                ::safe_launcher::observer::LauncherEventCategoy::IpcEvent => {
                    if let Ok(app_handling_event) = ipc_rx.try_recv() {
                        match app_handling_event {
                            ::safe_launcher::observer::IpcEvent::VerifiedSessionUpdate(_) => unimplemented!(),
                            _ => println!("Ignoring incoming event {:?} for this example.", app_handling_event),
                        }
                    }
                },
                ::safe_launcher::observer::LauncherEventCategoy::AppHandlingEvent => {
                    if let Ok(app_handling_event) = app_handling_rx.try_recv() {
                        match app_handling_event {
                            ::safe_launcher::observer::AppHandlingEvent::AppAdded(_) => unimplemented!(),
                            ::safe_launcher::observer::AppHandlingEvent::AppRemoved(_) => unimplemented!(),
                        }
                    }
                },
                ::safe_launcher::observer::LauncherEventCategoy::OwnerCategory => {
                    if let Ok(_terminate) = owner_rx.try_recv() {
                        break;
                    }
                },
            }
        }
    }));

    (::safe_core::utility::RAIIThreadJoiner::new(joiner), internal_event_sender)
}
