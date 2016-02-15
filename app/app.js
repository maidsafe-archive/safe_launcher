// Use new ES6 modules syntax for everything.
// import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
// import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
import path from 'path';
import UIUtils from './ui_utils';
import * as api from './api/safe';
import RESTServer from './server/boot';
import childProcess from 'child_process';
import {formatResponse} from './server/utils';
import { ipcRenderer as ipc } from 'electron';

let restServer = new RESTServer(api, env.serverPort);
let proxyServer = {
  process: null,
  start: function(callback) {
    if (this.process) {
      return;
    }
    this.process = childProcess.fork(path.resolve(__dirname, 'server/web_proxy.js'), [
      '--proxyPort',
      env.proxyPort,
      '--serverPort',
      env.serverPort
    ]);
    this.process.on('message', function(msg) {
      callback(msg);
    });
  },
  stop: function() {
    if (!this.process) {
      return;
    }
    this.process.kill();
    this.process = null;
  }
};

window.onbeforeunload = function(e) {
  proxyServer.stop();
  api.close();
  e.returnValue = true;
};

window.msl = new UIUtils(api, remote, restServer, proxyServer);

ipc.on('ffi-closed', window.msl.closeWindow);
