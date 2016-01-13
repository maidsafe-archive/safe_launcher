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

pub fn tokenise_path(path: &str, keep_empty_splits: bool) -> Vec<String> {
    path.split(|element| element == '/')
        .filter(|token| keep_empty_splits || token.len() != 0)
        .map(|token| token.to_string())
        .collect()
}

pub fn get_final_subdirectory
    (client: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
     tokens: &Vec<String>,
     starting_directory: Option<&::safe_nfs::metadata::directory_key::DirectoryKey>)
     -> Result<::safe_nfs::directory_listing::DirectoryListing, ::errors::LauncherError> {
    let dir_helper = ::safe_nfs::helper::directory_helper::DirectoryHelper::new(client);

    let mut current_dir_listing = match starting_directory {
        Some(directory_key) => try!(dir_helper.get(directory_key)),
        None => try!(dir_helper.get_user_root_directory_listing()),
    };

    for it in tokens.iter() {
        current_dir_listing = {
            let current_dir_metadata = try!(current_dir_listing.get_sub_directories()
                                        .iter()
                                        .find(|a| *a.get_name() == *it)
                                        .ok_or(::errors::LauncherError::PathNotFound));
            try!(dir_helper.get(current_dir_metadata.get_key()))
        };
    }

    Ok(current_dir_listing)
}
