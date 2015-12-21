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

/// This macro is intended to be used in all cases where we get Result<T, U> and want to print a
/// debug information about it and break out of some loop, for e.g. an event loop
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate log;
/// # #[macro_use] extern crate safe_launcher;
/// fn f() -> Result<(), safe_launcher::errors::LauncherError> {
///     let some_result = Err(safe_launcher::errors::LauncherError::from("An Example Error"));
///
///     some_result
/// }
///
/// fn main() {
///     loop {
///         eval_break!(f());
///     }
/// }
/// ```
#[macro_export]
macro_rules! eval_break {
    ($result:expr) => {
        match $result {
            Ok(value)  => value,
            Err(error) => {
                let decorator = ::std::iter::repeat('-').take(50).collect::<String>();
                debug!("\n\n {}\n| {:?}\n {}\n\nBreaking out of loop...\n",
                       decorator,
                       error,
                       decorator);
                break;
            },
        }
    }
}

/// This macro is intended to be used in all cases when we want to send a value to a group
/// (Vector) of `std::sync::mpsc::Sender<T>`, for e.g. an observer pattern with senders. It
/// performs necessary trait conversion for sending the given data if such a conversion was
/// defined.
/// Additionally it will purge all the dead observers (i.e. those no longer existing or
/// interested in observing).
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate safe_launcher;
/// # #[macro_use] extern crate maidsafe_utilities;
/// struct DataType {
///     field: String,
/// }
///
/// struct Notifier {
///     observers: Vec<std::sync::mpsc::Sender<DataType>>,
/// }
///
/// impl Notifier {
///     pub fn notify_all(&mut self) {
///         let data = DataType {
///             field: "Some String".to_string(),
///         };
///
///         group_send!(data, &mut self.observers);
///     }
/// }
///
/// fn main() {
///     let (tx, rx) = std::sync::mpsc::channel();
///     let joiner = thread!("Doc-group_send-thread", move || {
///         let data: DataType = unwrap_result!(rx.recv());
///     });
///
///     let mut notifier = Notifier {
///         observers: vec![tx],
///     };
///
///     notifier.notify_all();
///
///     unwrap_result!(joiner.join());
/// }
/// ```
#[macro_export]
macro_rules! group_send {
    ($data:expr, $senders:expr) => {{
        // Wrapping in an Option is a trick to avoid error:
        // - cannot move out of captured outer variable in an `FnMut` closure
        // while doing a move in the closure provided to `retain()` below
        let mut option_dance = Some($data);
        $senders.retain(|tx| tx.send(::std::convert::From::from(unwrap_option!(option_dance.take(), "Logic Error - Report a bug.")))
                               .is_ok());
    }}
}

/// This macro is intended to be used in all cases when we want to send a value to a single
/// `std::sync::mpsc::Sender<T>`, for e.g. an observer. It performs necessary trait conversion for
/// sending the given data if such a conversion was defined.
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate safe_launcher;
/// # #[macro_use] extern crate maidsafe_utilities;
/// struct DataType {
///     field: String,
/// }
///
/// struct Notifier {
///     observer: std::sync::mpsc::Sender<DataType>,
/// }
///
/// impl Notifier {
///     pub fn notify_one(&mut self) {
///         let data = DataType {
///             field: "Some String".to_string(),
///         };
///
///         send_one!(data, &self.observer);
///     }
/// }
///
/// fn main() {
///     let (tx, rx) = std::sync::mpsc::channel();
///     let joiner = thread!("Doc-group_send-thread", move || {
///         let data: DataType = unwrap_result!(rx.recv());
///     });
///
///     let mut notifier = Notifier {
///         observer: tx,
///     };
///
///     notifier.notify_one();
///
///     unwrap_result!(joiner.join());
/// }
/// ```
#[macro_export]
macro_rules! send_one {
    ($data:expr, $sender:expr) => {
        $sender.send(::std::convert::From::from($data))
    }
}

/// This macro is intended to be used in all cases where we get an Err out of Result<T, U> and
/// want to send it to a single `std::sync::mpsc::Sender<Result<T, U>>`, for e.g.  an observer,
/// and subsequently return from the function.
/// Additionally it will purge all the dead observers (i.e. those no longer existing or interested
/// in observing).
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate safe_launcher;
/// # #[macro_use] extern crate maidsafe_utilities;
/// struct DataType {
///     field: String,
/// }
///
/// fn g() -> Result<String, safe_launcher::errors::LauncherError> {
///     Err(safe_launcher::errors::LauncherError::from("An Example Error"))
/// }
///
/// fn f(sender: std::sync::mpsc::Sender<Result<DataType, safe_launcher::errors::LauncherError>>) {
///     let some_val = eval_send_one!(g(), &sender);
///
///     let data = DataType {
///         field: some_val,
///     };
///
///     send_one!(Ok(data), &sender);
/// }
///
/// fn main() {
///     let (tx, rx) = std::sync::mpsc::channel();
///     let joiner = thread!("Doc-eval_send_one-thread", move || {
///         let result: Result<DataType,
///                            safe_launcher::errors::LauncherError> = unwrap_result!(rx.recv());
///         assert!(result.is_err());
///     });
///
///     f(tx);
///
///     unwrap_result!(joiner.join());
/// }
/// ```
#[macro_export]
macro_rules! eval_send_one {
    ($result:expr, $sender:expr) => {
        match $result {
            Ok(value)  => value,
            Err(error) => {
                let converted_err = Err(::std::convert::From::from(error));
                let _ = send_one!(converted_err, $sender);
                return
            },
        }
    }
}

/// This macro is intended to be used in all cases where we get a None out of Option<T> and want to
/// package it into `safe_launcher::errors::LauncherError::SpecificParseError(String)`. This is
/// useful because there may be miscellaneous erros while parsing through a valid JSON due to JSON
/// not conforming to certain mandatory requirements. This can then be communicated back to the
/// JSON sending client.
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate safe_launcher;
/// fn g() -> Result<(), safe_launcher::errors::LauncherError> {
///     let mut remaining_tokens = vec![];
///     let _module = try!(parse_option!(remaining_tokens.pop(), "Invalid endpoint - Module token not found."));
///
///     Ok(())
/// }
///
/// fn main() {
///     if let Err(err) = g() {
///         println!("{:?}", err);
///     }
/// }
/// ```
#[macro_export]
macro_rules! parse_option {
    ($output:expr, $err_statement:expr) => {
        $output.ok_or($crate::errors::LauncherError::SpecificParseError($err_statement.to_string()))
    }
}

/// This macro is intended to be used in all cases where we get an Err out of Result<T, U> and want
/// to package it into `safe_launcher::errors::LauncherError::SpecificParseError(String)`. This is
/// useful because there may be miscellaneous erros while parsing through a valid JSON due to JSON
/// not conforming to certain mandatory requirements. This can then be communicated back to the
/// JSON sending client.
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate safe_launcher;
/// #[derive(Debug)]
/// enum SomeSpecialError {
///     Zero,
///     One,
/// }
///
/// fn f() -> Result<String, SomeSpecialError> {
///     Err(SomeSpecialError::One)
/// }
///
/// fn g() -> Result<(), safe_launcher::errors::LauncherError> {
///     let _module = try!(parse_result!(f(), ""));
///
///     Ok(())
/// }
///
/// fn main() {
///     if let Err(err) = g() {
///         println!("{:?}", err);
///     }
/// }
/// ```
#[macro_export]
macro_rules! parse_result {
    ($output:expr, $err_statement:expr) => {
        $output.map_err(|e| $crate::errors::LauncherError::SpecificParseError(format!("{} {:?}", $err_statement.to_string(), e)))
    }
}

/// This macro is intended to be used in all cases where we get Result<T, U> and want to convert it
/// to C friendly error code to inform about error conditions accross library boundaries
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate safe_launcher;
/// fn f() -> i32 {
///     let some_result: Result<String, safe_launcher::errors::LauncherError> = Ok("Hello".to_string());
///     let string_length = ffi_try!(some_result).len();
///     assert_eq!(string_length, 5);
///     0
/// }
/// # fn main() {
/// # let _error_code = f();
/// # }
/// ```
#[macro_export]
macro_rules! ffi_try {
    ($result:expr) => {
        match $result {
            Ok(value)  => value,
            Err(error) => {
                let decorator = ::std::iter::repeat('-').take(50).collect::<String>();
                println!("\n\n {}\n| {:?}\n {}\n\n", decorator, error, decorator);
                return error.into()
            },
        }
    }
}
