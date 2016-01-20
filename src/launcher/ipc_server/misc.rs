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
use maidsafe_utilities::thread::RaiiThreadJoiner;
use launcher::ipc_server::ipc_session::{events, EventSenderToSession};
use safe_nfs::metadata::directory_key::DirectoryKey;

pub struct SessionInfo {
    pub _raii_joiner: RaiiThreadJoiner,
    pub event_sender: EventSenderToSession<events::ExternalEvent>,
}

impl SessionInfo {
    pub fn new(raii_joiner: RaiiThreadJoiner,
               event_sender: EventSenderToSession<events::ExternalEvent>)
               -> SessionInfo {
        SessionInfo {
            _raii_joiner: raii_joiner,
            event_sender: event_sender,
        }
    }
}

impl Drop for SessionInfo {
    fn drop(&mut self) {
        if let Err(err) = self.event_sender.send(events::ExternalEvent::Terminate) {
            debug!("Failed to send terminate event to session {:?}", err);
        }
    }
}

pub struct AppInfo {
    pub app_id: XorName,
    pub app_root_dir_key: DirectoryKey,
    pub safe_drive_access: bool,
}

impl AppInfo {
    pub fn new(app_id: XorName,
               app_root_dir_key: DirectoryKey,
               safe_drive_access: bool)
               -> AppInfo {
        AppInfo {
            app_id: app_id,
            app_root_dir_key: app_root_dir_key,
            safe_drive_access: safe_drive_access,
        }
    }
}
