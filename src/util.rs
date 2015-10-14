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

/// Validate Keyword
pub fn validate_keyword(keyword: &String) -> Result<String, ::errors::LauncherError> {
    let keyword = keyword.trim().to_string();
    if keyword.len() > 0 {
       Ok(keyword)
    } else {
       Err(::errors::LauncherError::EmptyKeyword)
    }
}

/// Validate PIN
pub fn validate_pin(pin: &String) -> Result<String, ::errors::LauncherError> {
    let pin = pin.trim().to_string();
    if pin.parse::<u16>().is_ok() && pin.len() == 4 {
       Ok(pin)
   } else {
       Err(::errors::LauncherError::InvalidPin)
   }
}

/// Validate Password
pub fn validate_password(password: &String) -> Result<String, ::errors::LauncherError> {
    let password = password.trim().to_string();
    if password.len() > 0 {
       Ok(password)
    } else {
       Err(::errors::LauncherError::EmptyPassword)
    }
}

#[cfg(test)]
mod tests {

    #[test]
    pub fn validate_keyword() {
        assert!(::util::validate_keyword(&"".to_string()).is_err());
        assert!(::util::validate_keyword(&"    ".to_string()).is_err());
        assert!(::util::validate_keyword(&"aaa".to_string()).is_ok());
        assert!(::util::validate_keyword(&" ss   ".to_string()).is_ok());
        assert_eq!(eval_result!(::util::validate_keyword(&" ss   ".to_string())), "ss".to_string());
    }

    #[test]
    pub fn validate_password() {
        assert!(::util::validate_password(&"".to_string()).is_err());
        assert!(::util::validate_password(&"    ".to_string()).is_err());
        assert!(::util::validate_password(&"aaa".to_string()).is_ok());
        assert!(::util::validate_password(&" ss   ".to_string()).is_ok());
        assert_eq!(eval_result!(::util::validate_password(&" ss   ".to_string())), "ss".to_string());
    }

    #[test]
    pub fn validate_pin() {
        assert!(::util::validate_pin(&"".to_string()).is_err());
        assert!(::util::validate_pin(&"    ".to_string()).is_err());
        assert!(::util::validate_pin(&"1234".to_string()).is_ok());
        assert!(::util::validate_pin(&" 1234   ".to_string()).is_ok());
        assert!(::util::validate_pin(&"1e34".to_string()).is_err());
        assert_eq!(eval_result!(::util::validate_pin(&" 1234   ".to_string())), "1234".to_string());
    }

}
