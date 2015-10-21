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
pub struct ModifyDir {
    dir_path      : String,
    new_values    : OptionalParams,
    is_path_shared: bool,
}

impl ::launcher::parser::traits::Action for ModifyDir {
    fn execute(&mut self, params: ::launcher::parser::ParameterPacket) -> ::launcher::parser::ResponseType {
        use rustc_serialize::base64::FromBase64;

        if !(self.new_values.name.is_some() || self.new_values.user_metadata.is_some()) {
            return Err(::errors::LauncherError::from("Optional parameters could not be parsed"));
        }

        if self.is_path_shared && !*eval_result!(params.safe_drive_access.lock()) {
            return Err(::errors::LauncherError::PermissionDenied)
        }

        let start_dir_key = if self.is_path_shared {
            &params.safe_drive_dir_key
        } else {
            &params.app_root_dir_key
        };

        let tokens = ::launcher::parser::helper::tokenise_path(&self.dir_path, false);
        let mut dir_to_modify = try!(::launcher::parser::helper::get_final_subdirectory(params.client.clone(),
                                                                                        &tokens,
                                                                                        Some(start_dir_key)));

        let directory_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(params.client);
        if let Some(ref name) = self.new_values.name {
            dir_to_modify.get_mut_metadata().set_name(name.clone());
        }

        if let Some(ref metadata_base64) = self.new_values.user_metadata {
            let metadata = try!(parse_result!(metadata_base64.from_base64(), "Failed to convert from base64"));
            dir_to_modify.get_mut_metadata().set_user_metadata(metadata);
        }

        let _ = try!(directory_helper.update(&dir_to_modify));

        Ok(None)
    }
}
// TODO Below are the deviations from the RFC parameters
// modified time stamp can not be updated via NFS API
// NFS Api does not permit changing the private to public accesslevel
// versioning can not be changed too
#[derive(Debug)]
struct OptionalParams {
    pub name         : Option<String>,
    pub user_metadata: Option<String>,
}

impl ::rustc_serialize::Decodable for OptionalParams {
    fn decode<D>(decoder: &mut D) -> Result<Self, D::Error>
                                     where D: ::rustc_serialize::Decoder {
        Ok(OptionalParams {
            name         : decoder.read_struct_field("dir_path", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            user_metadata: decoder.read_struct_field("user_metadata", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
        })
    }
}
