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

pub type Observer<EventSubset> = ::event_sender::EventSender<LauncherEventCategoy, EventSubset>;
pub type IpcObserver = Observer<IpcEvent>;
pub type AppHandlerObserver = Observer<AppHandlingEvent>;

#[derive(Debug, Clone)]
pub enum LauncherEventCategoy {
    IpcEvent,
    AppHandlingEvent,
}

#[derive(Debug)]
pub enum IpcEvent {
    VerifiedSessionUpdate(event_data::VerifiedSession),
    UnverifiedSessionUpdate(event_data::UnverifiedSession),
    PendingVerificationUpdate(event_data::PendingVerification),
}

impl From<event_data::VerifiedSession> for IpcEvent {
    fn from(data: event_data::VerifiedSession) -> IpcEvent {
        IpcEvent::VerifiedSessionUpdate(data)
    }
}

impl From<event_data::UnverifiedSession> for IpcEvent {
    fn from(data: event_data::UnverifiedSession) -> IpcEvent {
        IpcEvent::UnverifiedSessionUpdate(data)
    }
}

impl From<event_data::PendingVerification> for IpcEvent {
    fn from(data: event_data::PendingVerification) -> IpcEvent {
        IpcEvent::PendingVerificationUpdate(data)
    }
}

#[derive(Debug)]
pub enum AppHandlingEvent {
    AppAdded(event_data::AppAdded),
    AppRemoved(event_data::AppRemoved),
}

impl From<event_data::AppAdded> for AppHandlingEvent {
    fn from(data: event_data::AppAdded) -> AppHandlingEvent {
        AppHandlingEvent::AppAdded(data)
    }
}

impl From<event_data::AppRemoved> for AppHandlingEvent {
    fn from(data: event_data::AppRemoved) -> AppHandlingEvent {
        AppHandlingEvent::AppRemoved(data)
    }
}

pub mod event_data {
    #[derive(Debug)]
    pub enum Action {
        Added,
        /// If removal was due to some internal error, the optional field will be duely filled
        Removed(Option<::errors::LauncherError>),
    }

    #[derive(Debug)]
    pub struct PendingVerification {
        pub nonce : String,
        pub action: Action,
    }

    #[derive(Debug)]
    pub struct UnverifiedSession {
        pub id    : u32,
        pub action: Action,
    }

    #[derive(Debug)]
    pub struct VerifiedSession {
        pub id    : ::routing::NameType,
        pub action: Action,
    }

    #[derive(Debug)]
    pub struct AppAdded {
        pub result    : Result<::routing::NameType, ::errors::LauncherError>,
        pub local_path: String,
    }

    #[derive(Debug)]
    pub struct AppRemoved {
        pub id    : ::routing::NameType,
        pub result: Option<::errors::LauncherError>,
    }
}
