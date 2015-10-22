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

mod add_service_v1_0;
mod register_dns_v1_0;

pub fn action_dispatcher<D>(params              : ::launcher::parser::ParameterPacket,
                            mut remaining_tokens: Vec<String>,
                            version             : f32,
                            decoder             : &mut D) -> ::launcher::parser::ResponseType
                                                             where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    if remaining_tokens.len() > 1 {
        return Err(::errors::LauncherError::SpecificParseError("Extra unrecognised tokens in endpoint.".to_string()))
    }

    let action_str = try!(parse_option!(remaining_tokens.pop(), "Invalid endpoint - Action not found."));

    let mut action = try!(get_action(&action_str, version, decoder));

    action.execute(params)
}

fn get_action<D>(action_str: &str, version: f32, decoder: &mut D) -> Result<Box<::launcher::parser::traits::Action>, ::errors::LauncherError>
                                                                     where D: ::rustc_serialize::Decoder, D::Error: ::std::fmt::Debug {
    use rustc_serialize::Decodable;

    let version_err = Err(::errors::LauncherError::SpecificParseError(format!("Unsupported version {:?} for this endpoint.", version)));

    Ok(match action_str {
        "register-dns" => match version {
            1.0 => unimplemented!(),
            _   => return version_err,
        },
        "add-service" => match version {
            1.0 => Box::new(try!(parse_result!(decoder.read_struct_field("data", 0, |d| add_service_v1_0::AddService::decode(d)), ""))),
            _   => return version_err,
        },
        _ => return Err(::errors::LauncherError::SpecificParseError(format!("Unsupported action {:?} for this endpoint.", action_str))),
    })
}
