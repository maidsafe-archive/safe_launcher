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

use ::std::error::Error;

/// Converts int array of u8 from c to Rust Vec
#[allow(unsafe_code)]
pub fn c_uint8_ptr_to_vec(c_uint8_ptr: *const ::libc::uint8_t, c_size: ::libc::size_t) -> Vec<u8> {
    unsafe { ::std::slice::from_raw_parts(c_uint8_ptr, c_size as usize).to_vec() }
}

/// Converts c character pointer into Rust String
#[allow(unsafe_code)]
pub fn c_char_ptr_to_string(c_char_ptr: *const ::libc::c_char) -> Result<String, ::ffi::errors::FfiError> {
    let cstr = unsafe { ::std::ffi::CStr::from_ptr(c_char_ptr) };
    Ok(try!(String::from_utf8(cstr.to_bytes().iter().map(|a| *a).collect()).map_err(|error| ::ffi::errors::FfiError::from(error.description()))))
}
