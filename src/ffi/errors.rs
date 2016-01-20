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

use std::fmt;

use safe_core::errors::CoreError;
use errors::{LAUNCHER_ERROR_START_RANGE, LauncherError};

const FFI_ERROR_START_RANGE: i32 = LAUNCHER_ERROR_START_RANGE - 500;

/// Errors during FFI operations
pub enum FfiError {
    /// Errors from Safe Core
    CoreError(Box<CoreError>),
    /// Errors from Launcher
    LauncherError(Box<LauncherError>),
    /// Unexpected or some programming error
    Unexpected(String),
}

impl fmt::Debug for FfiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            FfiError::CoreError(ref error) => write!(f, "FfiError::CoreError -> {:?}", error),
            FfiError::LauncherError(ref error) => {
                write!(f, "FfiError::LauncherError -> {:?}", error)
            }
            FfiError::Unexpected(ref error) => write!(f, "FfiError::Unexpected::{{{:?}}}", error),
        }
    }
}

impl From<LauncherError> for FfiError {
    fn from(error: LauncherError) -> FfiError {
        FfiError::LauncherError(Box::new(error))
    }
}

impl From<CoreError> for FfiError {
    fn from(error: CoreError) -> FfiError {
        FfiError::CoreError(Box::new(error))
    }
}

impl<'a> From<&'a str> for FfiError {
    fn from(error: &'a str) -> FfiError {
        FfiError::Unexpected(error.to_string())
    }
}

impl Into<i32> for FfiError {
    fn into(self) -> i32 {
        match self {
            FfiError::CoreError(error) => (*error).into(),
            FfiError::LauncherError(error) => (*error).into(),
            FfiError::Unexpected(_) => FFI_ERROR_START_RANGE - 1,
        }
    }
}
