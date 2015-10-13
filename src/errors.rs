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

/// Launcher Errors
pub enum LauncherError {
    /// Error from safe_core
    CoreError(::safe_core::errors::CoreError),
    /// Ipc Listener could not be bound to an endpoint
    IpcListenerCouldNotBeBound,
    /// The Ipc Listener has errored out. New apps will no longer be able to connect to Launcher
    IpcListenerAborted(::std::io::Error),
    /// Unexpected - Probably a Logic error
    Unexpected(String),
}

impl<'a> From<&'a str> for LauncherError {
    fn from(error: &'a str) -> LauncherError {
        LauncherError::Unexpected(error.to_string())
    }
}

impl From<::safe_core::errors::CoreError> for LauncherError {
    fn from(error: ::safe_core::errors::CoreError) -> LauncherError {
        LauncherError::CoreError(error)
    }
}

//impl ::std::fmt::Debug for LauncherError {
//    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
//        match *self {
//            LauncherError::CoreError(ref error)  => write!(f, "LauncherError::CoreError -> {:?}", error),
//            LauncherError::Unexpected(ref error) => write!(f, "LauncherError::Unexpected{{{:?}}}", error),
//        }
//    }
//}
