import os from 'os';
import childProcess from 'child_process';
import path from 'path';
import electron from 'electron-prebuilt';
import * as rebuild from 'electron-rebuild';

const pathToElectronNativeModules = path.join(__dirname, '/node_modules');
const electronVersion = require('electron-prebuilt/package.json').version;

const rebuildNativeModules = () => {
  rebuild.shouldRebuildNativeModules(electron)
    .then((shouldBuild) => {
      if (!shouldBuild) {
        return true;
      }

      return rebuild.installNodeHeaders(electronVersion)
        .then(() => rebuild.rebuildNativeModules(electronVersion, pathToElectronNativeModules));
    })
    .then(() => console.warn('Rebuilding complete'))
    .catch((err) => {
      console.error('Rebuilding error!');
      console.error(err);
    });
};

const rebuildForWindows = () => {
  const mods = ['ffi', 'ref'];
  let mod = null;
  for (mod of mods) {
    console.warn('Rebuilding ', mod);
    childProcess.execSync(`node-gyp rebuild --target=${electronVersion} --arch=${os.arch()} --dist-url=https://atom.io/download/atom-shell`, { cwd: `node_modules/${mod}` });
  }
  console.warn('Rebuilding complete.');
};

const run = () => {
  console.warn('Rebuilding native modules');

  if (os.platform() === 'win32') {
    return rebuildForWindows();
  }
  return rebuildNativeModules();
};

run();
