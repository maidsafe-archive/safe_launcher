// Use new ES6 modules syntax for everything.
// import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
// import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
import * as api from './api/safe';
import RESTServer from './server/boot';
import UIUtils from './ui_utils';
import {formatResponse} from './server/utils';
import childProcess from 'child_process';
import path from 'path';

let restServer = new RESTServer(api, env.serverPort);
let proxyServer = {
  process: null,
  start: function() {
    if (this.process) {
      return;
    }
    this.process = childProcess.fork(path.resolve(__dirname, 'server/web_proxy.js'), [
      '--proxyPort',
      env.proxyPort,
      '--serverPort',
      env.serverPort
    ]);
  },
  stop: function() {
    if (!this.process) {
      return;
    }
    this.process.kill();
    this.process = null;
  }
};

window.msl = new UIUtils(api, remote, restServer);
