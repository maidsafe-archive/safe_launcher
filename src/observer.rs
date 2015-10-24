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

/// All codes interfacing with Launcher are expected to be coded in observer pattern style for
/// collecting notifications from core that they are interested in. This is a type alias for all
/// events that Launcher will fire to interested listeners. Interfacing codes are expected to
/// construct these senders and register them with appropriate core modules. The registration
/// facility will be available with the main `launcher` module.
pub type Observer<EventSubset> = ::event_sender::EventSender<LauncherEventCategoy, EventSubset>;
/// An convenience alias for registering for events/signals arising from IPC modules.
pub type IpcObserver = Observer<IpcEvent>;
/// An convenience alias for registering for events/signals arising from App Handling modules.
pub type AppHandlerObserver = Observer<AppHandlingEvent>;

/// Representation of all the event categories that the core modules will trigger for an interested
/// observer.
#[derive(Debug, Clone)]
pub enum LauncherEventCategoy {
    /// Category representing an IPC event.
    IpcEvent,
    /// Category representing some Application-Handling event.
    AppHandlingEvent,
}

/// An event subset for IPC Event category. These are the individual events that occur within the
/// IPC Category umberlla.
#[derive(Debug)]
pub enum IpcEvent {
    /// Verified sessions represent peers which have passed all the authentication stages and
    /// Launcher is presently communicating to in a secure, encrypted channel. A change in the list
    /// of such sessions will be intimated by this event.
    VerifiedSessionUpdate(event_data::VerifiedSession),
    /// Unverified sessions represent peers which are active and Launcher is presently
    /// communicating to but which are yet to pass all the authentication stages. A change in the
    /// list of such sessions will be intimated by this event.
    UnverifiedSessionUpdate(event_data::UnverifiedSession),
    /// Sessions pending verification represent peers which are supposedly started by `AppHandler`
    /// module but IPC hasn't yet detected any connection that it can relate to be that peer. A
    /// change in list of such sessions will be intimated by this event.
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

/// An event subset for App Handling Event category. These are the individual events that occur
/// within the App Handling Category umberlla.
#[derive(Debug)]
pub enum AppHandlingEvent {
    /// This event is triggered when an Application has been successfully added into Launcher and
    /// can now be managed from inside Launcher.
    AppAdded(event_data::AppAdded),
    /// This event is triggered when an Application has been successfully removed from Launcher and
    /// can now be no longer managed from inside Launcher for this machine.
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

/// Data that will be transferred during specific events to get a fine-grained detail about various
/// parameters.
pub mod event_data {
    /// If the object under considerating was added or removed.
    #[derive(Debug)]
    pub enum Action {
        /// Was added.
        Added,
        /// If removal was due to some internal error, the optional field will be duely filled.
        Removed(Option<::errors::LauncherError>),
    }

    /// Data for an app pending verification.
    #[derive(Debug)]
    pub struct PendingVerification {
        /// Launcher nonce that was give to the Application while starting it.
        pub nonce : String,
        /// Action taken for this Application.
        pub action: Action,
    }

    /// Data for an unverified session.
    #[derive(Debug)]
    pub struct UnverifiedSession {
        /// Temporary id for a session trying to pass the authentication stages.
        pub id    : u32,
        /// Action taken for this Application.
        pub action: Action,
    }

    /// Data for a verified session.
    #[derive(Debug)]
    pub struct VerifiedSession {
        /// Unique id of the Application managed by Launcher.
        pub id    : ::routing::NameType,
        /// Action taken for this Application.
        pub action: Action,
    }

    /// Data for an app that was successfully added to Launcher.
    #[derive(Debug)]
    pub struct AppAdded {
        /// Result of operation.
        pub result    : Result<::routing::NameType, ::errors::LauncherError>,
        /// Local path of application binary on this machine.
        pub local_path: String,
    }

    /// Data for an app that was successfully removed from Launcher.
    #[derive(Debug)]
    pub struct AppRemoved {
        /// Unique id of the Application managed by Launcher.
        pub id    : ::routing::NameType,
        /// Result of operation.
        pub result: Option<::errors::LauncherError>,
    }
}
