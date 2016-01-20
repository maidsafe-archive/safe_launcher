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

use std::collections::HashMap;
use std::fs::File;
use std::path;

use errors::LauncherError;
use safe_nfs::metadata::directory_key::DirectoryKey;
use xor_name::XorName;

#[derive(Clone, Debug, RustcEncodable, RustcDecodable)]
pub struct LauncherConfiguration {
    pub app_id: XorName,
    pub app_name: String,
    pub reference_count: u32,
    pub app_root_dir_key: DirectoryKey,
    pub safe_drive_access: bool,
}

// (Spandan)
// This is a hack because presently cbor isn't able to decode/encode HashMap<NameType, String>
// properly
pub fn convert_hashmap_to_vec(hashmap: &HashMap<XorName, String>) -> Vec<(XorName, String)> {
    hashmap.iter().map(|a| (a.0.clone(), a.1.clone())).collect()
}

// (Spandan)
// This is a hack because presently cbor isn't able to decode/encode HashMap<NameType, String>
// properly
pub fn convert_vec_to_hashmap(vec: Vec<(XorName, String)>) -> HashMap<XorName, String> {
    vec.into_iter().collect()
}

pub fn read_local_config_file() -> Result<Vec<u8>, LauncherError> {
    use std::io::Read;

    let path = try!(get_local_config_file());

    match File::open(path) {
        Ok(mut file) => {
            let mut raw_disk_data =
                Vec::with_capacity(unwrap_result!(file.metadata()).len() as usize);
            match file.read_to_end(&mut raw_disk_data) {
                Ok(_) => return Ok(raw_disk_data),
                Err(err) => debug!("{:?} - Unable to open local config file", err),
            }
        }
        Err(err) => debug!("{:?} - Unable to open local config file", err),
    }

    Ok(Vec::new())
}

pub fn flush_to_local_config(raw_data: &[u8]) -> Result<(), LauncherError> {
    use std::io::Write;

    let path = try!(get_local_config_file());

    let mut file = try!(File::create(path).map_err(|e| {
        LauncherError::LocalConfigAccessFailed(format!("{:?} - Unable to create.", e))
    }));
    try!(file.write_all(&raw_data).map_err(|e| {
        LauncherError::LocalConfigAccessFailed(format!("{:?} - Unable to write.", e))
    }));

    Ok(try!(file.sync_all().map_err(|e| {
        LauncherError::LocalConfigAccessFailed(format!("{:?} - Unable to sync.", e))
    })))
}

fn get_local_config_file() -> Result<path::PathBuf, LauncherError> {
    let mut config_dir_pathbuf = try!(::std::env::home_dir()
                 .ok_or(LauncherError::LocalConfigAccessFailed("Unable to get user's \
                                                                Home Directory."
                                                                .to_string())));
    config_dir_pathbuf.push(::config::LAUNCHER_LOCAL_CONFIG_FILE_NAME);

    Ok(config_dir_pathbuf)
}
