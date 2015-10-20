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

pub type ResponseType = Result<Option<::rustc_serialize::json::Json>, ::errors::LauncherError>;

mod dns;
mod nfs;
mod traits;

pub fn begin_parse<D>(client : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
                      decoder: &mut D) -> ResponseType
                                          where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    let endpoint: String = try!(decoder.read_struct_field("endpoint",
                                                          0,
                                                          |d| ::rustc_serialize::Decodable::decode(d)).map_err(|e| ::errors
                                                                                                                   ::LauncherError
                                                                                                                   ::SpecificParseError(format!("{:?}", e))));
    let mut tokens = endpoint.split(|element| element == '/')
                             .map(|token| token.to_string())
                             .collect::<Vec<String>>();
    tokens.reverse();

    version_parser(client, tokens, decoder)
}

fn version_parser<D:>(client             : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
                      mut endpoint_tokens: Vec<String>,
                      decoder            : &mut D) -> ResponseType
                                                      where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    let api_dest = try!(endpoint_tokens.pop().ok_or(::errors::LauncherError::SpecificParseError(format!("Invalid endpoint."))));
    if api_dest != "safe-api" {
        return Err(::errors::LauncherError::SpecificParseError(format!("Unrecognised token \"{}\" in endpoint path.", api_dest)))
    }

    let mut version_str = try!(endpoint_tokens.pop().ok_or(::errors::LauncherError::SpecificParseError(format!("Invalid endpoint - Version token not found."))));
    if version_str.len() < 4 || version_str.remove(0) != 'v' {
        return Err(::errors::LauncherError::SpecificParseError(format!("Unparsable version in endpoint path.")))
    }
    let version = try!(version_str.parse::<f32>().map_err(|e| ::errors::LauncherError::SpecificParseError(format!("Unparsable version {:?}", e))));

    module_dispatcher(client, endpoint_tokens, version, decoder)
}

fn module_dispatcher<D>(client              : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
                        mut remaining_tokens: Vec<String>,
                        version             : f32,
                        decoder             : &mut D) -> ResponseType
                                                         where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    let module = try!(remaining_tokens.pop().ok_or(::errors::LauncherError::SpecificParseError(format!("Invalid endpoint - Module token not found."))));
    match &module[..] {
        "nfs" => nfs::action_dispatcher(client, remaining_tokens, version, decoder),
        "dns" => unimplemented!(),
        _     => Err(::errors::LauncherError::SpecificParseError(format!("Unrecognised module \"{}\" in endpoint path.", module))),
    }
}
