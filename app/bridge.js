import { remote } from 'electron';

import env from './env';
import UIUtils from './ui_utils';
import * as api from './api/safe';
import { proxyController } from './server/proxy_controller';
import RESTServer from './server/boot';

window.NETWORK_STATE = {
  CONNECTING: 0,
  CONNECTED: 1,
  DISCONNECTED: 2,
  RETRY: 3
};

let restServer = new RESTServer(api, env.serverPort);

let onFfiProcessTerminated = (title, msg) => {
  remote.dialog.showMessageBox({
    type: 'error',
    buttons: [ 'Ok' ],
    title: title,
    message: msg
  }, function() {
    window.msl.closeWindow();
  });
};

window.msl = new UIUtils(api, remote, restServer, proxyController);

api.setNetworkStateListener((state, isRegisteredClient) => {
  switch (state) {
    case -1:
      onFfiProcessTerminated('FFI process terminated',
        'FFI process terminated and the application will not work as expected.' +
        'Try starting the application again.');
      break;

    case 0:
      if (isRegisteredClient) {
        // log.debug('Dropping unregistered client');
        window.msl.dropUnregisteredClient(function() {});
      }
      window.msl.networkStateChange(NETWORK_STATE.CONNECTED);
      break;

    case 1:
      window.msl.networkStateChange(NETWORK_STATE.DISCONNECTED);
      break;

    case 2:
      window.msl.networkStateChange(NETWORK_STATE.DISCONNECTED);
      break;

    default:
      onFfiProcessTerminated('FFI process terminated', 'FFI library could not be loaded. Error code :: ' +  state);
      break;
  }
});
