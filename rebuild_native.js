import os from 'os';
import childProcess from 'child_process';
import path from 'path';
import * as electron from 'electron-prebuilt';
import * as rebuild from 'electron-rebuild';

const pathToElectronNativeModules = path.join(__dirname, '/node_modules');
const electronVersion = require('electron-prebuilt/package.json').version;

const rebuildNativeModules = () => {
  rebuild.shouldRebuildNativeModules(electron)
    .then(function(shouldBuild) {
      if (!shouldBuild) {
        return true;
      }

      return rebuild.installNodeHeaders(electronVersion)
        .then(function() {
          return rebuild.rebuildNativeModules(electronVersion, pathToElectronNativeModules);
        });
    })
    .then(function() {
      console.log('Rebuilding complete.');
    })
    .catch(function(err) {
      console.error("Rebuilding error!");
      console.error(err);
    });
};

const rebuildForWindows = () => {
  const mods = ['ffi', 'ref'];
  for (let mod of mods) {
    console.log('Rebuilding ', mod);
    childProcess.execSync('node-gyp rebuild --target=' + electronVersion + ' --arch=' + os.arch() +
    ' --dist-url=https://atom.io/download/atom-shell', {
      cwd: 'node_modules/' + mod
    });
  }
  console.log('Rebuilding complete.');
};

console.log('Rebuilding native modules');
"win32" === os.platform() ? rebuildForWindows() : rebuildNativeModules();
