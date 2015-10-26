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

pub fn handle_self_authentication() -> Result<::safe_core::client::Client,
                                              ::safe_launcher::errors::LauncherError> {
    use std::io::Write;

    print!("Do you have an existing account [Y to login to an existing account] ?: ");
    eval_result!(::std::io::stdout().flush());
    let mut choice = String::new();
    let _ = eval_result!(::std::io::stdin().read_line(&mut choice));
    choice = choice.trim().to_string();

    let action = if choice == "Y" || choice == "y" {
        "Login".to_string()
    } else {
        "Creation".to_string()
    };

    let mut pin = String::new();
    let mut keyword = String::new();
    let mut password = String::new();

    println!("\n\tAccount {}", action);
    println!("\t================");

    println!("\n------------ Enter Keyword ---------------");
    let _ = eval_result!(::std::io::stdin().read_line(&mut keyword));

    println!("\n\n------------ Enter Password --------------");
    let _ = eval_result!(::std::io::stdin().read_line(&mut password));
    loop {
        println!("\n\n--------- Enter PIN (4 Digits) -----------");
        let _ = eval_result!(::std::io::stdin().read_line(&mut pin));
        pin = pin.trim().to_string();
        if pin.parse::<u16>().is_ok() && pin.len() == 4 {
            break;
        }
        println!("ERROR: PIN is not 4 Digits !!");
        pin.clear();
    }

    if choice == "Y" || choice == "y" {
        Ok(try!(::safe_core::client::Client::log_in(keyword, pin, password)))
    } else {
        Ok(try!(::safe_core::client::Client::create_account(keyword, pin, password)))
    }
}
