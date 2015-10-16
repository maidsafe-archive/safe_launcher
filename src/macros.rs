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

/// This macro is intended to be used in all cases where we get Result<T, U> and want to convert it
/// to C friendly error code to inform about error conditions accross library boundaries
///
/// #Examples
///
/// ```
/// # #[macro_use] extern crate safe_launcher;
/// # #[macro_use] extern crate safe_core;
/// fn f() -> i32 {
///     let some_result: Result<String, safe_core::errors::CoreError> = Ok("Hello".to_string());
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
