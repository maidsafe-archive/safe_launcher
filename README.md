# safe_launcher

# Quick start
The development dependency of this project is [Node.js v5.5](https://nodejs.org/download/release/v5.5.0/).
Build [safe_core](https://github.com/maidsafe/safe_core) with the mock Routing feature:
 
```
cargo build --release --features use-mock-routing
```
 
then copy the resulting shared library (`safe_core.dll` for Windows, `libsafe_core.so` for Linux or `libsafe_core.dylib` for OS X) to the `app/api/ffi` folder of this project.

The launcher can be developed/tested only with ffi with mock feature or by running a local network only.

So just make sure you have it installed.
Then type few commands known to every Node developer...
```
npm install
npm start
```

# Development

#### Installation

```
npm install
```
It will also download Electron runtime, and install dependencies for second `package.json` & `bower.json` file inside `app` folder.

#### Starting the app

```
npm start
```

#### Adding npm modules to your app

Remember to add your dependency to `app/package.json` file, so do:
```
cd app
npm install name_of_npm_module --save
```

#### Unit tests

To run it go with standard:
```
npm test
```

# Making a distributable package

To make ready for distribution package use command based on the platform:
```
npm run package
```
this will generate the package files in the `app_dist` folder


# Making a release

To make ready for distribution installer use command:
```
npm run release
```
It will start the packaging process for operating system you are running this command on. Ready for distribution file will be outputted to `releases` directory.

You can create Windows installer only when running on Windows, the same is true for Linux and OSX. So to generate all three installers you need all three operating systems.

## Mac only

#### App signing

The Mac release supports [code signing](https://developer.apple.com/library/mac/documentation/Security/Conceptual/CodeSigningGuide/Procedures/Procedures.html). To sign the `.app` in the release image, include the certificate ID in the command as so,
```
npm run release -- --sign A123456789
```

## Windows only

#### Installer

The installer is built using [NSIS](http://nsis.sourceforge.net). You have to install NSIS version 3.0, and add its folder to PATH in Environment Variables.

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
