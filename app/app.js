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
import { formatResponse } from './server/utils';

let restServer = new RESTServer(api, env.serverPort);
let proxyServer = {
  process: null,
  start: function(proxyListener) {
    if (this.process) {
      return;
    }
    this.process = childProcess.fork(path.resolve(__dirname, 'server/web_proxy.js'), [
      '--proxyPort',
      env.proxyPort,
      '--serverPort',
      env.serverPort
    ]);
    this.process.on('exit', function() {
      proxyListener.onExit('Porxy Server Closed');
    });
    this.process.on('message', function(msg) {
      msg = JSON.parse(msg);
      if (msg.status) {
        return proxyListener.onStart(msg.data);
      }
      proxyListener.onError(msg.data);
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

var NETWORK_STATE = {
  CONNECTED: 0,
  CONNECTING: 1,
  DISCONNECTED: 2
};

window.msl = new UIUtils(api, remote, restServer, proxyServer);

var onFfiProcessTerminated = function(title, msg) {
  require('remote').dialog.showMessageBox({
    type: 'error',
    buttons: [ 'Ok' ],
    title: title,
    message: msg
  }, function() {
    window.msl.closeWindow();
  });
};

var onConnectionLost = function() {
  require('remote').dialog.showMessageBox({
    type: 'error',
    buttons: [ 'Ok' ],
    title: 'Connection Drop',
    message: 'Connection lost with the Network. Log in again to continue'
  }, function() {
    api.auth.dropClients();
    window.location.hash = 'login';
    window.msl.networkStateChange(NETWORK_STATE.CONNECTING);
    api.restart();
  });
};

api.setNetworkStateListener(function(state) {
  switch (state) {
    case -1:
      onFfiProcessTerminated('FFI process terminated',
        'FFI process terminated and the application will not work as expected.' +
        'Try starting the application again.');
      break;

    case 0:
      console.log('connected');
      window.msl.networkStateChange(NETWORK_STATE.CONNECTED);
      break;

    case 1:
      window.msl.networkStateChange(NETWORK_STATE.DISCONNECTED);
      onConnectionLost();
      break;

    case 2:
      window.msl.networkStateChange(NETWORK_STATE.DISCONNECTED);
      onConnectionLost();
      break;

    default:
      onFfiProcessTerminated('FFI process terminated', 'FFI library could not be loaded.');
      break;
  }
});

// Disabling drag and drop
window.document.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
});

window.document.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
});
