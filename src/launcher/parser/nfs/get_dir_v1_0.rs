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

#[derive(RustcDecodable, Debug)]
pub struct GetDir {
    dir_path      : String,
    timeout_ms    : i64,
    is_path_shared: bool,
}

impl ::launcher::parser::traits::Action for GetDir {
    fn execute(&mut self, params: ::launcher::parser::ParameterPacket) -> ::launcher::parser::ResponseType {
        if self.is_path_shared && !*eval_result!(params.safe_drive_access.lock()) {
            return Err(::errors::LauncherError::PermissionDenied)
        }

        let start_dir_key = if self.is_path_shared {
            &params.safe_drive_dir_key
        } else {
            &params.app_root_dir_key
        };

        let tokens = ::launcher::parser::helper::tokenise_path(&self.dir_path, false);
        let dir_fetched = try!(::launcher::parser::helper::get_final_subdirectory(params.client.clone(),
                                                                                  &tokens,
                                                                                  Some(start_dir_key)));
        let dir_info = get_directory_info(dir_fetched.get_metadata());
        let mut sub_dirs: Vec<DirectoryInfo> = Vec::with_capacity(dir_fetched.get_sub_directories().len());
        for metadata in dir_fetched.get_sub_directories() {
            sub_dirs.push(get_directory_info(metadata));
        }

        let mut files: Vec<FileInfo> = Vec::with_capacity(dir_fetched.get_files().len());
        for file in dir_fetched.get_files() {
            files.push(get_file_info(file.get_metadata()));
        }

        let response = GetDirResponse {
            info           : dir_info,
            files          : files,
            sub_directories: sub_dirs,
        };

        Ok(Some(try!(::rustc_serialize::json::encode(&response))))
    }
}

fn get_directory_info(dir_metadata: &::safe_nfs::metadata::directory_metadata::DirectoryMetadata) -> DirectoryInfo {
    use rustc_serialize::base64::ToBase64;

    let dir_key = dir_metadata.get_key();
    let created_time = dir_metadata.get_created_time().to_timespec();
    let modified_time = dir_metadata.get_modified_time().to_timespec();
    DirectoryInfo {
        name                  : dir_metadata.get_name().clone(),
        is_private            : *dir_key.get_access_level() == ::safe_nfs::AccessLevel::Private,
        is_versioned          : dir_key.is_versioned(),
        user_metadata         : (*dir_metadata.get_user_metadata()).to_base64(::config::get_base64_config()),
        creation_time_sec     : created_time.sec,
        creation_time_nsec    : created_time.nsec as i64,
        modification_time_sec : modified_time.sec,
        modification_time_nsec: modified_time.nsec as i64,
    }
}

fn get_file_info(file_metadata: &::safe_nfs::metadata::file_metadata::FileMetadata) -> FileInfo {
    use rustc_serialize::base64::ToBase64;

    let created_time = file_metadata.get_created_time().to_timespec();
    let modified_time = file_metadata.get_modified_time().to_timespec();
    FileInfo {
        name                  : file_metadata.get_name().clone(),
        size                  : file_metadata.get_size() as i64,
        user_metadata         : (*file_metadata.get_user_metadata()).to_base64(::config::get_base64_config()),
        creation_time_sec     : created_time.sec,
        creation_time_nsec    : created_time.nsec as i64,
        modification_time_sec : modified_time.sec,
        modification_time_nsec: modified_time.nsec as i64,
    }
}

#[derive(RustcEncodable, Debug)]
struct GetDirResponse {
    info           : DirectoryInfo,
    files          : Vec<FileInfo>,
    sub_directories: Vec<DirectoryInfo>,
}

#[derive(RustcEncodable, Debug)]
struct DirectoryInfo {
    name                  : String,
    is_private            : bool,
    is_versioned          : bool,
    user_metadata         : String,
    creation_time_sec     : i64,
    creation_time_nsec    : i64,
    modification_time_sec : i64,
    modification_time_nsec: i64,
}

#[derive(RustcEncodable, Debug)]
struct FileInfo {
    name                  : String,
    size                  : i64,
    user_metadata         : String,
    creation_time_sec     : i64,
    creation_time_nsec    : i64,
    modification_time_sec : i64,
    modification_time_nsec: i64,
}


#[cfg(test)]
mod test {
    use ::launcher::parser::traits::Action;

    const TEST_DIR_NAME: &'static str = "test_dir";

    fn create_test_dir(parameter_packet: &::launcher::parser::ParameterPacket) {
        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(parameter_packet.client.clone());
        let mut app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        let _ = eval_result!(dir_helper.create(TEST_DIR_NAME.to_string(),
                                               ::safe_nfs::UNVERSIONED_DIRECTORY_LISTING_TAG,
                                               Vec::new(),
                                               false,
                                               ::safe_nfs::AccessLevel::Private,
                                               Some(&mut app_root_dir)));
    }

    #[test]
    fn get_dir() {
        let parameter_packet = eval_result!(::launcher::parser::test_utils::get_parameter_packet(false));

        create_test_dir(&parameter_packet);

        let mut request = super::GetDir {
            dir_path      : format!("/{}", TEST_DIR_NAME),
            timeout_ms    : 1000,
            is_path_shared: false,
        };

        assert!(eval_result!(request.execute(parameter_packet.clone())).is_some());

        request.dir_path = "/does_not_exixts".to_string();
        assert!(request.execute(parameter_packet).is_err());
    }

}
