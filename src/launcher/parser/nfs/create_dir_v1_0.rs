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

#[derive(Debug)]
pub struct CreateDir {
    dir_path         : String,
    is_private       : bool,
    is_versioned     : bool,
    user_metadata    : Vec<u8>,
    safe_drive_access: bool,
}

impl CreateDir {
    fn decode<D>(decoder: &mut D) -> Result<Self, ::errors::LauncherError>
                                     where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
        use rustc_serialize::base64::FromBase64;

        Ok(CreateDir {
            dir_path: try!(decoder.read_struct_field("dir_path", 0, |d| ::rustc_serialize::Decodable::decode(d))
                                  .map_err(|e| ::errors::LauncherError::SpecificParseError(format!("{:?}", e)))),
            is_private: try!(decoder.read_struct_field("is_private", 0, |d| ::rustc_serialize::Decodable::decode(d))
                                    .map_err(|e| ::errors::LauncherError::SpecificParseError(format!("{:?}", e)))),
            is_versioned: try!(decoder.read_struct_field("is_versioned", 0, |d| ::rustc_serialize::Decodable::decode(d))
                                      .map_err(|e| ::errors::LauncherError::SpecificParseError(format!("{:?}", e)))),
            user_metadata: {
                let base64_str: String = try!(decoder.read_struct_field("user_metadata", 0, |d| ::rustc_serialize::Decodable::decode(d))
                                                     .map_err(|e| ::errors::LauncherError::SpecificParseError(format!("{:?}", e))));
                try!(base64_str.from_base64().map_err(|e| ::errors::LauncherError::SpecificParseError(format!("{:?}", e))))
            },
            safe_drive_access: try!(decoder.read_struct_field("user_metadata", 0, |d| ::rustc_serialize::Decodable::decode(d))
                                           .map_err(|e| ::errors::LauncherError::SpecificParseError(format!("{:?}", e)))),
        })
    }
}

impl ::launcher::parser::traits::Action for CreateDir {
    fn execute(client: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>) -> ::launcher::parser::ResponseType {
        unimplemented!()
    }
}
