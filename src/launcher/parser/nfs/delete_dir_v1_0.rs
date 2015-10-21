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
pub struct DeleteDir {
    dir_path      : String,
    is_path_shared: bool,
}

impl ::launcher::parser::traits::Action for DeleteDir {
    fn execute(&mut self, params: ::launcher::parser::ParameterPacket) -> ::launcher::parser::ResponseType {

        let mut tokens = ::launcher::parser::helper::tokenise_path(&self.dir_path, false);
        let dir_to_delete = try!(tokens.pop().ok_or(::errors::LauncherError::InvalidPath));

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(params.client);

        let mut parent_dir = if self.is_path_shared {
            try!(dir_helper.get(&params.safe_drive_dir_key))
        } else {
            try!(dir_helper.get_user_root_directory_listing())
        };

        let _ = try!(dir_helper.delete(&mut parent_dir,
                                       &dir_to_delete));

        Ok(None)
    }
}
