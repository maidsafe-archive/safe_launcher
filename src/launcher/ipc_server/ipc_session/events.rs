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

#[derive(Clone, Debug)]
pub enum IpcSessionEventCategory {
    AppAuthenticationEvent,    
    SecureCommunicationEvent,
    ExternalEvent,
}

// --------------------------------------------------------------------------------------

pub type AppAuthenticationEvent = Result<event_data::AuthData, ::errors::LauncherError>;

// --------------------------------------------------------------------------------------

pub type RsaKeyExchangeEvent = Result<event_data::RsaData, ::errors::LauncherError>;

// --------------------------------------------------------------------------------------

#[derive(Debug)]
pub enum SecureCommunicationEvent {
    PlaceHolder, // TODO
}

// --------------------------------------------------------------------------------------

#[allow(variant_size_differences)]
#[derive(Debug)]
pub enum ExternalEvent {
    AppDetailReceived(Box<event_data::AppDetail>),
    ChangeSafeDriveAccess(bool),
    Terminate,
}

// --------------------------------------------------------------------------------------

pub mod event_data {
    pub struct AppDetail {
        pub client           : ::std::sync::Arc<::std::sync::Mutex<::safe_core::client::Client>>,
        pub app_id           : ::routing::NameType,
        pub safe_drive_access: bool,
    }

    impl ::std::fmt::Debug for AppDetail {
        fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
            write!(f, "AppDetail {{ client: Arc<Mutex<Client>>, app_id: {:?}, safe_drive_access: {:?}, }}",
                   self.app_id, self.safe_drive_access)
        }
    }

    #[derive(Debug)]
    pub struct AuthData {
        pub str_nonce    : String,
        pub asymm_nonce  : ::sodiumoxide::crypto::box_::Nonce,
        pub asymm_pub_key: ::sodiumoxide::crypto::box_::PublicKey,
    }

    #[derive(Debug)]
    pub struct RsaData {
        pub symm_key  : ::sodiumoxide::crypto::secretbox::Key,
        pub symm_nonce: ::sodiumoxide::crypto::secretbox::Nonce,
    }
}
