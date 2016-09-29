/* eslint strict: 0, no-shadow: 0, no-unused-vars: 0, no-console: 0 */
'use strict';

require('babel-polyfill');
const os = require('os');
const webpack = require('webpack');
const electronCfg = require('./webpack.config.electron');
const cfg = require('./webpack.config.production');
const packager = require('electron-packager');
const del = require('del');
const exec = require('child_process').exec;
const argv = require('minimist')(process.argv.slice(2));
const pkg = require('./package.json');

const util = require('util');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const deps = Object.keys(pkg.dependencies);
const devDeps = Object.keys(pkg.devDependencies);

const shouldBuildAll = argv.all || false;
const appCopyright = pkg.copyright;

const osPackageConfig = {
  darwin: {
    binaryName: pkg.productName,
    icon: 'resources/osx/icon',
    unpack: '*.dylib',
    preferences: {
      'app-bundle-id': pkg.identifier,
      'app-category-type': 'public.app-category.utilities',
      'helper-bundle-id': `${pkg.identifier}helper`
    }
  },
  linux: {
    binaryName: pkg.name,
    icon: 'resources/icon',
    unpack: '*.so',
    preferences: {}
  },
  win32: {
    binaryName: pkg.productName,
    icon: 'resources/windows/icon',
    unpack: '*.dll',
    preferences: {
      'version-string': {
        CompanyName: pkg.author.name,
        FileDescription: pkg.description,
        ProductName: pkg.productName
      },
      win32metadata: {
        CompanyName: pkg.author.name,
        FileDescription: pkg.description,
        ProductName: pkg.productName
      }
    }
  }
};

const osConfig = osPackageConfig[os.platform()];
const DEFAULT_OPTS = {
  dir: './',
  name: osConfig.binaryName,
  asar: {
    unpack: osConfig.unpack
  },
  'app-copyright': appCopyright,
  ignore: [
    '^/app',
    '^/test($|/)',
    '^/release($|/)',
    '^/resources($|/)',
    '^/main.development.js',
    '^/build.development.js'
  ]
  .concat(devDeps.map(name => `/node_modules/${name}($|/)`))
};

const icon = argv.icon || argv.i || osConfig.icon;

if (icon) {
  DEFAULT_OPTS.icon = icon;
}

const version = argv.version || argv.v;

if (version) {
  DEFAULT_OPTS.version = version;
  startPack();
} else {
  // use the same version as the currently-installed electron-prebuilt
  exec('npm list electron --dev', (err, stdout) => {
    if (err) {
      DEFAULT_OPTS.version = '1.2.0';
    } else {
      DEFAULT_OPTS.version = stdout.split('electron@')[1].replace(/\s/g, '');
    }

    startPack();
  });
}

function build(cfg) {
  return new Promise((resolve, reject) => {
    webpack(cfg, (err, stats) => {
      if (err) return reject(err);
      resolve(stats);
    });
  });
}

function startPack() {
  console.log('start pack...');
  del('dist')
    .then(() => build(electronCfg))
    .then(() => build(cfg))
    .then(() => del('release'))
    .then(paths => {
      if (shouldBuildAll) {
        // build for all platforms
        const archs = ['ia32', 'x64'];
        const platforms = ['linux', 'win32', 'darwin'];

        platforms.forEach(plat => {
          archs.forEach(arch => {
            pack(plat, arch, log(plat, arch));
          });
        });
      } else {
        // build for current platform only
        pack(os.platform(), os.arch(), log(os.platform(), os.arch()));
      }
    })
    .catch(err => {
      console.error(err);
    });
}

function pack(plat, arch, cb) {
  // there is no darwin ia32 electron
  if (plat === 'darwin' && arch === 'ia32') return;

  const iconObj = {
    icon: DEFAULT_OPTS.icon + (() => {
      let extension = '.png';
      if (plat === 'darwin') {
        extension = '.icns';
      } else if (plat === 'win32') {
        extension = '.ico';
      }
      return extension;
    })()
  };
  const opts = Object.assign({}, DEFAULT_OPTS, iconObj, {
    platform: plat,
    arch,
    prune: true,
    'app-version': pkg.version || DEFAULT_OPTS.version,
    out: 'release/'
  }, osConfig.preferences);
  packager(opts, (err) => {
    if (err) {
      return cb(err);
    }

    const folderName = opts.name.toLowerCase().replace(/ /g, '-');
    let platformName = 'linux';
    if (plat === 'win32') {
      platformName = 'win';
    } else if (plat === 'darwin') {
      platformName = 'osx';
    }
    const packageFolderName = util.format('%s-%s-%s', opts.name, plat, arch);
    const packageNameWithVersion = util.format('%s-v%s-%s-%s', folderName,
      pkg.version, platformName, arch);

    const packagePath = path.resolve('.', opts.out, packageFolderName);
    const versionFileName = 'version';
    const filesToRemove = ['LICENSE', 'LICENSES.chromium.html'];

    const versionFilePath = path.resolve(packagePath, versionFileName);

    filesToRemove.forEach((fileName) => {
      const filePath = path.resolve(packagePath, fileName);
      try {
        fse.removeSync(filePath);
      } catch (e) {
        if (e.code === 'ENOENT') {
          console.warn('%s file not present to be deleted', filePath);
        } else {
          throw e;
        }
      }
    });
    fse.writeFileSync(versionFilePath, pkg.version);
    fs.renameSync(path.resolve(opts.out, packageFolderName),
        path.resolve(opts.out, packageNameWithVersion));
    cb();
  });
}

function log(plat, arch) {
  return (err, filepath) => {
    if (err) return console.error(err);
    console.log(`${plat}-${arch} finished!`);
  };
}
