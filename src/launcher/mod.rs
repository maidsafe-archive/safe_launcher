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

mod parser;
mod ipc_server;
mod app_handler;
mod observer_config;

/// Launcher exposes API for managing applications
#[derive(Clone)]
pub struct Launcher {
    client: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
}

impl Launcher {
    /// Creates a new Launcher instance
    pub fn new(client: ::safe_core::client::Client) -> Result<Launcher, ::errors::LauncherError> {
        let arc_client = ::std::sync::Arc::new(::std::sync::Mutex::new(client));

        let safe_drive_directory_name = ::config::SAFE_DRIVE_DIR_NAME.to_string();
        let launcher_config_directory_name = ::config::LAUNCHER_GLOBAL_DIRECTORY_NAME.to_string();

        let directory_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(arc_client.clone());
        let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(arc_client.clone());

        let mut user_root_directory = try!(directory_helper.get_user_root_directory_listing());
        // TODO(Krishna) also create empty launcher config file if it does not already exist
        let _ = try!(directory_helper.get_configuration_directory_listing(launcher_config_directory_name));
        if user_root_directory.find_sub_directory(&safe_drive_directory_name).is_none() {
           let _  = try!(directory_helper.create(safe_drive_directory_name,
                                                 ::safe_nfs::UNVERSIONED_DIRECTORY_LISTING_TAG,
                                                 Vec::new(),
                                                 false,
                                                 ::safe_nfs::AccessLevel::Private,
                                                 Some(&mut user_root_directory)));
        }

        Ok(Launcher {
            client: arc_client,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    pub fn initialise_safe_drive_dir() {
        let keyword = eval_result!(::safe_core::utility::generate_random_string(10));
        let pin = eval_result!(::safe_core::utility::generate_random_string(10));
        let password = eval_result!(::safe_core::utility::generate_random_string(10));
        let client = eval_result!(::safe_core::client::Client::create_account(keyword.clone(),
                                                                              pin.clone(),
                                                                              password.clone()));

        let safe_drive_directory_name = ::config::SAFE_DRIVE_DIR_NAME.to_string();
        let arc_client = ::std::sync::Arc::new(::std::sync::Mutex::new(client));
        let directory_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(arc_client.clone());
        { // client should not have SAFEDrive in user root directory
            let user_root_directory = eval_result!(directory_helper.get_user_root_directory_listing());
            assert!(user_root_directory.find_sub_directory(&safe_drive_directory_name).is_none());
        }
        { // Create Launcher instance
            let client = eval_result!(::safe_core::client::Client::log_in(keyword, pin, password));
            let _ = Launcher::new(client);
        }
        { // client should have SAFEDrive in user root directory
            let user_root_directory = eval_result!(directory_helper.get_user_root_directory_listing());
            assert!(user_root_directory.find_sub_directory(&safe_drive_directory_name).is_some());
        }
    }

}
