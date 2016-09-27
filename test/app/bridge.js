import { remote, ipcRenderer } from 'electron';
import path from 'path';
import env from '../../app/env';
import UIUtils from '../../app/ui_utils';
import { loadLibrary } from '../../app/ffi/loader';
import sessionManager from '../../app/ffi/util/session_manager';
import auth from '../../app/ffi/api/auth';
import { proxyController } from '../../app/server/proxy_controller';
import RESTServer from '../../app/server/boot';

window.NETWORK_STATE = {
  CONNECTING: 0,
  CONNECTED: 1,
  DISCONNECTED: 2,
  RETRY: 3
};

const restServer = new RESTServer(env.serverPort);

const onFfiLaodFailure = (title, msg) => {
  remote.dialog.showMessageBox({
    type: 'error',
    buttons: ['Ok'],
    title,
    message: msg
  }, () => {
    window.msl.closeWindow();
  });
};

window.msl = new UIUtils(remote, restServer, proxyController);

const networkStateListener = (state) => {
  ipcRenderer.send('networkStatus', state);
  switch (state) {
    case 0:
      window.msl.networkStateChange(window.NETWORK_STATE.CONNECTED);
      break;

    case 1:
      window.msl.networkStateChange(window.NETWORK_STATE.DISCONNECTED);
      break;

    case 2:
      window.msl.networkStateChange(window.NETWORK_STATE.DISCONNECTED);
      break;
    default:
      break;
  }
};

try {
  loadLibrary(path.resolve('app', 'ffi'));
  sessionManager.onNetworkStateChange(networkStateListener);
  auth.getUnregisteredSession().then(() => {}, () => {
    networkStateListener(1);
  });
} catch (e) {
  onFfiLaodFailure('FFI library load error', e.message);
}

// Disabling drag and drop
window.document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

window.document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
