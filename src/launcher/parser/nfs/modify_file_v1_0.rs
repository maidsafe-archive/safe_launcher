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
pub struct ModifyFile {
    file_path     : String,
    new_values    : OptionalParams,
    is_path_shared: bool,
}

impl ::launcher::parser::traits::Action for ModifyFile {
    fn execute(&mut self, params: ::launcher::parser::ParameterPacket) -> ::launcher::parser::ResponseType {
        use rustc_serialize::base64::FromBase64;

        if self.is_path_shared && !*eval_result!(params.safe_drive_access.lock()) {
            return Err(::errors::LauncherError::PermissionDenied)
        }

        if self.new_values.name.is_none() &&
           self.new_values.user_metadata.is_none() &&
           self.new_values.content.is_none() {
            return Err(::errors::LauncherError::from("Optional parameters could not be parsed"));
        }

        let start_dir_key = if self.is_path_shared {
            &params.safe_drive_dir_key
        } else {
            &params.app_root_dir_key
        };

        let mut tokens = ::launcher::parser::helper::tokenise_path(&self.file_path, false);
        let file_name = try!(tokens.pop().ok_or(::errors::LauncherError::InvalidPath));
        let mut dir_of_file = try!(::launcher::parser::helper::get_final_subdirectory(params.client.clone(),
                                                                                      &tokens,
                                                                                      Some(start_dir_key)));

        let mut file = try!(dir_of_file.find_file(&file_name).map(|file| file.clone()).ok_or(::errors::LauncherError::InvalidPath));

        let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(params.client);

        let mut metadata_updated = false;
        if let Some(ref name) = self.new_values.name {
            file.get_mut_metadata().set_name(name.clone());
            metadata_updated = true;
        }

        if let Some(ref metadata_base64) = self.new_values.user_metadata {
            let metadata = try!(parse_result!(metadata_base64.from_base64(), "Failed to convert from base64"));
            file.get_mut_metadata().set_user_metadata(metadata);
            metadata_updated = true;
        }

        if metadata_updated {
            let _ = try!(file_helper.update_metadata(file.clone(), &mut dir_of_file));
        }

        if let Some(ref file_content_params) = self.new_values.content {
            let mode = if file_content_params.overwrite {
                ::safe_nfs::helper::writer::Mode::Overwrite
            } else {
                ::safe_nfs::helper::writer::Mode::Modify
            };
            let offset = match mode {
                ::safe_nfs::helper::writer::Mode::Overwrite => 0,
                ::safe_nfs::helper::writer::Mode::Modify    => file_content_params.offset
            };
            let mut writer = try!(file_helper.update_content(file.clone(), mode, dir_of_file));
            let bytes = try!(parse_result!(file_content_params.bytes.from_base64(), "Failed to convert from base64"));
            writer.write(&bytes[..], offset);
            let _ = try!(writer.close());
        }

        Ok(None)
    }
}

#[derive(Debug)]
struct OptionalParams {
    pub name         : Option<String>,
    pub content      : Option<FileContentParams>,
    pub user_metadata: Option<String>,
}

impl ::rustc_serialize::Decodable for OptionalParams {
    fn decode<D>(decoder: &mut D) -> Result<Self, D::Error>
                                     where D: ::rustc_serialize::Decoder {
        Ok(OptionalParams {
            name         : decoder.read_struct_field("name", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            content      : decoder.read_struct_field("content", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            user_metadata: decoder.read_struct_field("user_metadata", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
        })
    }
}

#[derive(RustcDecodable, Debug)]
struct FileContentParams {
    pub bytes    : String,
    pub offset   : u64,
    // TODO(Krishna) This should not be required - Specifying both offset and overwrite does not
    // make sense
    pub overwrite: bool,
}

#[cfg(test)]
mod test {
    use super::*;
    use ::launcher::parser::traits::Action;
    use rustc_serialize::base64::ToBase64;

    const TEST_FILE_NAME: &'static str = "test_file.txt";
    const METADATA_BASE64: &'static str = "c2FtcGxlIHRleHQ=";

    fn create_test_file(parameter_packet: &::launcher::parser::ParameterPacket) {
        let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(parameter_packet.client.clone());
        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(parameter_packet.client.clone());
        let app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        let writer = eval_result!(file_helper.create(TEST_FILE_NAME.to_string(),
                                                     Vec::new(),
                                                     app_root_dir));
        let _ = eval_result!(writer.close());
    }

    #[test]
    pub fn file_rename() {
        let parameter_packet = eval_result!(::launcher::parser::test_utils::get_parameter_packet(false));

        create_test_file(&parameter_packet);

        let values = super::OptionalParams {
            name         : Some("new_test_file.txt".to_string()),
            content      : None,
            user_metadata: None
        };

        let mut request = ModifyFile {
            file_path     : format!("/{}", TEST_FILE_NAME),
            new_values    : values,
            is_path_shared: false,
        };

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(parameter_packet.client.clone());
        let mut app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        assert_eq!(app_root_dir.get_files().len(), 1);
        assert!(app_root_dir.find_file(&TEST_FILE_NAME.to_string()).is_some());
        let app_root_dir_key = parameter_packet.app_root_dir_key.clone();
        assert!(request.execute(parameter_packet).is_ok());
        app_root_dir = eval_result!(dir_helper.get(&app_root_dir_key));
        assert_eq!(app_root_dir.get_files().len(), 1);
        assert!(app_root_dir.find_file(&TEST_FILE_NAME.to_string()).is_none());
        assert!(app_root_dir.find_file(&"new_test_file.txt".to_string()).is_some());
    }

    #[test]
    pub fn file_update_user_metadata() {
        let parameter_packet = eval_result!(::launcher::parser::test_utils::get_parameter_packet(false));

        create_test_file(&parameter_packet);

        let values = super::OptionalParams {
            name         : None,
            content      : None,
            user_metadata: Some(METADATA_BASE64.to_string()),
        };

        let mut request = ModifyFile {
            file_path     : format!("/{}", TEST_FILE_NAME),
            new_values    : values,
            is_path_shared: false,
        };

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(parameter_packet.client.clone());
        let app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        let file = eval_option!(app_root_dir.find_file(&TEST_FILE_NAME.to_string()), "File not found");
        assert_eq!(file.get_metadata().get_user_metadata().len(), 0);
        let app_root_dir_key = parameter_packet.app_root_dir_key.clone();
        assert!(request.execute(parameter_packet).is_ok());
        let app_root_dir = eval_result!(dir_helper.get(&app_root_dir_key));
        let file = eval_option!(app_root_dir.find_file(&TEST_FILE_NAME.to_string()), "File not found");
        assert!(file.get_metadata().get_user_metadata().len() > 0);
        assert_eq!(file.get_metadata().get_user_metadata().to_base64(::config::get_base64_config()), METADATA_BASE64.to_string());
    }

    #[test]
    pub fn file_update_content() {
        let parameter_packet = eval_result!(::launcher::parser::test_utils::get_parameter_packet(false));

        create_test_file(&parameter_packet);

        let content = super::FileContentParams {
            bytes    : METADATA_BASE64.to_string(),
            offset   : 0,
            overwrite: true,
        };

        let values = super::OptionalParams {
            name         : None,
            content      : Some(content),
            user_metadata: None,
        };

        let mut request = ModifyFile {
            file_path     : format!("/{}", TEST_FILE_NAME),
            new_values    : values,
            is_path_shared: false,
        };

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(parameter_packet.client.clone());
        let app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        let file = eval_option!(app_root_dir.find_file(&TEST_FILE_NAME.to_string()), "File not found");
        assert_eq!(file.get_metadata().get_size(), 0);
        let app_root_dir_key = parameter_packet.app_root_dir_key.clone();
        assert!(request.execute(parameter_packet.clone()).is_ok());
        let app_root_dir = eval_result!(dir_helper.get(&app_root_dir_key));
        let file = eval_option!(app_root_dir.find_file(&TEST_FILE_NAME.to_string()), "File not found");
        let file_size = file.get_metadata().get_size();
        assert!(file_size > 0);
        let file_helper = ::safe_nfs::helper::file_helper::FileHelper::new(parameter_packet.client.clone());
        let mut reader = file_helper.read(file);
        let size = reader.size();
        assert_eq!(size, file_size);
        let data = eval_result!(reader.read(0, size));
        assert_eq!(data.to_base64(::config::get_base64_config()), METADATA_BASE64.to_string());
    }
}
