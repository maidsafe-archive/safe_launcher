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

pub type ResponseType = Result<Option<String>, ::errors::LauncherError>;

mod dns;
mod nfs;
mod traits;
mod helper;
#[cfg(test)] mod test_utils;

#[derive(Clone)]
pub struct ParameterPacket {
    pub client            : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
    pub app_root_dir_key  : ::safe_nfs::metadata::directory_key::DirectoryKey,
    pub safe_drive_access : ::std::sync::Arc<::std::sync::Mutex<bool>>,
    pub safe_drive_dir_key: ::safe_nfs::metadata::directory_key::DirectoryKey,
}

pub fn begin_parse<D>(params : ParameterPacket,
                      decoder: &mut D) -> ResponseType
                                          where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    let endpoint: String = try!(parse_result!(decoder.read_struct_field("endpoint",
                                                                        0,
                                                                        |d| ::rustc_serialize::Decodable::decode(d)), ""));
    let mut tokens = helper::tokenise_path(&endpoint, true);
    tokens.reverse();

    version_parser(params, tokens, decoder)
}

fn version_parser<D:>(params             : ParameterPacket,
                      mut endpoint_tokens: Vec<String>,
                      decoder            : &mut D) -> ResponseType
                                                      where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    let api_dest = try!(parse_option!(endpoint_tokens.pop(), "Invalid endpoint."));
    if api_dest != "safe-api" {
        return Err(::errors::LauncherError::SpecificParseError(format!("Unrecognised token \"{}\" in endpoint path.", api_dest)))
    }

    let mut version_str = try!(parse_option!(endpoint_tokens.pop(), "Invalid endpoint - Version token not found."));
    if version_str.len() < 4 || version_str.remove(0) != 'v' {
        return Err(::errors::LauncherError::SpecificParseError("Unparsable version in endpoint path.".to_string()))
    }
    let version = try!(parse_result!(version_str.parse::<f32>(), "Unparsable version"));

    module_dispatcher(params, endpoint_tokens, version, decoder)
}

fn module_dispatcher<D>(params              : ParameterPacket,
                        mut remaining_tokens: Vec<String>,
                        version             : f32,
                        decoder             : &mut D) -> ResponseType
                                                         where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    let module = try!(parse_option!(remaining_tokens.pop(), "Invalid endpoint - Module token not found."));
    match &module[..] {
        "nfs" => nfs::action_dispatcher(params, remaining_tokens, version, decoder),
        "dns" => dns::action_dispatcher(params, remaining_tokens, version, decoder),
        _     => Err(::errors::LauncherError::SpecificParseError(format!("Unrecognised module \"{}\" in endpoint path.", module))),
    }
}

#[cfg(test)]
mod test {
    #[test]
    fn parse_request() {
        let parameter_packet = unwrap_result!(::launcher::parser::test_utils::get_parameter_packet(false));

        let mut json_str = "{}";
        let mut json_obj = unwrap_result!(::rustc_serialize::json::Json::from_str(&json_str));
        assert!(::launcher::parser::begin_parse(parameter_packet.clone(),
                &mut ::rustc_serialize::json::Decoder::new(json_obj)).is_err());

        json_str = "{\"endpoint\": \"safe-api/v1.0/nfs/create-dir\", \"data\": {}}";
        json_obj = unwrap_result!(::rustc_serialize::json::Json::from_str(&json_str));
        assert!(::launcher::parser::begin_parse(parameter_packet.clone(),
                &mut ::rustc_serialize::json::Decoder::new(json_obj)).is_err());

        json_str = "{\"endpoint\": \"safe-api/v1.0/nfs/create-dir\", \"data\": {\"dir_path\": \"/demo\",\"is_path_shared\": false,\"is_private\": true,\"is_versioned\": false,\"user_metadata\": \"\"}}";
        json_obj = unwrap_result!(::rustc_serialize::json::Json::from_str(&json_str));
        assert!(::launcher::parser::begin_parse(parameter_packet.clone(),
                &mut ::rustc_serialize::json::Decoder::new(json_obj)).is_ok());
    }
}
