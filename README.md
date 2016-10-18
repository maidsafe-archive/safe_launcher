# safe_launcher

|Linux/OS X|Windows|
|:---:|:--------:|
|[![Build Status](https://travis-ci.org/maidsafe/safe_launcher.svg?branch=master)](https://travis-ci.org/maidsafe/safe_launcher)|[![Build status](https://ci.appveyor.com/api/projects/status/xnsjhx27snoh4lmy?svg=true)](https://ci.appveyor.com/project/MaidSafe-QA/safe-launcher/branch/master)|


## Installation
The development dependency of this project is [Node.js v6.0 or above](https://nodejs.org/download/release/v6.0.0/).
Build [safe_core version 0.22.0](https://github.com/maidsafe/safe_core) with the mock Routing feature:
 
```
cargo build --release --features use-mock-routing
```
 
then copy the resulting shared library (`safe_core.dll` for Windows, `libsafe_core.so` for Linux or `libsafe_core.dylib` for OS X) to the `app/ffi` folder of this project.

The launcher can be developed/tested only with ffi with mock feature or by running a local network only.


```
npm install
```

### Rebuild native dependencies
Native dependencies `ffi` and `ref` have be rebuilt using `electron-rebuild`

```
$ npm run rebuild-native
```

## Starting the app


Run this two commands simultaneously in different console tabs.
```
$ npm run hot-server
$ npm run start-hot
```
or run two servers with one command
```
npm run dev
```

# Making a distributable package

To make ready for distribution package use command based on the platform:
```
$ npm run package
```

this will generate the package files in the `release` folder.

# License

Licensed under either of

* the MaidSafe.net Commercial License, version 1.0 or later ([LICENSE](LICENSE))
* the General Public License (GPL), version 3 ([COPYING](COPYING) or http://www.gnu.org/licenses/gpl-3.0.en.html)

at your option.

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the
work by you, as defined in the MaidSafe Contributor Agreement, version 1.1 ([CONTRIBUTOR]
(CONTRIBUTOR)), shall be dual licensed as above, and you agree to be bound by the terms of the
MaidSafe Contributor Agreement, version 1.1.
