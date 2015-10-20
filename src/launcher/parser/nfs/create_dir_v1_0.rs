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
pub struct CreateDir {
    dir_path      : String,
    is_private    : bool,
    is_versioned  : bool,
    user_metadata : String,
    is_path_shared: bool,
}

impl ::launcher::parser::traits::Action for CreateDir {
    fn execute(&mut self, params: ::launcher::parser::ParameterPacket) -> ::launcher::parser::ResponseType {
        use rustc_serialize::base64::FromBase64;

        if self.is_path_shared && !*eval_result!(params.safe_drive_access.lock()) {
            return Err(::errors::LauncherError::PermissionDenied)
        }

        let mut tokens = ::launcher::parser::helper::tokenise_path(&self.dir_path, false);
        let dir_to_create = try!(tokens.pop().ok_or(::errors::LauncherError::InvalidPath));

        let start_dir_key = if self.is_path_shared {
            &params.safe_drive_dir_key
        } else {
            &params.app_root_dir_key
        };

        let mut parent_sub_dir = try!(::launcher::parser::helper::get_final_subdirectory(params.client.clone(),
                                                                                         &tokens,
                                                                                         Some(start_dir_key)));

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(params.client);

        let access_level = if self.is_private {
            ::safe_nfs::AccessLevel::Private
        } else {
            ::safe_nfs::AccessLevel::Public
        };

        let tag = if self.is_versioned {
            ::safe_nfs::VERSIONED_DIRECTORY_LISTING_TAG
        } else {
            ::safe_nfs::UNVERSIONED_DIRECTORY_LISTING_TAG
        };

        let bin_metadata = try!(parse_result!(self.user_metadata.from_base64(), "Faild Converting from Base64."));

        let _ = try!(dir_helper.create(dir_to_create,
                                       tag,
                                       bin_metadata,
                                       self.is_versioned,
                                       access_level,
                                       Some(&mut parent_sub_dir)));

        Ok(None)
    }
}
