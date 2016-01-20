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

use std::sync::{Arc, Mutex};

use errors::LauncherError;
use launcher::parser::ParameterPacket;
use safe_core::utility::test_utils;
use safe_nfs::helper::directory_helper::DirectoryHelper;
use safe_nfs::{AccessLevel, UNVERSIONED_DIRECTORY_LISTING_TAG};

pub fn get_parameter_packet(has_safe_drive_access: bool) -> Result<ParameterPacket, LauncherError> {
    let client = Arc::new(Mutex::new(try!(test_utils::get_client())));
    let directory_helper = DirectoryHelper::new(client.clone());
    let mut user_root_dir = try!(directory_helper.get_user_root_directory_listing());
    let (safe_drive, _) = try!(directory_helper.create(::config::SAFE_DRIVE_DIR_NAME.to_string(),
                                                       UNVERSIONED_DIRECTORY_LISTING_TAG,
                                                       Vec::new(),
                                                       false,
                                                       AccessLevel::Private,
                                                       Some(&mut user_root_dir)));
    let (test_app, _) = try!(directory_helper.create("Test_Application".to_string(),
                                                     UNVERSIONED_DIRECTORY_LISTING_TAG,
                                                     Vec::new(),
                                                     false,
                                                     AccessLevel::Private,
                                                     Some(&mut user_root_dir)));
    Ok(ParameterPacket {
        client: client,
        app_root_dir_key: test_app.get_key().clone(),
        safe_drive_access: Arc::new(Mutex::new(has_safe_drive_access)),
        safe_drive_dir_key: safe_drive.get_key().clone(),
    })
}
