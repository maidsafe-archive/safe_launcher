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

use std::io;
use std::fmt;

use rustc_serialize::json;

use safe_core::errors::CoreError;
use safe_dns::errors::{DNS_ERROR_START_RANGE, DnsError};
use safe_nfs::errors::NfsError;

use maidsafe_utilities::serialisation::SerialisationError;

/// Intended for converting Launcher Errors into numeric codes for propagating some error
/// information across FFI boundaries and specially to C.
pub const LAUNCHER_ERROR_START_RANGE: i32 = DNS_ERROR_START_RANGE - 500;

/// Launcher Errors
pub enum LauncherError {
    /// Error from safe_core. Boxed to hold a pointer instead of value so that this enum variant is
    /// not insanely bigger than others.
    CoreError(Box<CoreError>),
    /// Errors from safe_nfs
    NfsError(Box<NfsError>),
    /// Errors from safe_nfs
    DnsError(Box<DnsError>),
    /// Ipc Listener could not be bound to an endpoint
    IpcListenerCouldNotBeBound,
    /// The Ipc Listener has errored out. New apps will no longer be able to connect to Launcher
    IpcListenerAborted(io::Error),
    /// The Ipc Stream could not be cloned
    IpcStreamCloneError(io::Error),
    /// mpsc receiver has hung up
    ReceiverChannelDisconnected,
    /// IpcSession has been terminated due to either graceful shutdown or some error as indicated
    IpcSessionTerminated(Option<io::Error>),
    /// Could not read the payload size from stream
    FailedReadingStreamPayloadSize,
    /// Could not write the payload size to stream
    FailedWritingStreamPayloadSize,
    /// Unable to find/traverse directory or file path
    PathNotFound,
    /// Supplied path was invalid
    InvalidPath,
    /// Permission denied - e.g. permission to access SAFEDrive etc.
    PermissionDenied,
    /// Could not parse payload as a valid JSON
    JsonParseError(json::ParserError),
    /// Could not decode valid JSON into expected Structures probably because a mandatory field was
    /// missing or a field was wrongly named etc.
    JsonDecodeError(json::DecoderError),
    /// JSON non-conforming to the Launcher RFC and not covered by JsonDecodeError, e.g. things
    /// like invalid base64 formatting, unreasonable/unexpected indexing, ranges etc.
    SpecificParseError(String),
    /// Error encoding into Json String
    JsonEncodeError(json::EncoderError),
    /// Symmetric Deciphering failed for a cipher text
    SymmetricDecipherFailure,
    /// This path to binary has already been added on this machine
    AppAlreadyAdded,
    /// The given app is not managed by Launcher
    AppNotRegistered,
    /// Starting of App as an external process has failed
    AppActivationFailed(io::Error),
    /// Payload to read is prohibitive in size
    ReadPayloadSizeProhibitive,
    /// Unable to Read from or Write to a Local Config file.
    LocalConfigAccessFailed(String),
    /// Unexpected - Probably a Logic error
    Unexpected(String),
    /// Could not serialise or deserialise data
    UnsuccessfulEncodeDecode(SerialisationError),
}

impl From<SerialisationError> for LauncherError {
    fn from(error: SerialisationError) -> LauncherError {
        LauncherError::UnsuccessfulEncodeDecode(error)
    }
}
impl<'a> From<&'a str> for LauncherError {
    fn from(error: &'a str) -> LauncherError {
        LauncherError::Unexpected(error.to_string())
    }
}

impl From<CoreError> for LauncherError {
    fn from(error: CoreError) -> LauncherError {
        LauncherError::CoreError(Box::new(error))
    }
}

impl From<NfsError> for LauncherError {
    fn from(error: NfsError) -> LauncherError {
        LauncherError::NfsError(Box::new(error))
    }
}

impl From<DnsError> for LauncherError {
    fn from(error: DnsError) -> LauncherError {
        LauncherError::DnsError(Box::new(error))
    }
}

impl From<json::ParserError> for LauncherError {
    fn from(error: json::ParserError) -> LauncherError {
        LauncherError::JsonParseError(error)
    }
}

impl From<json::EncoderError> for LauncherError {
    fn from(error: json::EncoderError) -> LauncherError {
        LauncherError::JsonEncodeError(error)
    }
}

impl From<json::DecoderError> for LauncherError {
    fn from(error: json::DecoderError) -> LauncherError {
        LauncherError::JsonDecodeError(error)
    }
}

impl Into<i32> for LauncherError {
    fn into(self) -> i32 {
        match self {
            LauncherError::CoreError(error) => (*error).into(),
            LauncherError::NfsError(error) => (*error).into(),
            LauncherError::DnsError(error) => (*error).into(),
            LauncherError::IpcListenerCouldNotBeBound => LAUNCHER_ERROR_START_RANGE - 1,
            LauncherError::IpcListenerAborted(_) => LAUNCHER_ERROR_START_RANGE - 2,
            LauncherError::IpcStreamCloneError(_) => LAUNCHER_ERROR_START_RANGE - 3,
            LauncherError::ReceiverChannelDisconnected => LAUNCHER_ERROR_START_RANGE - 4,
            LauncherError::IpcSessionTerminated(_) => LAUNCHER_ERROR_START_RANGE - 5,
            LauncherError::FailedReadingStreamPayloadSize => LAUNCHER_ERROR_START_RANGE - 6,
            LauncherError::FailedWritingStreamPayloadSize => LAUNCHER_ERROR_START_RANGE - 7,
            LauncherError::PathNotFound => LAUNCHER_ERROR_START_RANGE - 8,
            LauncherError::InvalidPath => LAUNCHER_ERROR_START_RANGE - 9,
            LauncherError::PermissionDenied => LAUNCHER_ERROR_START_RANGE - 10,
            LauncherError::JsonParseError(_) => LAUNCHER_ERROR_START_RANGE - 11,
            LauncherError::JsonDecodeError(_) => LAUNCHER_ERROR_START_RANGE - 12,
            LauncherError::SpecificParseError(_) => LAUNCHER_ERROR_START_RANGE - 13,
            LauncherError::JsonEncodeError(_) => LAUNCHER_ERROR_START_RANGE - 14,
            LauncherError::SymmetricDecipherFailure => LAUNCHER_ERROR_START_RANGE - 15,
            LauncherError::AppAlreadyAdded => LAUNCHER_ERROR_START_RANGE - 16,
            LauncherError::AppNotRegistered => LAUNCHER_ERROR_START_RANGE - 17,
            LauncherError::AppActivationFailed(_) => LAUNCHER_ERROR_START_RANGE - 18,
            LauncherError::ReadPayloadSizeProhibitive => LAUNCHER_ERROR_START_RANGE - 19,
            LauncherError::LocalConfigAccessFailed(_) => LAUNCHER_ERROR_START_RANGE - 20,
            LauncherError::Unexpected(_) => LAUNCHER_ERROR_START_RANGE - 21,
            LauncherError::UnsuccessfulEncodeDecode(_) => LAUNCHER_ERROR_START_RANGE - 22,
        }
    }
}

impl fmt::Debug for LauncherError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            LauncherError::CoreError(ref error) => {
                write!(f, "LauncherError::CoreError -> {:?}", error)
            }
            LauncherError::NfsError(ref error) => {
                write!(f, "LauncherError::NfsError -> {:?}", error)
            }
            LauncherError::DnsError(ref error) => {
                write!(f, "LauncherError::DnsError -> {:?}", error)
            }
            LauncherError::IpcListenerCouldNotBeBound => {
                write!(f, "LauncherError::IpcListenerCouldNotBeBound")
            }
            LauncherError::IpcListenerAborted(ref error) => {
                write!(f, "LauncherError::IpcListenerAborted -> {:?}", error)
            }
            LauncherError::IpcStreamCloneError(ref error) => {
                write!(f, "LauncherError::IpcStreamCloneError -> {:?}", error)
            }
            LauncherError::ReceiverChannelDisconnected => {
                write!(f, "LauncherError::ReceiverChannelDisconnected")
            }
            LauncherError::IpcSessionTerminated(ref error) => {
                write!(f, "LauncherError::IpcSessionTerminated -> {:?}", error)
            }
            LauncherError::FailedReadingStreamPayloadSize => {
                write!(f, "LauncherError::FailedReadingStreamPayloadSize")
            }
            LauncherError::FailedWritingStreamPayloadSize => {
                write!(f, "LauncherError::FailedWritingStreamPayloadSize")
            }
            LauncherError::PathNotFound => write!(f, "LauncherError::PathNotFound"),
            LauncherError::InvalidPath => write!(f, "LauncherError::InvalidPath"),
            LauncherError::PermissionDenied => write!(f, "LauncherError::PermissionDenied"),
            LauncherError::JsonParseError(ref error) => {
                write!(f, "LauncherError::JsonParseError -> {:?}", error)
            }
            LauncherError::JsonDecodeError(ref error) => {
                write!(f, "LauncherError::JsonDecodeError -> {:?}", error)
            }
            LauncherError::SpecificParseError(ref error) => {
                write!(f, "LauncherError::SpecificParseError -> {:?}", error)
            }
            LauncherError::JsonEncodeError(ref error) => {
                write!(f, "LauncherError::JsonEncodeError -> {:?}", error)
            }
            LauncherError::SymmetricDecipherFailure => {
                write!(f, "LauncherError::SymmetricDecipherFailure")
            }
            LauncherError::AppAlreadyAdded => write!(f, "LauncherError::AppAlreadyAdded"),
            LauncherError::AppNotRegistered => write!(f, "LauncherError::AppNotRegistered"),
            LauncherError::AppActivationFailed(ref error) => {
                write!(f, "LauncherError::AppActivationFailed -> {:?}", error)
            }
            LauncherError::ReadPayloadSizeProhibitive => {
                write!(f, "LauncherError::ReadPayloadSizeProhibitive")
            }
            LauncherError::LocalConfigAccessFailed(ref error) => {
                write!(f, "LauncherError::LocalConfigAccessFailed -> {:?}", error)
            }
            LauncherError::Unexpected(ref error) => {
                write!(f, "LauncherError::Unexpected{{{:?}}}", error)
            }
            LauncherError::UnsuccessfulEncodeDecode(ref err) => {
                write!(f, "LauncherError::UnsuccessfulEncodeDecode -> {:?}", err)
            }
        }
    }
}
