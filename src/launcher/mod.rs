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

mod ipc_server;

/// Launcher struct will hold the safe_core engine and application data based on the current login session
/// It will hold the Symmetric Encryption keys for the applications that are launched from the launcher and in running state.
#[derive(Clone)]
pub struct Launcher {
    engine: ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
}

impl Launcher {

    /// Creates a new Launcher instance
    pub fn new(engine: ::safe_core::client::Client) -> Launcher {
        Launcher {
            engine: ::std::sync::Arc::new(::std::sync::Mutex::new(engine)),
        }
    }

}
