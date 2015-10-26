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

#[derive(Clone, Debug, RustcEncodable, RustcDecodable)]
pub struct LauncherConfiguration {
    pub app_id           : ::routing::NameType,
    pub app_name         : String,
    pub reference_count  : u32,
    pub app_root_dir_key : ::safe_nfs::metadata::directory_key::DirectoryKey,
    pub safe_drive_access: bool,
}

// (Spandan)
// This is a hack because presently cbor isn't able to decode/encode HashMap<NameType, String>
// properly
pub fn convert_hashmap_to_vec(hashmap: &::std::collections::HashMap<::routing::NameType, String>) -> Vec<(::routing::NameType, String)> {
    hashmap.iter().map(|a| (a.0.clone(), a.1.clone())).collect()
}

// (Spandan)
// This is a hack because presently cbor isn't able to decode/encode HashMap<NameType, String>
// properly
pub fn convert_vec_to_hashmap(vec: Vec<(::routing::NameType, String)>) -> ::std::collections::HashMap<::routing::NameType, String> {
    vec.into_iter().collect()
}
