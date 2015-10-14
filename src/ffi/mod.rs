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

mod errors;
mod implementation;

/// Create a registered client. This or any one of the other companion functions to get a
/// client must be called before initiating any operation allowed by this crate. `client_handle` is
/// a pointer to a pointer and must point to a valid pointer not junk, else the consequences are
/// undefined.
#[no_mangle]
#[allow(unsafe_code)]
pub extern fn create_account(c_keyword      : *const ::libc::c_char,
                             c_pin          : *const ::libc::c_char,
                             c_password     : *const ::libc::c_char,
                             launcher_handle: *mut *const ::libc::c_void) -> ::libc::int32_t {
    let launcher = ffi_try!(::launcher::Launcher::create_account(ffi_try!(implementation::c_char_ptr_to_string(c_keyword)),
                                                                 ffi_try!(implementation::c_char_ptr_to_string(c_pin)),
                                                                 ffi_try!(implementation::c_char_ptr_to_string(c_password))));
    unsafe { *launcher_handle = cast_to_launcher_ffi_handle(launcher); }

    0
}

/// Log into Safenetwork with an already registered account. This or any one of the other companion functions to get a
/// launcher must be called before initiating any operation allowed by this crate. `launcher_handle` is
/// a pointer to a pointer and must point to a valid pointer not junk, else the consequences are
/// undefined.
#[no_mangle]
#[allow(unsafe_code)]
pub extern fn log_in(c_keyword      : *const ::libc::c_char,
                     c_pin          : *const ::libc::c_char,
                     c_password     : *const ::libc::c_char,
                     launcher_handle: *mut *const ::libc::c_void) -> ::libc::int32_t {
    let launcher = ffi_try!(::launcher::Launcher::log_in(ffi_try!(implementation::c_char_ptr_to_string(c_keyword)),
                                                         ffi_try!(implementation::c_char_ptr_to_string(c_pin)),
                                                         ffi_try!(implementation::c_char_ptr_to_string(c_password))));
    unsafe { *launcher_handle = cast_to_launcher_ffi_handle(launcher); }

    0
}

/// Discard and clean up the previously allocated launcher. Use this only if the launcher is obtained
/// from one of the client obtainment functions in this crate (`create_account`, `log_in`).
/// Using `launcher_handle` after a call to this functions is undefined behaviour.
#[no_mangle]
#[allow(unsafe_code)]
pub extern fn drop_launcher(launcher_handle: *const ::libc::c_void) {
    let _ = unsafe { ::std::mem::transmute::<_, Box<::std::sync::Arc<::std::sync::Mutex<::launcher::Launcher>>>>(launcher_handle) };
}

#[allow(unsafe_code)]
fn cast_to_launcher_ffi_handle(launcher: ::launcher::Launcher) -> *const ::libc::c_void {
    let boxed_launcher = Box::new(::std::sync::Arc::new(::std::sync::Mutex::new(launcher)));
    unsafe { ::std::mem::transmute(boxed_launcher) }
}

#[allow(unsafe_code)]
fn cast_from_launcher_ffi_handle(launcher_handle: *const ::libc::c_void) -> ::std::sync::Arc<::std::sync::Mutex<::launcher::Launcher>> {
    let boxed_launcher: Box<::std::sync::Arc<::std::sync::Mutex<::launcher::Launcher>>> = unsafe {
        ::std::mem::transmute(launcher_handle)
    };

    let launcher = (*boxed_launcher).clone();
    ::std::mem::forget(boxed_launcher);

    launcher
}
