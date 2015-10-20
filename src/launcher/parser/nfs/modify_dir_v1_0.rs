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

        if self.is_path_shared && !*eval_result!(params.safe_drive_access.lock()) {
            return Err(::errors::LauncherError::PermissionDenied)
        }

        let start_dir_key = if self.is_path_shared {
            &params.safe_drive_dir_key
        } else {
            &params.app_root_dir_key
        };

        let mut tokens = ::launcher::parser::helper::tokenise_path(&self.dir_path, false);
        let mut dir_to_modify = try!(::launcher::parser::helper::get_final_subdirectory(params.client.clone(),
                                                                                        &tokens,
                                                                                        Some(start_dir_key)));

        unimplemented!();

        Ok(None)
    }
}

#[derive(Debug)]
struct OptionalParams {
    pub name                  : Option<String>,
    pub is_private            : Option<bool>,
    pub is_versioned          : Option<bool>,
    pub user_metadata         : Option<String>,
    pub modification_time_sec : Option<i64>,
    pub modification_time_nsec: Option<i64>,
}

impl ::rustc_serialize::Decodable for OptionalParams {
    fn decode<D>(decoder: &mut D) -> Result<Self, D::Error>
                                     where D: ::rustc_serialize::Decoder {
        Ok(OptionalParams {
            name: decoder.read_struct_field("dir_path", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            is_private: decoder.read_struct_field("is_private", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            is_versioned: decoder.read_struct_field("is_versioned", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            user_metadata: decoder.read_struct_field("user_metadata", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            modification_time_sec: decoder.read_struct_field("modification_time_sec", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
            modification_time_nsec: decoder.read_struct_field("modification_time_sec", 0, |d| ::rustc_serialize::Decodable::decode(d)).ok(),
        })
    }
}
