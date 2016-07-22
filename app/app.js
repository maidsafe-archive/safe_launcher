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
import { log } from './logger/log';

log.debug('Application starting');

let restServer = new RESTServer(api, env.serverPort);
let proxyServer = {
  process: null,
  start: function(proxyListener) {
    if (this.process) {
      log.warn('Trying to start proxy server which is already running');
      return;
    }
    log.info('Starting proxy server');
    this.process = childProcess.fork(path.resolve(__dirname, 'server/web_proxy.js'), [
      '--proxyPort',
      env.proxyPort,
      '--serverPort',
      env.serverPort
    ]);
    this.process.on('exit', function() {
      log.info('Proxy server stopped');
      proxyListener.onExit('Proxy server closed');
    });
    this.process.on('message', function(event) {
      log.debug('Proxy Server - onMessage event - received - ' + event);
      event = JSON.parse(event);
      switch (event.type) {
        case 'connection':
          if (event.msg.status) {
            log.info('Proxy server started');
            return proxyListener.onStart(event.msg.data);
          }
          proxyListener.onError(event.msg.data);
          break;
        case 'log':
          log.error(event.msg.log);
          break;
        default:
          log.warn('Invalid event type from proxy');
      }
    });
  },
  stop: function() {
    if (!this.process) {
      return;
    }
    log.info('Stopping proxy server');
    this.process.kill();
    this.process = null;
  }
};

window.onbeforeunload = function(e) {
  proxyServer.stop();
  api.close();
  e.returnValue = true;
};

window.NETWORK_STATE = {
  CONNECTING: 0,
  CONNECTED: 1,
  DISCONNECTED: 2,
  RETRY: 3
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

api.setNetworkStateListener(function(state, isRegisteredClient) {
  log.debug('Network state change event received :: ' + state + ' :: ' + isRegisteredClient);
  switch (state) {
    case -1:
      log.info('Network state change event :: FFI ERROR');
      onFfiProcessTerminated('FFI process terminated',
        'FFI process terminated and the application will not work as expected.' +
        'Try starting the application again.');
      break;

    case 0:
      log.info('Connected with network');
      if (isRegisteredClient) {
        log.debug('Dropping unregistered client');
        window.msl.dropUnregisteredClient(function() {});
      }
      window.msl.networkStateChange(NETWORK_STATE.CONNECTED);
      break;

    case 1:
      log.info('Network connection lost');
      window.msl.networkStateChange(NETWORK_STATE.DISCONNECTED);
      break;

    case 2:
      log.info('Network connection lost');
      window.msl.networkStateChange(NETWORK_STATE.DISCONNECTED);
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
