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
pub struct RegisterDns {
    pub long_name            : String,
    pub service_name         : String,
    pub is_path_shared       : bool,
    pub service_home_dir_path: String,
}

impl ::launcher::parser::traits::Action for RegisterDns {
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

       let (msg_public_key, msg_secret_key) = ::sodiumoxide::crypto::box_::gen_keypair();
       let services = vec![(self.service_name.clone(), (dir_to_map.get_key().clone()))];
       let public_signing_key = try!(eval_result!(params.client.lock()).get_public_signing_key()).clone();
       let secret_signing_key = try!(eval_result!(params.client.lock()).get_secret_signing_key()).clone();
       let dns_operation = try!(::safe_dns::dns_operations::DnsOperations::new(params.client));
       let _ = try!(dns_operation.register_dns(self.long_name.clone(),
                                               &msg_public_key,
                                               &msg_secret_key,
                                               &services,
                                               vec![public_signing_key],
                                               &secret_signing_key,
                                               None));
       Ok(None)
    }
}
