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

use xor_name::XorName;

#[derive(Clone, Debug)]
pub enum IpcServerEventCategory {
    IpcListenerEvent,
    IpcSessionEvent,
    ExternalEvent,
}

// --------------------------------------------------------------------------------------

#[derive(Debug)]
pub enum IpcListenerEvent {
    IpcListenerAborted(Box<::errors::LauncherError>),
    SpawnIpcSession(::std::net::TcpStream),
}

// --------------------------------------------------------------------------------------

#[derive(Debug)]
pub enum IpcSessionEvent {
    VerifySession(Box<(u32, String)>),
    IpcSessionTerminated(Box<event_data::SessionTerminationDetail>),
}

impl From<(u32, String)> for IpcSessionEvent {
    fn from(data: (u32, String)) -> IpcSessionEvent {
        IpcSessionEvent::VerifySession(Box::new(data))
    }
}

impl From<event_data::SessionTerminationDetail> for IpcSessionEvent {
    fn from(data: event_data::SessionTerminationDetail) -> IpcSessionEvent {
        IpcSessionEvent::IpcSessionTerminated(Box::new(data))
    }
}

/// This is an event subset to be used by external codes to communicate with the IPC handling
/// module. Observer registration facilities may be availed for notifications.
pub enum ExternalEvent {
    #[doc(hidden)]
    AppActivated(Box<event_data::ActivationDetail>),
    #[doc(hidden)]
    ChangeSafeDriveAccess(XorName, bool),
    /// Obtain the endpoint on which the Launcher IPC is listening to for incoming connections.
    GetListenerEndpoint(::std::sync::mpsc::Sender<String>),
    /// Request IPC Server to forget a session with given app-id. The session will be terminated.
    EndSession(XorName),
    /// Register an observer to receive notifications about changes in verified sessions.
    RegisterVerifiedSessionObserver(::observer::IpcObserver),
    /// Register an observer to receive notifications about changes in unverified sessions.
    RegisterUnverifiedSessionObserver(::observer::IpcObserver),
    /// Register an observer to receive notifications about changes in pending verifications.
    RegisterPendingVerificationObserver(::observer::IpcObserver),
    /// Terminate Launcher IPC - this will essentially exit all sessions and close IPC down
    /// gracefully.
    Terminate,
}

impl ::std::fmt::Debug for ExternalEvent {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        if let ExternalEvent::GetListenerEndpoint(_) = *self {
            write!(f, "ExternalEvent::GetListenerEndpoint")
        } else {
            write!(f, "{:?}", *self)
        }
    }
}

impl From<event_data::ActivationDetail> for ExternalEvent {
    fn from(data: event_data::ActivationDetail) -> ExternalEvent {
        ExternalEvent::AppActivated(Box::new(data))
    }
}

// --------------------------------------------------------------------------------------

pub mod event_data {
    use xor_name::XorName;

    #[derive(Debug, Clone)]
    pub struct ActivationDetail {
        pub nonce            : String,
        pub app_id           : XorName,
        pub app_root_dir_key : ::safe_nfs::metadata::directory_key::DirectoryKey,
        pub safe_drive_access: bool,
    }

    #[derive(Debug)]
    pub struct SessionTerminationDetail {
        pub id    : SessionId,
        pub reason: ::errors::LauncherError,
    }

    #[derive(Debug, Clone)]
    pub enum SessionId {
        AppId(Box<XorName>),
        TempId(u32),
    }
}
