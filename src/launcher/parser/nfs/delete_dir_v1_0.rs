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
            try!(dir_helper.get(&params.app_root_dir_key))
        };

        let _ = try!(dir_helper.delete(&mut parent_dir,
                                       &dir_to_delete));

        Ok(None)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use ::launcher::parser::traits::Action;

    #[test]
    fn delete_dir() {
        let parameter_packet = eval_result!(::launcher::parser::test_utils::get_parameter_packet(false));

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(parameter_packet.client.clone());
        let mut app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        let _ = eval_result!(dir_helper.create("test_dir".to_string(),
                                               ::safe_nfs::UNVERSIONED_DIRECTORY_LISTING_TAG,
                                               Vec::new(),
                                               false,
                                               ::safe_nfs::AccessLevel::Private,
                                               Some(&mut app_root_dir)));


        let mut request = DeleteDir {
            dir_path      : "/test_dir2".to_string(),
            is_path_shared: false,
        };
        assert!(request.execute(parameter_packet.clone()).is_err());
        app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        assert_eq!(app_root_dir.get_sub_directories().len(), 1);
        assert!(app_root_dir.find_sub_directory(&"test_dir".to_string()).is_some());
        request.dir_path = "/test_dir".to_string();
        assert!(request.execute(parameter_packet.clone()).is_ok());
        app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        assert_eq!(app_root_dir.get_sub_directories().len(), 0);
        assert!(request.execute(parameter_packet.clone()).is_err());
    }
}
