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
pub struct AddService {
    pub long_name            : String,
    pub service_name         : String,
    pub is_path_shared       : bool,
    pub service_home_dir_path: String,
}

impl ::launcher::parser::traits::Action for AddService {
    fn execute(&mut self, params: ::launcher::parser::ParameterPacket) -> ::launcher::parser::ResponseType {
        if self.is_path_shared && !*eval_result!(params.safe_drive_access.lock()) {
            return Err(::errors::LauncherError::PermissionDenied)
        }

        let tokens = ::launcher::parser::helper::tokenise_path(&self.service_home_dir_path, false);

        let start_dir_key = if self.is_path_shared {
            &params.safe_drive_dir_key
        } else {
            &params.app_root_dir_key
        };

        let dir_to_map = try!(::launcher::parser::helper::get_final_subdirectory(params.client.clone(),
                                                                                 &tokens,
                                                                                 Some(start_dir_key)));

       let signing_key = try!(eval_result!(params.client.lock()).get_secret_signing_key()).clone();
       let dns_operation = try!(::safe_dns::dns_operations::DnsOperations::new(params.client.clone()));
       let struct_data = try!(dns_operation.add_service(&self.long_name,
                                                        (self.service_name.clone(), dir_to_map.get_key().clone()),
                                                        &signing_key,
                                                        None));
       eval_result!(params.client.lock()).post(::routing::data::Data::StructuredData(struct_data), None);
       Ok(None)
    }
}

/* TODO test is failing because Addservice is nevere returning any response. Hangs at line 46.
#[cfg(test)]
mod test {
    use super::*;
    use ::launcher::parser::traits::Action;

    const TEST_DIR_NAME: &'static str = "test_dir";

    #[test]
    pub fn add_dns_service() {
        let parameter_packet = eval_result!(::launcher::parser::test_utils::get_parameter_packet(false));

        let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(parameter_packet.client.clone());
        let mut app_root_dir = eval_result!(dir_helper.get(&parameter_packet.app_root_dir_key));
        let _ = eval_result!(dir_helper.create(TEST_DIR_NAME.to_string(),
                                               ::safe_nfs::UNVERSIONED_DIRECTORY_LISTING_TAG,
                                               Vec::new(),
                                               false,
                                               ::safe_nfs::AccessLevel::Public,
                                               Some(&mut app_root_dir)));


        let mut register_request = ::launcher::parser::dns::register_dns_v1_0::RegisterDns {
            long_name            : "test2.com".to_string(),
            service_name         : "www".to_string(),
            is_path_shared       : false,
            service_home_dir_path: format!("/{}", TEST_DIR_NAME).to_string(),
        };
        assert!(register_request.execute(parameter_packet.clone()).is_ok());

        let mut request = AddService {
            long_name            : "test2.com".to_string(),
            service_name         : "blog".to_string(),
            is_path_shared       : false,
            service_home_dir_path: format!("/{}", TEST_DIR_NAME).to_string(),
        };

        assert!(request.execute(parameter_packet).is_ok());
    }
}
*/
