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

use rustc_serialize::base64::ToBase64;

#[derive(Debug, RustcEncodable)]
struct KeyExchangeData {
    pub public_key  : String,
    pub symmtric_key: String,
}


#[derive(Debug, RustcEncodable)]
struct HandshakeResponse {
    pub id  : Vec<u8>,
    pub data: KeyExchangeData,
}


pub fn perform_key_exchange(mut ipc_stream: ::launcher::ipc_server::ipc_session::stream::IpcStream,
                            app_nonce     : ::sodiumoxide::crypto::box_::Nonce,
                            app_pub_key   : ::sodiumoxide::crypto::box_::PublicKey) -> Result<(::sodiumoxide::crypto::secretbox::Nonce,
                                                                                              ::sodiumoxide::crypto::secretbox::Key),
                                                                                             ::errors::LauncherError> {
    // generate nonce and symmtric key
    let nonce = ::sodiumoxide::crypto::secretbox::gen_nonce();
    let key = ::sodiumoxide::crypto::secretbox::gen_key();
    let (launcher_public_key, launcher_secret_key) = ::sodiumoxide::crypto::box_::gen_keypair();
    // Pack it into single [u8; NONCEBYTES+KEYBYTES] -> [nonce+key]
    let mut data = [0u8; 36];
    let mut pos = 0;
    for i in nonce.0.iter().chain(key.0.iter()) {
      data[0] = *i;
      pos += 1;
    }
    // encrypt above by box_::seal to get Vec<u8>
    let encrypted_data = ::sodiumoxide::crypto::box_::seal(&data, &app_nonce, &app_pub_key, &launcher_secret_key);
    // Create the JSON as specified in the RFC
    let response = KeyExchangeData {
      public_key  : launcher_public_key.0.to_base64(::config::get_base64_config()),
      symmtric_key: encrypted_data.to_base64(::config::get_base64_config()),
    };
    let payload = HandshakeResponse {
      id: vec![],
      data: response,
    };
    // write the data through the stream
    ipc_stream.write(try!(::safe_core::utility::serialise(&payload)));
    Ok((nonce, key))
}
