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

/// Intended for converting Launcher Errors into numeric codes for propagating some error information
/// across FFI boundaries and specially to C.
pub const LAUNCHER_ERROR_START_RANGE: i32 = ::safe_dns::errors::DNS_ERROR_START_RANGE - 500;

/// Launcher Errors
#[allow(variant_size_differences)]
pub enum LauncherError {
    /// Error from safe_core. Boxed to hold a pointer instead of value so that this enum variant is
    /// not insanely bigger than others.
    CoreError(Box<::safe_core::errors::CoreError>),
    /// Empty Keyword
    EmptyKeyword,
    /// Empty password
    EmptyPassword,
    /// Invalid Pin Number
    InvalidPin,
    /// Ipc Listener could not be bound to an endpoint
    IpcListenerCouldNotBeBound,
    /// The Ipc Listener has errored out. New apps will no longer be able to connect to Launcher
    IpcListenerAborted(::std::io::Error),
    /// The Ipc Stream could not be cloned
    IpcStreamCloneError(::std::io::Error),
    /// mpsc receiver has hung up
    ReceiverChannelDisconnected,
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
        LauncherError::CoreError(Box::new(error))
    }
}


impl Into<i32> for LauncherError {
    fn into(self) -> i32 {
        match self {
            LauncherError::CoreError(ref error)            => LAUNCHER_ERROR_START_RANGE - 1,
            LauncherError::EmptyKeyword                    => LAUNCHER_ERROR_START_RANGE - 2,
            LauncherError::EmptyPassword                   => LAUNCHER_ERROR_START_RANGE - 3,
            LauncherError::InvalidPin                      => LAUNCHER_ERROR_START_RANGE - 4,
            LauncherError::IpcListenerCouldNotBeBound      => LAUNCHER_ERROR_START_RANGE - 5,
            LauncherError::IpcListenerAborted(ref error)   => LAUNCHER_ERROR_START_RANGE - 6,
            LauncherError::IpcStreamCloneError(ref error)  => LAUNCHER_ERROR_START_RANGE - 7,
            LauncherError::ReceiverChannelDisconnected     => LAUNCHER_ERROR_START_RANGE - 8,
            LauncherError::Unexpected(ref error)           => LAUNCHER_ERROR_START_RANGE - 9,
        }
    }
}

impl ::std::fmt::Debug for LauncherError {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        match *self {
            LauncherError::CoreError(ref error)            => write!(f, "LauncherError::CoreError -> {:?}", error),
            LauncherError::EmptyKeyword                     => write!(f, "LauncherError::EmptyKeyword -> Keyword cannot be empty"),
            LauncherError::EmptyPassword                    => write!(f, "LauncherError::EmptyPassword -> Password cannot be empty"),
            LauncherError::InvalidPin                       => write!(f, "LauncherError::InvalidPin -> PinNumber must be 4 digits"),
            LauncherError::IpcListenerCouldNotBeBound      => write!(f, "LauncherError::IpcListenerCouldNotBeBound"),
            LauncherError::IpcListenerAborted(ref error)   => write!(f, "LauncherError::IpcListenerAborted -> {:?}", error),
            LauncherError::IpcStreamCloneError(ref error)  => write!(f, "LauncherError::IpcStreamCloneError -> {:?}", error),
            LauncherError::ReceiverChannelDisconnected     => write!(f, "LauncherError::ReceiverChannelDisconnected"),
            LauncherError::Unexpected(ref error)           => write!(f, "LauncherError::Unexpected{{{:?}}}", error),
        }
    }
}
