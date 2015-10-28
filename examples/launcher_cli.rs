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

//! #Safe-Launcher-CLI Example
//! [Project github page](https://github.com/maidsafe/safe_launcher)

// For explanation of lint checks, run `rustc -W help` or see
// https://github.com/maidsafe/QA/blob/master/Documentation/Rust%20Lint%20Checks.md
#![forbid(bad_style, exceeding_bitshifts, mutable_transmutes, no_mangle_const_items,
          unknown_crate_types, warnings)]
#![deny(deprecated, drop_with_repr_extern, improper_ctypes, missing_docs,
        non_shorthand_field_patterns, overflowing_literals, plugin_as_library,
        private_no_mangle_fns, private_no_mangle_statics, raw_pointer_derive, stable_features,
        unconditional_recursion, unknown_lints, unsafe_code, unused, unused_allocation,
        unused_attributes, unused_comparisons, unused_features, unused_parens, while_true)]
#![warn(trivial_casts, trivial_numeric_casts, unused_extern_crates, unused_import_braces,
        unused_qualifications, unused_results, variant_size_differences)]
#![allow(box_pointers, fat_ptr_transmutes, missing_copy_implementations,
         missing_debug_implementations)]

extern crate routing;
#[macro_use] extern crate log;
#[macro_use] extern crate safe_core;
#[macro_use] extern crate safe_launcher;
#[allow(unused_extern_crates)] extern crate env_logger;

mod self_auth;
mod event_loop;

/// Contains lists of various categories of apps
pub struct Lists {
    managed_apps       : std::sync::Arc<std::sync::Mutex<Vec<safe_launcher::launcher::app_handler_event_data::ManagedApp>>>,
    running_apps       : std::sync::Arc<std::sync::Mutex<Vec<routing::NameType>>>,
    pending_add_request: std::sync::Arc<std::sync::Mutex<std::collections::HashMap<String, bool>>>,
}

fn on_add_app(lists   : &Lists,
              launcher: &safe_launcher::launcher::Launcher) {
    use std::io::Write;

    println!("\n=============== Add an application to be managed ===============\n");

    print!("Enter absolute path to the binary [use only front-slashes]: "); eval_result!(std::io::stdout().flush());
    let mut local_path = String::with_capacity(20);
    let _ = eval_result!(std::io::stdin().read_line(&mut local_path));
    local_path = local_path.trim().to_string();

    print!("Permission to access \"SAFEDrive\" [Y if allowed] : "); eval_result!(std::io::stdout().flush());
    let mut permission = String::new();
    let _ = eval_result!(std::io::stdin().read_line(&mut permission));
    permission = permission.trim().to_string();
    let safe_drive_access = permission == "Y" || permission == "y";

    let _ = eval_result!(lists.pending_add_request.lock()).insert(local_path.clone(), safe_drive_access);
    let data = safe_launcher::launcher::app_handler_event_data::AppDetail {
        absolute_path    : local_path,
        safe_drive_access: safe_drive_access,
    };
    eval_result!(send_one!(data, launcher.get_app_handler_event_sender()));
}

fn on_remove_app(lists   : &Lists,
                 launcher: &safe_launcher::launcher::Launcher) {
    use std::io::Write;

    println!("\n=============== Remove a managed application  ===============\n");

    print!("Enter application serial number: "); eval_result!(std::io::stdout().flush());
    let mut serial_no = String::with_capacity(3);
    let _ = eval_result!(std::io::stdin().read_line(&mut serial_no));

    if let Ok(serial_number) = serial_no.trim().parse::<usize>() {
        let ref managed_apps = *eval_result!(lists.managed_apps.lock());

        if serial_number > 0 && serial_number <= managed_apps.len() {
            eval_result!(launcher.get_app_handler_event_sender()
                                 .send(safe_launcher::launcher
                                                    ::AppHandlerEvent
                                                    ::RemoveApp(managed_apps[serial_number - 1].id)));
        } else {
            println!("Error: Invalid Serial Number.");
        }
    } else {
        println!("Error: Invalid Serial Number.");
    }
}

fn on_list_all_managed_apps(lists: &Lists) {
    println!("\n=============== Managed Applications ===============");
    for it in eval_result!(lists.managed_apps.lock()).iter().enumerate() {
        let location = if let Some(ref loc) = it.1.local_path {
            loc.clone()
        } else {
            " -- N/A --".to_string()
        };

        let is_activated = eval_result!(lists.running_apps.lock()).iter().find(|id| **id == it.1.id).is_some();

        println!("\n------------------- Application - Serial number {} -------------------", it.0 + 1);
        println!("Unique App-ID: {:?}\nName: {}\nLocation on this machine: {}\nNumber of machines installed in: {}\nIs allowed \"SAFEDrive\" access: {}\n\nCurrently activated: {}",
                 it.1.id, it.1.name, location, it.1.reference_count, it.1.safe_drive_access, is_activated);
    }
    println!("\n====================================================\n");
}

fn on_activate_app(lists   : &Lists,
                   launcher: &safe_launcher::launcher::Launcher) {
    use std::io::Write;

    println!("\n=============== Activate a managed application  ===============\n");

    print!("Enter application serial number: "); eval_result!(std::io::stdout().flush());
    let mut serial_no = String::with_capacity(3);
    let _ = eval_result!(std::io::stdin().read_line(&mut serial_no));

    if let Ok(serial_number) = serial_no.trim().parse::<usize>() {
        let ref managed_apps = *eval_result!(lists.managed_apps.lock());

        if serial_number > 0 && serial_number <= managed_apps.len() {
            eval_result!(launcher.get_app_handler_event_sender()
                                 .send(safe_launcher::launcher
                                                    ::AppHandlerEvent
                                                    ::ActivateApp(managed_apps[serial_number - 1].id)));
        } else {
            println!("Error: Invalid Serial Number.");
        }
    } else {
        println!("Error: Invalid Serial Number.");
    }
}

fn on_modify_app(lists   : &Lists,
                 launcher: &safe_launcher::launcher::Launcher) {
    use std::io::Write;

    println!("\n=============== Modify a managed application  ===============\n");

    print!("Enter application serial number: "); eval_result!(std::io::stdout().flush());
    let mut serial_no = String::with_capacity(3);
    let _ = eval_result!(std::io::stdin().read_line(&mut serial_no));

    if let Ok(serial_number) = serial_no.trim().parse::<usize>() {
        let ref managed_apps = *eval_result!(lists.managed_apps.lock());

        if serial_number > 0 && serial_number <= managed_apps.len() {
            let mut user_option = String::new();
            let mut name = String::with_capacity(10);
            let mut path = String::with_capacity(20);
            let mut safe_drive_access = String::with_capacity(3);

            loop {
                println!("\n\n     -------------------\n    | MODIFICATION MENU |\n     -------------------");
                println!("\n<1> Change name");
                println!("\n<2> Change path to binary");
                println!("\n<3> Change \"SAFEDrive\" access permission");
                println!("\n<4> Apply and Exit");
                print!("\nEnter Option [1-4]: ");
                eval_result!(std::io::stdout().flush());
                let _ = std::io::stdin().read_line(&mut user_option);

                if let Ok(option) = user_option.trim().parse::<u8>() {
                    match option {
                        1 => {
                            name.clear();
                            print!("\nEnter new name: "); eval_result!(std::io::stdout().flush());
                            let _ = eval_result!(std::io::stdin().read_line(&mut name));
                            name = name.trim().to_string();
                        },
                        2 => {
                            path.clear();
                            print!("\nEnter new absolute path to binary [use only front-slashes]: "); eval_result!(std::io::stdout().flush());
                            let _ = eval_result!(std::io::stdin().read_line(&mut path));
                            path = path.trim().to_string();
                        },
                        3 => {
                            safe_drive_access.clear();
                            print!("Permission to access \"SAFEDrive\" [Y if allowed] : "); eval_result!(std::io::stdout().flush());
                            let _ = eval_result!(std::io::stdin().read_line(&mut safe_drive_access));
                            safe_drive_access = safe_drive_access.trim().to_string();
                        },
                        4 => break,
                        _ => println!("\nUnrecognised option !!"),
                    }
                } else {
                    println!("\nUnrecognised option !!");
                }
                user_option.clear();
            }

            let modify_app_settings = safe_launcher::launcher::app_handler_event_data::ModifyAppSettings {
                id               : managed_apps[serial_number - 1].id,
                name             : if name != "" { Some(name) } else { None },
                local_path       : if path != "" { Some(path) } else { None },
                safe_drive_access: if safe_drive_access != "" { Some(safe_drive_access == "Y" || safe_drive_access == "y") } else { None },
            };

            eval_result!(send_one!(modify_app_settings, &launcher.get_app_handler_event_sender()));
        } else {
            println!("Error: Invalid Serial Number.");
        }
    } else {
        println!("Error: Invalid Serial Number.");
    }
}

fn main() {
    use std::io::Write;

    let app_lists = Lists {
        managed_apps       : ::std::sync::Arc::new(std::sync::Mutex::new(Vec::with_capacity(5))),
        running_apps       : ::std::sync::Arc::new(std::sync::Mutex::new(Vec::with_capacity(5))),
        pending_add_request: ::std::sync::Arc::new(std::sync::Mutex::new(::std::collections::HashMap::new())),
    };

    let client = eval_result!(self_auth::handle_self_authentication());
    println!("\nSelf-authentication Successful !!");

    println!("Initialising Launcher ...");
    let launcher = eval_result!(safe_launcher::launcher::Launcher::new(client));

    let (_raii_joiner, internal_sender) = event_loop::EventLoop::new(&launcher, &app_lists);

    let mut user_option = String::new();

    loop {
        println!("\n\n     ------\n    | MENU |\n     ------");
        println!("\n<1> Add application");
        println!("\n<2> Remove application");
        println!("\n<3> List all managed applications");
        println!("\n<4> Activate application");
        println!("\n<5> Modify settings for application");
        println!("\n<6> Exit");

        print!("\nEnter Option [1-6]: ");
        eval_result!(std::io::stdout().flush());
        let _ = std::io::stdin().read_line(&mut user_option);

        if let Ok(option) = user_option.trim().parse::<u8>() {
            match option {
                1 => on_add_app(&app_lists, &launcher),
                2 => on_remove_app(&app_lists, &launcher),
                3 => on_list_all_managed_apps(&app_lists),
                4 => on_activate_app(&app_lists, &launcher),
                5 => on_modify_app(&app_lists, &launcher),
                6 => break,
                _ => println!("\nUnrecognised option !!"),
            }
        } else {
            println!("\nUnrecognised option !!");
        }

        user_option.clear();
    }

    eval_result!(internal_sender.send(event_loop::Terminate));
}
