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

use rustc_serialize::json::ToJson;

const KEY_SIZE: usize = ::sodiumoxide::crypto::secretbox::NONCEBYTES + ::sodiumoxide::crypto::secretbox::KEYBYTES;

#[derive(Debug)]
struct KeyExchangeData {
    pub public_key   : [u8; ::sodiumoxide::crypto::secretbox::KEYBYTES],
    pub symmetric_key: Vec<u8>,
}


#[derive(Debug)]
struct HandshakeResponse {
    pub id  : [u8; 0],
    pub data: KeyExchangeData,
}

impl ::rustc_serialize::json::ToJson for KeyExchangeData {
    fn to_json(&self) -> ::rustc_serialize::json::Json {
        use ::rustc_serialize::base64::ToBase64;

        let mut tree = ::std::collections::BTreeMap::new();
        let config = ::config::get_base64_config();
        let base64_public_key = (&self.public_key).to_base64(config);
        let base64_symmetric_key = (&self.symmetric_key).to_base64(config);

        if tree.insert("public_key".to_string(), base64_public_key.to_json()).is_some() {
            error!("Json Conversion error -- KeyExchangeData -- public_key");
        }
        if tree.insert("symmetric_key".to_string(), base64_symmetric_key.to_json()).is_some() {
            error!("Json Conversion error -- KeyExchangeData -- symmetric_key");
        }

        ::rustc_serialize::json::Json::Object(tree)
    }
}

impl ::rustc_serialize::json::ToJson for HandshakeResponse {
    fn to_json(&self) -> ::rustc_serialize::json::Json {
        use ::rustc_serialize::base64::ToBase64;

        let mut tree = ::std::collections::BTreeMap::new();
        let config = ::config::get_base64_config();
        let base64_id = (&self.id).to_base64(config);

        if tree.insert("id".to_string(), base64_id.to_json()).is_some() {
            error!("Json Conversion error -- HandshakeResponse -- id");
        }
        if tree.insert("data".to_string(), self.data.to_json()).is_some() {
            error!("Json Conversion error -- HandshakeResponse -- data");
        }
        ::rustc_serialize::json::Json::Object(tree)
    }
}

pub fn perform_key_exchange(mut ipc_stream: ::launcher::ipc_server::ipc_session::stream::IpcStream,
                            app_nonce     : ::sodiumoxide::crypto::box_::Nonce,
                            app_pub_key   : ::sodiumoxide::crypto::box_::PublicKey) -> Result<(::sodiumoxide::crypto::secretbox::Nonce,
                                                                                              ::sodiumoxide::crypto::secretbox::Key),
                                                                                             ::errors::LauncherError> {
    let nonce = ::sodiumoxide::crypto::secretbox::gen_nonce();
    let key = ::sodiumoxide::crypto::secretbox::gen_key();
    let (launcher_public_key, launcher_secret_key) = ::sodiumoxide::crypto::box_::gen_keypair();
    let mut data = [0u8; KEY_SIZE];
    for (i, item) in nonce.0.iter().chain(key.0.iter()).enumerate() {
      data[i] = *item;
    }
    let encrypted_data = ::sodiumoxide::crypto::box_::seal(&data, &app_nonce, &app_pub_key, &launcher_secret_key);
    let response = KeyExchangeData {
      public_key   : launcher_public_key.0,
      symmetric_key: encrypted_data,
    };
    let payload = HandshakeResponse {
      id: [0u8; 0],
      data: response,
    };    
    let json_obj = payload.to_json();
    ipc_stream.write(json_obj.to_string().into_bytes());
    Ok((nonce, key))
}
