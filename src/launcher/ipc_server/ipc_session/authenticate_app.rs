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

const NONCE_VERIFIER_THREAD_NAME: &'static str = "LauncherNonceVerifierThread";

pub fn verify_launcher_nonce(ipc_stream  : ::launcher::ipc_server::ipc_session::stream::IpcStream,
                             event_sender: ::launcher::ipc_server::ipc_session
                                           ::EventSenderToSession<::launcher::ipc_server::ipc_session
                                                                  ::events::AppAuthenticationEvent>) -> ::safe_core
                                                                                                        ::utility
                                                                                                        ::RAIIThreadJoiner {
    let joiner = eval_result!(::std::thread::Builder::new().name(NONCE_VERIFIER_THREAD_NAME.to_string())
                                                           .spawn(move || {
        let nonce = "TemporaryCode".to_string();
        if let Err(err) = event_sender.send(::launcher
                                            ::ipc_server
                                            ::ipc_session
                                            ::events::AppAuthenticationEvent::ReceivedNonce(nonce)) {
            debug!("Error sending event {:?}", err);
        }

        debug!("Exiting thread {:?}", NONCE_VERIFIER_THREAD_NAME);
    }));

    ::safe_core::utility::RAIIThreadJoiner::new(joiner)
}
