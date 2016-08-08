// import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
// import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
import UIUtils from './ui_utils';
import * as api from './api/safe';
import RESTServer from './server/boot';
import { proxyController } from './server/proxy_controller';
import childProcess from 'child_process';
import { formatResponse } from './server/utils';
import { log } from './logger/log';

log.debug('Application starting');

let restServer = new RESTServer(api, env.serverPort);

window.NETWORK_STATE = {
  CONNECTING: 0,
  CONNECTED: 1,
  DISCONNECTED: 2,
  RETRY: 3
};

window.msl = new UIUtils(api, remote, restServer, proxyController);

var onFfiProcessTerminated = function(title, msg) {
  remote.dialog.showMessageBox({
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
      onFfiProcessTerminated('FFI process terminated', 'FFI library could not be loaded. Error code :: ' +  state);
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
