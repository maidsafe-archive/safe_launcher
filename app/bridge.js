import { remote } from 'electron';

import env from './env';
import UIUtils from './ui_utils';
import { loadLibrary } from './ffi/loader';
import sessionManager from './ffi/util/session_manager';
import auth from './ffi/api/auth';
import RESTServer from './server/boot';

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

const networkStateListener = (state) => {
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

const load = async (eventRegistry) => {
  try {
    window.msl = new UIUtils(remote, restServer);
    await loadLibrary();
    eventRegistry.run();
    sessionManager.onNetworkStateChange(networkStateListener);
    auth.getUnregisteredSession().then(() => {}, () => {
      networkStateListener(1);
    });
  } catch (e) {
    onFfiLaodFailure('FFI library load error', e.message);
  }
};

// Disabling drag and drop
window.document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

window.document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

export default load;