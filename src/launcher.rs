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

/// Symmetric Key used by application for transfering data over the IPC
pub struct ApplicationEncryptionKey (::sodiumoxide::crypto::secretbox::Nonce,
                                     ::sodiumoxide::crypto::secretbox::Key);

/// Launcher struct will hold the engine and app data based on the current login session
/// It will hold the Symmetric Encryption keys for the applications that are launched from the launcher and in running state.
#[allow(unused)]
pub struct Launcher {
    engine                      : Option<::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>>,
    application_encryption_key  : ::std::collections::HashMap<::routing::NameType, ApplicationEncryptionKey>,
}

impl Launcher {

    /// Invoked to register a new user with the SafeNetwork
    /// Initialises the Launcher for the registerd user and returns the Launcher instance, if successful
    /// Else the corresponding reason for failure is returned as error::LauncherError
    pub fn register(keyword: String, pin: String, password: String) -> Result<Launcher, ::errors::LauncherError> {
        let client = try!(::safe_core::client::Client::log_in(keyword, pin, password));
        Ok(Launcher {
            engine                      : Some(::std::sync::Arc::new(::std::sync::Mutex::new(client))),
            application_encryption_key  : ::std::collections::HashMap::new(),
        })
    }

    /// Invoked to Login a already registerd user using self-authentication mechanism to the SafeNetwork
    /// Initialises the Launcher for the logged in user and returns the Launcher instance if the login is successful
    /// Else the corresponding reason for failure is returned as error::LauncherError
    pub fn log_in(keyword: String, pin: String, password: String) -> Result<Launcher, ::errors::LauncherError> {
        let client = try!(::safe_core::client::Client::log_in(keyword, pin, password));
        Ok(Launcher {
            engine                      : Some(::std::sync::Arc::new(::std::sync::Mutex::new(client))),
            application_encryption_key  : ::std::collections::HashMap::new()
        })
    }

}
