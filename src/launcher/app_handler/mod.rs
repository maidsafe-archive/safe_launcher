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

mod misc;

const APP_HANDLER_THREAD_NAME: &'static str = "AppHandlerThread";

pub struct AppHandler {
    client                 : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
    launcher_endpoint      : String,
    local_config_data      : ::std::collections::HashMap<::routing::NameType, String>,
    app_add_observers      : Vec<::observer::AppHandlerObserver>,
    app_remove_observers   : Vec<::observer::AppHandlerObserver>,
    app_modify_observers   : Vec<::observer::AppHandlerObserver>,
    app_activate_observers : Vec<::observer::AppHandlerObserver>,
    ipc_server_event_sender: ::launcher
                             ::ipc_server
                             ::EventSenderToServer<::launcher
                                                   ::ipc_server
                                                   ::events::ExternalEvent>,
}

impl AppHandler {
    pub fn new(client      : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
               event_sender: ::launcher
                             ::ipc_server
                             ::EventSenderToServer<::launcher
                                                   ::ipc_server
                                                   ::events::ExternalEvent>) -> (::safe_core::utility::RAIIThreadJoiner,
                                                                                 ::std::sync::mpsc::Sender<events::AppHandlerEvent>) {
        use std::io::Read;

        let (event_tx, event_rx) = ::std::sync::mpsc::channel();

        let joiner = eval_result!(::std::thread::Builder::new().name(APP_HANDLER_THREAD_NAME.to_string())
                                                               .spawn(move || {
            let mut temp_dir_pathbuf = ::std::env::temp_dir();
            temp_dir_pathbuf.push(::config::LAUNCHER_LOCAL_CONFIG_FILE_NAME);

            let mut local_config_data = ::std::collections::HashMap::with_capacity(10);

            if let Ok(mut file) = ::std::fs::File::open(temp_dir_pathbuf) {
                let mut raw_disk_data = Vec::with_capacity(eval_result!(file.metadata()).len() as usize);
                if let Ok(_) = file.read_to_end(&mut raw_disk_data) {
                    if raw_disk_data.len() != 0 {
                        match eval_result!(client.lock()).hybrid_decrypt(&raw_disk_data, None) {
                            Ok(plain_text) => local_config_data = misc::convert_vec_to_hashmap(eval_result!(::safe_core
                                                                                                            ::utility
                                                                                                            ::deserialise(&plain_text))),
                            Err(err) => debug!("{:?} -> Local config file could not be read - either tampered or corrupted. Starting afresh...", err),
                        }
                    }
                }
            }

            let (tx, rx) = ::std::sync::mpsc::channel();
            if event_sender.send(::launcher::ipc_server::events::ExternalEvent::GetListenerEndpoint(tx)).is_ok() {
                if let Ok(launcher_endpoint) = rx.recv() {
                    let mut app_handler = AppHandler {
                        client                 : client,
                        launcher_endpoint      : launcher_endpoint,
                        local_config_data      : local_config_data,
                        app_add_observers      : Vec::with_capacity(2),
                        app_remove_observers   : Vec::with_capacity(2),
                        app_modify_observers   : Vec::with_capacity(2),
                        app_activate_observers : Vec::with_capacity(2),
                        ipc_server_event_sender: event_sender,
                    };

                    app_handler.run(event_rx);
                } else {
                    debug!("AppHandler <-> IPC-Server Communication failed - Probably Launcher was closed too soon.");
                }
            } else {
                debug!("AppHandler <-> IPC-Server Communication failed - Probably Launcher was closed too soon.");
            }

            debug!("Exiting thread {:?}", APP_HANDLER_THREAD_NAME);
        }));

        (::safe_core::utility::RAIIThreadJoiner::new(joiner), event_tx)
    }

    fn run(&mut self, event_rx: ::std::sync::mpsc::Receiver<events::AppHandlerEvent>) {
        for event in event_rx.iter() {
            match event {
                events::AppHandlerEvent::AddApp(app_detail)               => self.on_add_app(app_detail),
                events::AppHandlerEvent::RemoveApp(app_id)                => self.on_remove_app(app_id),
                events::AppHandlerEvent::ActivateApp(app_id)              => self.on_activate_app(app_id),
                events::AppHandlerEvent::GetAllManagedApps(obs)           => self.on_get_all_managed_apps(obs),
                events::AppHandlerEvent::ModifyAppSettings(data)          => self.on_modify_app_settings(data),
                events::AppHandlerEvent::RegisterAppAddObserver(obs)      => self.on_register_app_add_observer(obs),
                events::AppHandlerEvent::RegisterAppRemoveObserver(obs)   => self.on_register_app_remove_observer(obs),
                events::AppHandlerEvent::RegisterAppModifyObserver(obs)   => self.on_register_app_modify_observer(obs),
                events::AppHandlerEvent::RegisterAppActivateObserver(obs) => self.on_register_app_activate_observer(obs),
                events::AppHandlerEvent::Terminate => break,
            }
        }
    }

    fn on_add_app(&mut self, app_detail: events::event_data::AppDetail) {
        let abs_path = app_detail.absolute_path.clone();

        let reply = match self.on_add_app_impl(app_detail) {
            Ok(data) => data,
            Err(err) => ::observer::event_data::AppAddition {
                result    : Err(err),
                local_path: abs_path,
            },
        };

        group_send!(reply, &mut self.app_add_observers);
    }

    fn on_add_app_impl(&mut self, app_detail: events::event_data::AppDetail) -> Result<::observer::event_data::AppAddition,
                                                                                       ::errors::LauncherError> {
        {
            let mut paths = self.local_config_data.values();
            if let Some(_) = paths.find(|stored_path| **stored_path == app_detail.absolute_path) {
                return Err(::errors::LauncherError::AppAlreadyAdded)
            }
        }

        let app_id = ::routing::NameType::new(try!(::safe_core::utility::generate_random_array_u8_64()));

        let mut tokens = AppHandler::tokenise_path(&app_detail.absolute_path);
        let app_name = try!(tokens.pop().ok_or(::errors::LauncherError::InvalidPath));

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(self.client.clone());
        let mut root_dir_listing = try!(dir_helper.get_user_root_directory_listing());

        let app_dir_name = AppHandler::get_app_dir_name(&app_name, &root_dir_listing);
        let app_root_dir_key = match root_dir_listing.find_sub_directory(&app_dir_name).map(|dir| dir.clone()) {
            Some(app_dir) => app_dir.get_key().clone(),
            None => {
                try!(dir_helper.create(app_dir_name,
                                       ::safe_nfs::UNVERSIONED_DIRECTORY_LISTING_TAG,
                                       Vec::new(),
                                       false,
                                       ::safe_nfs::AccessLevel::Private,
                                       Some(&mut root_dir_listing))).0.get_key().clone()
            },
        };

        let new_launcher_config = misc::LauncherConfiguration {
            app_id           : app_id,
            app_name         : app_name.clone(),
            reference_count  : 1,
            app_root_dir_key : app_root_dir_key,
            safe_drive_access: app_detail.safe_drive_access,
        };
        try!(self.upsert_to_launcher_global_config(new_launcher_config));

        let _ = self.local_config_data.insert(app_id, app_detail.absolute_path.clone());

        let app_addition_data = ::observer::event_data::AppAdditionData {
            id  : app_id,
            name: app_name,
        };

        Ok(::observer::event_data::AppAddition {
            result    : Ok(app_addition_data),
            local_path: app_detail.absolute_path,
        })
    }

    fn on_activate_app(&mut self, app_id: ::routing::NameType) {
        let event = ::observer::AppHandlingEvent::AppActivation(self.on_activate_app_impl(app_id).map(|()| app_id));
        group_send!(event, &mut self.app_activate_observers);
    }

    fn on_activate_app_impl(&self, app_id: ::routing::NameType) -> Result<(), ::errors::LauncherError> {
        let global_configs = try!(self.get_launcher_global_config());

        let app_info = try!(global_configs.iter().find(|config| config.app_id == app_id).ok_or(::errors::LauncherError::AppNotRegistered));
        let app_binary_path = try!(self.local_config_data.get(&app_info.app_id).ok_or(::errors::LauncherError::PathNotFound));
        let str_nonce = try!(::safe_core::utility::generate_random_string(::config::LAUNCHER_NONCE_LENGTH));

        let activation_detail = ::launcher::ipc_server::events::event_data::ActivationDetail {
            nonce            : str_nonce.clone(),
            app_id           : app_info.app_id.clone(),
            app_root_dir_key : app_info.app_root_dir_key.clone(),
            safe_drive_access: app_info.safe_drive_access,
        };

        try!(send_one!(activation_detail,
                       &self.ipc_server_event_sender).map_err(|e| ::errors
                                                                  ::LauncherError
                                                                  ::Unexpected(format!("{:?} Could not communicate activation detail to IPC Server", e))));
        let command_line_arg = format!("tcp:{}:{}", self.launcher_endpoint, str_nonce);

        if let Err(err) = ::std::process::Command::new(app_binary_path)
                                                  .arg("--launcher")
                                                  .arg(command_line_arg)
                                                  .spawn() {
            if let Err(err) = self.ipc_server_event_sender.send(::launcher
                                                                ::ipc_server
                                                                ::events
                                                                ::ExternalEvent::EndSession(app_id)) {
                debug!("{:?} Error sending end-session signal to IPC Server.", err);
            }

            Err(::errors::LauncherError::AppActivationFailed(err))
        } else {
            Ok(())
        }
    }

    fn on_remove_app(&mut self, app_id: ::routing::NameType) {
        let reply = match self.on_remove_app_impl(app_id) {
            Ok(data) => {
                if let Err(err) = self.ipc_server_event_sender.send(::launcher
                                                                    ::ipc_server
                                                                    ::events
                                                                    ::ExternalEvent::EndSession(app_id)) {
                    debug!("{:?} Error sending end-session signal to IPC Server.", err);
                }

                data
            },
            Err(err) => ::observer::event_data::AppRemoval {
                id    : app_id,
                result: Some(err),
            },
        };

        group_send!(reply, &mut self.app_remove_observers);
    }

    // TODO(Krishna) Validate if eval_option! is really required
    fn on_remove_app_impl(&mut self, app_id: ::routing::NameType) -> Result<::observer::event_data::AppRemoval,
                                                                            ::errors::LauncherError> {
        let config_file_name = ::config::LAUNCHER_GLOBAL_CONFIG_FILE_NAME.to_string();

        let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(self.client.clone());
        let (mut launcher_configurations, dir_listing) = try!(self.get_launcher_global_config_and_dir());

        let position = eval_option!(launcher_configurations.iter().position(|config| config.app_id == app_id), "Logic Error - Report as bug.");
        let reference_count = launcher_configurations[position].reference_count;

        if reference_count == 1 {
            let _ = launcher_configurations.remove(position);
        } else {
             let config = eval_option!(launcher_configurations.get_mut(position), "Logic Error - Report as bug.");
             config.reference_count -= 1;
        }

        let file = eval_option!(dir_listing.find_file(&config_file_name).map(|file| file.clone()), "Logic Error - Report as bug.");
        let mut writer = try!(file_helper.update_content(file, ::safe_nfs::helper::writer::Mode::Overwrite, dir_listing));
        writer.write(&try!(::safe_core::utility::serialise(&launcher_configurations)), 0);
        let _ = try!(writer.close());

        if self.local_config_data.remove(&app_id).is_none() {
            debug!("Could not remove app from local config - app did not exist.");
        }

        Ok(::observer::event_data::AppRemoval {
            id    : app_id,
            result: None,
        })
    }

    fn on_modify_app_settings(&mut self, data: events::event_data::ModifyAppSettings) {
        let id = data.id;
        let reply = match self.on_modify_app_settings_impl(data) {
            Ok(data) => data,
            Err(err) => {
                ::observer::event_data::AppModification {
                    id    : id,
                    result: Err(err),
                }
            },
        };

        group_send!(reply, &mut self.app_modify_observers);
    }

    fn on_modify_app_settings_impl(&mut self,
                                   data: events::event_data::ModifyAppSettings) -> Result<::observer::event_data::AppModification,
                                                                                          ::errors::LauncherError> {
        let (mut global_configs, config_dir) = try!(self.get_launcher_global_config_and_dir());

        let mut global_config_modified = false;

        let mut modification_detail = ::observer::event_data::ModificationDetail {
            name             : None,
            local_path       : None,
            safe_drive_access: None,
        };

        {
            let app_info = try!(global_configs.iter_mut().find(|config| config.app_id == data.id).ok_or(::errors::LauncherError::AppNotRegistered));

            if let Some(safe_drive_access) = data.safe_drive_access {
                app_info.safe_drive_access = safe_drive_access;
                global_config_modified = true;

                if self.ipc_server_event_sender.send(::launcher
                                                     ::ipc_server
                                                     ::events
                                                     ::ExternalEvent
                                                     ::ChangeSafeDriveAccess(data.id, safe_drive_access)).is_err() {
                    debug!("Error asking IPC Server to change \"SAFEDrive\" permission for an app");
                }

                modification_detail.safe_drive_access = Some(safe_drive_access);
            }

            if let Some(new_name) = data.name {
                app_info.app_name = new_name.clone();
                global_config_modified = true;
                modification_detail.name = Some(new_name);
            }
        }

        if global_config_modified {
            let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(self.client.clone());
            // TODO(to Krishna) -> can we change nfs to not require the following clone() ?
            let file = eval_option!(config_dir.find_file(&::config::LAUNCHER_GLOBAL_CONFIG_FILE_NAME.to_string())
                                              .map(|file| file.clone()), "Logic Error - Report as bug.");
            let mut writer = try!(file_helper.update_content(file, ::safe_nfs::helper::writer::Mode::Overwrite, config_dir));
            writer.write(&try!(::safe_core::utility::serialise(&global_configs)), 0);
            let _ = try!(writer.close());
        }


        if let Some(new_path) = data.local_path {
            if let Some(prev_path) = self.local_config_data.insert(data.id, new_path.clone()) {
                debug!("Replacing previous path {:?} for this app on this machine.", prev_path);
            }

            modification_detail.local_path = Some(new_path);
        }

        Ok(::observer::event_data::AppModification {
            id    : data.id,
            result: Ok(modification_detail),
        })
    }

    fn on_register_app_add_observer(&mut self, observer: ::observer::AppHandlerObserver) {
        self.app_add_observers.push(observer);
    }

    fn on_register_app_remove_observer(&mut self, observer: ::observer::AppHandlerObserver) {
        self.app_remove_observers.push(observer);
    }

    fn on_register_app_activate_observer(&mut self, observer: ::observer::AppHandlerObserver) {
        self.app_activate_observers.push(observer);
    }

    fn on_register_app_modify_observer(&mut self, observer: ::observer::AppHandlerObserver) {
        self.app_modify_observers.push(observer);
    }

    fn on_get_all_managed_apps(&self, observer: ::std::sync::mpsc::Sender<Result<Vec<events::event_data::ManagedApp>,
                                                                                 ::errors::LauncherError>>) {
        let global_configs = eval_send_one!(self.get_launcher_global_config(), &observer);
        let mut managed_apps = Vec::with_capacity(global_configs.len());
        for it in global_configs.iter() {
            let local_path = if let Some(path) = self.local_config_data.get(&it.app_id) {
                Some(path.clone())
            } else {
                None
            };

            let managed_app = events::event_data::ManagedApp {
                id               : it.app_id,
                name             : it.app_name.clone(),
                local_path       : local_path,
                reference_count  : it.reference_count,
                safe_drive_access: it.safe_drive_access,
            };

            managed_apps.push(managed_app);
        }

        if let Err(err) = observer.send(Ok(managed_apps)) {
            debug!("{:?} Error communicating all managed apps to observer.", err);
        }
    }

    fn tokenise_path(path: &str) -> Vec<String> {
        path.split(|element| element == '/')
            .filter(|token| token.len() != 0)
            .map(|token| token.to_string())
            .collect()
    }

    fn get_app_dir_name(app_name         : &String,
                        directory_listing: &::safe_nfs::directory_listing::DirectoryListing) -> String {
        let mut dir_name = format!("{}-Root-Dir", &app_name);
        if directory_listing.find_sub_directory(&dir_name).is_some() {
            let mut index = 1u8;
            loop {
                dir_name = format!("{}-{}-Root-Dir", &app_name, index);
                if directory_listing.find_sub_directory(&dir_name).is_some() {
                    index += 1;
                } else {
                    break;
                }
            }
        }

        dir_name
    }

    fn get_launcher_global_config(&self) -> Result<Vec<misc::LauncherConfiguration>, ::errors::LauncherError> {
        Ok(try!(self.get_launcher_global_config_and_dir()).0)
    }

    fn upsert_to_launcher_global_config(&self, config: misc::LauncherConfiguration) -> Result<(), ::errors::LauncherError> {
        let (mut global_configs, dir_listing) = try!(self.get_launcher_global_config_and_dir());

        // (Spandan)
        // Due to bug in the language, unable to use `if let Some() .. else` logic to upsert to a vector.
        // Once the bug is resolved
        // - https://github.com/rust-lang/rust/issues/28449
        // then modify the following to use it.
        if let Some(pos) = global_configs.iter().position(|existing_config| existing_config.app_id == config.app_id) {
            let existing_config = eval_option!(global_configs.get_mut(pos), "Logic Error - Report bug.");
            *existing_config = config;
        } else {
            global_configs.push(config);
        }

        let file = eval_option!(dir_listing.get_files()
                                           .iter()
                                           .find(|file| file.get_name() == ::config::LAUNCHER_GLOBAL_CONFIG_FILE_NAME),
                                "Logic Error - Launcher start-up should ensure the file must be present at this stage - Report bug.").clone();

        let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(self.client.clone());
        let mut writer = try!(file_helper.update_content(file, ::safe_nfs::helper::writer::Mode::Overwrite, dir_listing));
        writer.write(&try!(::safe_core::utility::serialise(&global_configs)), 0);
        let _ = try!(writer.close());

        Ok(())
    }

    fn get_launcher_global_config_and_dir(&self) -> Result<(Vec<misc::LauncherConfiguration>,
                                                            ::safe_nfs::directory_listing::DirectoryListing),
                                                           ::errors::LauncherError> {
        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(self.client.clone());
        let dir_listing = try!(dir_helper.get_configuration_directory_listing(::config::LAUNCHER_GLOBAL_DIRECTORY_NAME.to_string()));

        let global_configs = {
            let file = eval_option!(dir_listing.get_files()
                                               .iter()
                                               .find(|file| file.get_name() == ::config::LAUNCHER_GLOBAL_CONFIG_FILE_NAME),
                                    "Logic Error - Launcher start-up should ensure the file must be present at this stage - Report bug.");

            let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(self.client.clone());
            let mut reader = file_helper.read(file);

            let size = reader.size();

            if size != 0 {
                try!(::safe_core::utility::deserialise(&try!(reader.read(0, size))))
            } else {
                Vec::new()
            }
        };

        Ok((global_configs, dir_listing))
    }
}

impl Drop for AppHandler {
    fn drop(&mut self) {
        use std::io::Write;

        let mut temp_dir_pathbuf = ::std::env::temp_dir();
        temp_dir_pathbuf.push(::config::LAUNCHER_LOCAL_CONFIG_FILE_NAME);

        let mut file = eval_result!(::std::fs::File::create(temp_dir_pathbuf));
        let plain_text = eval_result!(::safe_core
                                      ::utility
                                      ::serialise(&misc::convert_hashmap_to_vec(&self.local_config_data)));
        let cipher_text = eval_result!(eval_result!(self.client.lock()).hybrid_encrypt(&plain_text, None));
        let _ = file.write_all(&cipher_text);
        eval_result!(file.sync_all());
    }
}
