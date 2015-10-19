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

#[derive(Clone)]
pub struct EventSender<Category, EventSubset> {
    event_tx         : ::std::sync::mpsc::Sender<EventSubset>,
    event_category   : Category,
    event_category_tx: ::std::sync::mpsc::Sender<Category>,
}

impl<Category   : ::std::fmt::Debug + Clone,
     EventSubset: ::std::fmt::Debug> EventSender<Category, EventSubset> {
    pub fn new(event_tx         : ::std::sync::mpsc::Sender<EventSubset>,
               event_category   : Category,
               event_category_tx: ::std::sync::mpsc::Sender<Category>) -> EventSender<Category, EventSubset> {
        EventSender {
            event_tx         : event_tx,
            event_category   : event_category,
            event_category_tx: event_category_tx,
        }
    }

    pub fn send(&self, event: EventSubset) -> Result<(), ::errors::LauncherError> {
        if let Err(error) = self.event_tx.send(event) {
            debug!("Error {:?} sending event {:?}", error, error.0);
            return Err(::errors::LauncherError::ReceiverChannelDisconnected)
        }
        if let Err(error) = self.event_category_tx.send(self.event_category.clone()) {
            debug!("Error {:?} sending event {:?}", error, error.0);
            return Err(::errors::LauncherError::ReceiverChannelDisconnected)
        }

        Ok(())
    }
}
