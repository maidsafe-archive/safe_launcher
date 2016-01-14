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

// TODO(Spanda) needs a get timeout - Modify Rfc

use std::collections::BTreeMap;

use rustc_serialize::json;

use errors::LauncherError;
use launcher::parser::{helper, ParameterPacket, ResponseType, traits};
use safe_nfs::helper::file_helper::FileHelper;
use safe_nfs::metadata::file_metadata::FileMetadata;

#[derive(RustcDecodable, Debug)]
pub struct GetFile {
    offset: i64,
    length: i64,
    file_path: String,
    is_path_shared: bool,
    include_metadata: bool,
}

impl traits::Action for GetFile {
    fn execute(&mut self, params: ParameterPacket) -> ResponseType {
        use rustc_serialize::json::ToJson;
        use rustc_serialize::base64::ToBase64;

        if self.is_path_shared && !*unwrap_result!(params.safe_drive_access.lock()) {
            return Err(LauncherError::PermissionDenied);
        }

        let mut tokens = helper::tokenise_path(&self.file_path, false);
        let file_name = try!(tokens.pop().ok_or(LauncherError::InvalidPath));

        let start_dir_key = if self.is_path_shared {
            &params.safe_drive_dir_key
        } else {
            &params.app_root_dir_key
        };

        let file_dir = try!(helper::get_final_subdirectory(params.client.clone(),
                                                           &tokens,
                                                           Some(start_dir_key)));
        let file = try!(file_dir.find_file(&file_name)
                                .ok_or(::errors::LauncherError::InvalidPath));

        let file_metadata = if self.include_metadata {
            Some(get_file_metadata(file.get_metadata()))
        } else {
            None
        };

        let file_helper = FileHelper::new(params.client);
        let mut reader = file_helper.read(&file);
        // TODO(Krishna) This is WRONG - see rfc.
        let mut size = self.length as u64;
        if size == 0 {
            size = reader.size();
        };
        let response = GetFileResponse {
            content: try!(reader.read(self.offset as u64, size))
                         .to_base64(::config::get_base64_config()),
            metadata: file_metadata,
        };

        Ok(Some(try!(json::encode(&response.to_json()))))
    }
}

fn get_file_metadata(file_metadata: &FileMetadata) -> Metadata {
    use rustc_serialize::base64::ToBase64;

    let created_time = file_metadata.get_created_time().to_timespec();
    let modified_time = file_metadata.get_modified_time().to_timespec();
    Metadata {
        name: file_metadata.get_name().clone(),
        size: file_metadata.get_size() as i64,
        user_metadata: (*file_metadata.get_user_metadata())
                           .to_base64(::config::get_base64_config()),
        creation_time_sec: created_time.sec,
        creation_time_nsec: created_time.nsec as i64,
        modification_time_sec: modified_time.sec,
        modification_time_nsec: modified_time.nsec as i64,
    }
}

#[derive(Debug)]
struct GetFileResponse {
    content: String,
    metadata: Option<Metadata>,
}

impl json::ToJson for GetFileResponse {
    fn to_json(&self) -> json::Json {
        let mut response_tree = BTreeMap::new();
        let _ = response_tree.insert("content".to_string(), self.content.to_json());
        if let Some(ref metadata) = self.metadata {
            let json_metadata_str = unwrap_result!(json::encode(metadata));
            let _ = response_tree.insert("metadata".to_string(), json_metadata_str.to_json());
        }

        json::Json::Object(response_tree)
    }
}

#[derive(RustcEncodable, Debug)]
struct Metadata {
    name: String,
    size: i64,
    user_metadata: String,
    creation_time_sec: i64,
    creation_time_nsec: i64,
    modification_time_sec: i64,
    modification_time_nsec: i64,
}

#[cfg(test)]
mod test {
    use launcher::parser::traits::Action;
    use launcher::parser::{ParameterPacket, test_utils};
    use safe_nfs::helper::file_helper::FileHelper;
    use safe_nfs::helper::directory_helper::DirectoryHelper;

    const TEST_FILE_NAME: &'static str = "test_file.txt";

    fn create_test_file(parameter_packet: &ParameterPacket) {
        let file_helper = FileHelper::new(parameter_packet.client.clone());
        let dir_helper = DirectoryHelper::new(parameter_packet.client.clone());
        let app_root_dir = unwrap_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        let mut writer = unwrap_result!(file_helper.create(TEST_FILE_NAME.to_string(),
                                                           Vec::new(),
                                                           app_root_dir));
        let data = vec![10u8; 20];
        writer.write(&data[..], 0);
        let _ = unwrap_result!(writer.close());
    }


    #[test]
    fn get_file() {
        let parameter_packet = unwrap_result!(test_utils::get_parameter_packet(false));

        create_test_file(&parameter_packet);

        let mut request = super::GetFile {
            offset: 0,
            length: 0,
            file_path: format!("/{}", TEST_FILE_NAME),
            is_path_shared: false,
            include_metadata: true,
        };

        assert!(unwrap_result!(request.execute(parameter_packet.clone())).is_some());

        request.file_path = "/does_not_exixts".to_string();
        assert!(request.execute(parameter_packet).is_err());
    }

}
