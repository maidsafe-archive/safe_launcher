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
#[macro_use] extern crate safe_core;
#[macro_use] extern crate safe_launcher;
#[allow(unused_extern_crates)] extern crate env_logger;

mod event_loop;

/// Contains lists of various categories of apps
pub struct Lists {
    managed_apps: std::sync::Arc<std::sync::Mutex<Vec<safe_launcher::launcher::event_data::ManagedApp>>>,
    running_apps: std::sync::Arc<std::sync::Mutex<Vec<routing::NameType>>>,
}

fn main() {
    let app_lists = Lists {
        managed_apps: ::std::sync::Arc::new(std::sync::Mutex::new(Vec::with_capacity(5))),
        running_apps: ::std::sync::Arc::new(std::sync::Mutex::new(Vec::with_capacity(5))),
    };

    let client = eval_result!(safe_core::utility::test_utils::get_client());
    let launcher = eval_result!(safe_launcher::launcher::Launcher::new(client));

    let (_raii_joiner, internal_sender) = event_loop::run_event_loop(&launcher, &app_lists);

    // ---------------------------------------------
    //      ------ Put Main Menu Here ------
    // ---------------------------------------------

    // After Main Menu Exit Condition
    eval_result!(internal_sender.send(event_loop::Terminate));
}
