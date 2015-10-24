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

pub enum AppHandlerEvent {
    AddApp(event_data::AppDetail),
    RemoveApp(::routing::NameType),
    ActivateApp(::routing::NameType),
    RegisterAppAddObserver(::observer::AppHandlerObserver),
    RegisterAppRemoveObserver(::observer::AppHandlerObserver),
    GetAllManagedApps(::std::sync::mpsc::Sender<Vec<event_data::ManagedApp>>),
    Terminate,
}

impl ::std::fmt::Debug for AppHandlerEvent {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        write!(f, "{:?}", *self)
    }
}

pub mod event_data {
    #[derive(Debug, Clone)]
    pub struct AppDetail {
        pub absolute_path    : String,
        pub safe_drive_access: bool,
    }

    #[derive(Debug, Clone)]
    pub struct ManagedApp {
        pub id               : ::routing::NameType,
        pub local_path       : Option<String>,
        pub reference_count  : u32,
        pub safe_drive_access: bool,
    }
}
