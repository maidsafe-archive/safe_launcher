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

/// Events that can be communicated to the IPC-handling module.
pub use self::ipc_server::events::ExternalEvent as IpcExternalEvent;
/// Events that can be communicated to the app-handling module.
pub use self::app_handler::events::{AppHandlerEvent, event_data as app_handler_event_data};

use maidsafe_utilities::thread::RaiiThreadJoiner;

mod parser;
mod ipc_server;
mod app_handler;

/// A self-managed Launcher. This is a packet which will intilise and store the library state.
/// Dropping this packet would be enough to gracefully exit the library by initiaing a domino
/// effect via RAII.
///
/// It is intended that the main thread be the owner of this. In order for multiple threads to tap
/// into observer registration facility all that is need to be done is use one of the getters to
/// event senders, clone it and distribute it to other threads. These event senders will help
/// communicate with the core library in a completely asynchronous and thread safe manner.
pub struct Launcher {
    _raii_joiners           : Vec<RaiiThreadJoiner>,
    ipc_event_sender        : ipc_server::EventSenderToServer<IpcExternalEvent>,
    app_handler_event_sender: ::std::sync::mpsc::Sender<AppHandlerEvent>,
}

impl Launcher {
    /// Creates a new self-managed Launcher instance, which is a packet that will intilise and
    /// store the library state. Dropping this packet would be enough to gracefully exit the
    /// library by initiaing a domino effect via RAII.
    pub fn new(client: ::safe_core::client::Client) -> Result<Launcher, ::errors::LauncherError> {
        let client = ::std::sync::Arc::new(::std::sync::Mutex::new(client));

        let directory_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(client.clone());

        let launcher_config_dir_name = ::config::LAUNCHER_GLOBAL_DIRECTORY_NAME.to_string();
        let launcher_config_dir = try!(directory_helper.get_configuration_directory_listing(launcher_config_dir_name));

        if launcher_config_dir.get_files()
                              .iter()
                              .find(|file| file.get_name() == ::config::LAUNCHER_GLOBAL_CONFIG_FILE_NAME)
                              .is_none() {
            let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(client.clone());
            let writer = try!(file_helper.create(::config::LAUNCHER_GLOBAL_CONFIG_FILE_NAME.to_string(),
                                                 Vec::new(),
                                                 launcher_config_dir));
            let _ = try!(writer.close());
        }

        let mut user_root_directory = try!(directory_helper.get_user_root_directory_listing());
        let safe_drive_dir_name = ::config::SAFE_DRIVE_DIR_NAME.to_string();
        if user_root_directory.find_sub_directory(&safe_drive_dir_name).is_none() {
           let _  = try!(directory_helper.create(safe_drive_dir_name,
                                                 ::safe_nfs::UNVERSIONED_DIRECTORY_LISTING_TAG,
                                                 Vec::new(),
                                                 false,
                                                 ::safe_nfs::AccessLevel::Private,
                                                 Some(&mut user_root_directory)));
        }

        let (ipc_raii_joiner, ipc_event_sender) = try!(ipc_server::IpcServer::new(client.clone()));
        let (app_raii_joiner, app_event_sender) = app_handler::AppHandler::new(client, ipc_event_sender.clone());

        Ok(Launcher {
            _raii_joiners           : vec![app_raii_joiner, ipc_raii_joiner],
            ipc_event_sender        : ipc_event_sender,
            app_handler_event_sender: app_event_sender,
        })
    }

    /// Event Sender to communicate with the IPC Server, for e.g. to register observers etc.
    pub fn get_ipc_event_sender(&self) -> &ipc_server::EventSenderToServer<IpcExternalEvent> {
        &self.ipc_event_sender
    }

    /// Event Sender to communicate with the App Handler, for e.g. to register observers, add an app
    /// to Laucher, remove or modify an already added app, etc.
    pub fn get_app_handler_event_sender(&self) -> &::std::sync::mpsc::Sender<AppHandlerEvent> {
        &self.app_handler_event_sender
    }
}

impl Drop for Launcher {
    fn drop(&mut self) {
        if let Err(err) = self.ipc_event_sender.send(IpcExternalEvent::Terminate) {
            debug!("Error {:?} terminating IPC-Server - Probably already terminated.", err);
        }
        if let Err(err) = self.app_handler_event_sender.send(AppHandlerEvent::Terminate) {
            debug!("Error {:?} terminating App-Handler - Probably already terminated.", err);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initialise_safe_drive_dir() {
        let pin = unwrap_result!(::safe_core::utility::generate_random_string(10));
        let keyword = unwrap_result!(::safe_core::utility::generate_random_string(10));
        let password = unwrap_result!(::safe_core::utility::generate_random_string(10));

        let client = unwrap_result!(::safe_core::client::Client::create_account(keyword.clone(),
                                                                                pin.clone(),
                                                                                password.clone()));

        let safe_drive_directory_name = ::config::SAFE_DRIVE_DIR_NAME.to_string();
        let arc_client = ::std::sync::Arc::new(::std::sync::Mutex::new(client));
        let directory_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(arc_client.clone());

        // client should not have SAFEDrive in user root directory
        {
            let user_root_directory = unwrap_result!(directory_helper.get_user_root_directory_listing());
            assert!(user_root_directory.find_sub_directory(&safe_drive_directory_name).is_none());
        }

        // Create Launcher instance
        {
            let client = unwrap_result!(::safe_core::client::Client::log_in(keyword, pin, password));
            let _ = Launcher::new(client);
        }

        // client should have SAFEDrive in user root directory
        {
            let user_root_directory = unwrap_result!(directory_helper.get_user_root_directory_listing());
            assert!(user_root_directory.find_sub_directory(&safe_drive_directory_name).is_some());
        }
    }

}
