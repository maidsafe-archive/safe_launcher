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

use sodiumoxide::crypto::{box_, secretbox};

use errors::LauncherError;
use launcher::ipc_server::ipc_session::stream::IpcStream;

pub fn perform_ecdh_exchange(ipc_stream: &mut IpcStream,
                             app_nonce: box_::Nonce,
                             app_pub_key: box_::PublicKey)
                             -> Result<(secretbox::Nonce, secretbox::Key), LauncherError> {
    use rustc_serialize::base64::ToBase64;
    use rustc_serialize::json;

    let key = secretbox::gen_key();
    let nonce = secretbox::gen_nonce();

    let (launcher_public_key, launcher_secret_key) = box_::gen_keypair();

    let mut data = [0u8; secretbox::NONCEBYTES + secretbox::KEYBYTES];
    for (i, item) in nonce.0.iter().chain(key.0.iter()).enumerate() {
        data[i] = *item;
    }

    let cipher_text = box_::seal(&data, &app_nonce, &app_pub_key, &launcher_secret_key);

    let b64_config = ::config::get_base64_config();
    let launcher_pub_key_base64 = launcher_public_key.0.to_base64(b64_config);
    let cipher_text_base64 = cipher_text.to_base64(b64_config);

    let response = EcdhKeyExchgResponse {
        encrypted_symm_key: cipher_text_base64,
        launcher_public_key: launcher_pub_key_base64,
    };

    let json_packet = JsonPacket {
        id: String::new(),
        data: response,
    };

    let payload = try!(json::encode(&json_packet));

    try!(ipc_stream.write(payload.into_bytes()));

    Ok((nonce, key))
}

#[derive(RustcEncodable, Debug)]
struct JsonPacket {
    pub id: String,
    pub data: EcdhKeyExchgResponse,
}

#[derive(RustcEncodable, Debug)]
struct EcdhKeyExchgResponse {
    pub encrypted_symm_key: String,
    pub launcher_public_key: String,
}
