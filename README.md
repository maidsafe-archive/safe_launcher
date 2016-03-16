safe_launcher
==============

# Quick start
The development dependency of this project is [Node.js](https://nodejs.org).
Build the [safe_ffi](https://github.com/maidsafe/safe_ffi) with feature `use-mock-network` and copy the `.dll` for Windows
, `.so` for Linux or `.dylib` for OSX to the `app/api/ffi` folder.

The launcher can be developed/tested only with ffi with mock feature or by running a local network only.

So just make sure you have it installed.
Then type few commands known to every Node developer...
```
npm install
npm start
```

# Development

### Using Vagrant

We are providing a virtual machine image to make development very easy. You will need [vagrant](https://www.vagrantup.com/) and [virtualbox](https://www.virtualbox.org/). You can set the system up by running:

```
vagrant up
```

From within the root directory. The first run might take a while as vagrant will download the image, the latest version of nodejs (latest 0.5) and rust (latest stable) and compile safe_ffi (github master) for you (and put it inside the appropriate launcher directory). Once everything is done, you can log into the system by running `vagrant ssh` and install and run this version of the safe launcher via `cd /vagrant && npm install && npm start`. Once you are done, you can stop the virtual machine by running `vagrant suspend` outside of that box and just do `vagrant up` again to bring it back up.

**Updating the image**: safe_ffi will automatically fetch the latest version and build that on every `vagrant up` or `vagrant reload` (if you want to trigger that). To update rust or node, you need to _provision_ the vagrant image again: In order to do that, run `vagrant reload --provision`.



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
