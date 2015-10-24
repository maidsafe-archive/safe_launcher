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

/// This structure is coded to achieve event-subsetting. Receivers in Rust are blocking. One cannot
/// listen to multiple receivers at the same time except by using `try_recv` which again is bad for
/// the same reasons spin-lock based on some sleep is bad (wasting cycles, 50% efficienct on an
/// average etc.). Consider a module that listens to signals from various other modules. Different
/// modules want to talk to this one. So one solution is make a common event set and all senders
/// (registered in all the interested modules) send events from the same set. This is bad for
/// maintenance. Wrong modules might use events not expected to originate from them since it is just
/// one huge event-set. Thus there is a need of event-subsetting and distribute this module-wise so
/// we prevent modules from using wrong events, completely by design and code-mechanics. Also we
/// don't want to spawn threads listening to different receivers (which will force to share ownership
/// which is against design philosophy of Launcher). This is what `EventSender` helps to salvage. A
/// simple mechanism that does what a `skip-list` in linked list does. It brings forth a concept of
/// an Umbrella event-category and an event subset. The creator of `EventSender` hard-codes the
/// category for different observers. Each category only links to a particular event-subset and
/// type information of this is put into `EventSender` to during it's construction. Thus when
/// distributed, modules cannot cheat (do the wrong thing) by trying to fire an event they are not
/// permitted. Also a single thread listens to various receivers. All problems solved.
pub struct EventSender<Category, EventSubset> {
    event_tx         : ::std::sync::mpsc::Sender<EventSubset>,
    event_category   : Category,
    event_category_tx: ::std::sync::mpsc::Sender<Category>,
}

impl<Category   : ::std::fmt::Debug + Clone,
     EventSubset: ::std::fmt::Debug> EventSender<Category, EventSubset> {
    /// Create a new instance of `EventSender`. Category type, category value and EventSubset type
    /// is baked into `EventSender` to disallow user code from misusing it.
    pub fn new(event_tx         : ::std::sync::mpsc::Sender<EventSubset>,
               event_category   : Category,
               event_category_tx: ::std::sync::mpsc::Sender<Category>) -> EventSender<Category, EventSubset> {
        EventSender {
            event_tx         : event_tx,
            event_category   : event_category,
            event_category_tx: event_category_tx,
        }
    }

    /// Fire an allowed event/signal to the observer.
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

// (Spandan)
// Needed to manually implement this since the attribute version (#[derive(Clone)]) seems to
// require not only the field types but also the sub-types in the field types to be clonable
// which is stupid because field like Sender<T> are clonable without requirement of T to be
// clonable.
impl<Category   : ::std::fmt::Debug + Clone,
     EventSubset: ::std::fmt::Debug> Clone for EventSender<Category, EventSubset> {
    fn clone(&self) -> Self {
        EventSender {
            event_tx         : self.event_tx.clone(),
            event_category   : self.event_category.clone(),
            event_category_tx: self.event_category_tx.clone(),
        }
    }
}
