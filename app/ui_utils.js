import { shell } from 'electron';
import { errorCodeLookup } from './server/error_code_lookup';
import { cleanup } from './ffi/loader';
import auth from './ffi/api/auth';

class ProxyListener {
  constructor() {
    this.errorCb = null;
    this.exitCb = null;
    this.startCb = null;
  }

  registerOnError(callback) {
    this.errorCb = callback;
  }

  registerOnExit(callback) {
    this.exitCb = callback;
  }

  registerOnStart(callback) {
    this.startCb = callback;
  }

  onExit(msg) {
    this.exitCb(msg);
  }

  onError(err) {
    this.errorCb(err);
  }

  onStart(msg) {
    this.startCb(msg);
  }
}

// UI Utils
export default class UIUtils {
  constructor(remote, restServer, proxy) {
    this.remote = remote;
    this.restServer = restServer;
    this.proxy = proxy;
    this.proxyListener = new ProxyListener();
    this.onNetworkStateChange = null;
    this.errorCodeLookup = errorCodeLookup;
  }

  // // login
  // login(location, password, callback) {
  //   this.api.auth.login(location, password, callback);
  // }
  //
  // // register
  // register(location, password, callback) {
  //   this.api.auth.register(location, password, (err) => {
  //     if (err) {
  //       return callback(err);
  //     }
  //     callback(err);
  //   });
  // }
  //
  // dropUnregisteredClient(callback) {
  //   this.api.auth.dropUnregisteredClient(callback);
  // }

  // close browser window
  closeWindow() {
    this.remote.getCurrentWindow().close();
  }

  // minimize browser window
  minimizeWindow() {
    this.remote.getCurrentWindow().minimize();
  }

  // start REST Server
  startServer() {
    this.restServer.start();
  }

  // handle server error
  onServerError(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.ERROR, callback);
  }

  // handle server start
  onServerStarted(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.STARTED, callback);
  }

  // handle server shutdown
  onServerShutdown(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.STOPPED, callback);
  }

  // handle session creation
  onSessionCreated(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.SESSION_CREATED, callback);
  }

  onSessionCreationFailed(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.SESSION_CREATION_FAILED, callback);
  }

  // handle session removed
  onSessionRemoved(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.SESSION_REMOVED, callback);
  }

  // on auth request
  onAuthRequest(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.AUTH_REQUEST, callback);
  }

  // handle auth response
  authResponse(payload, status) {
    return status ? this.restServer.authApproved(payload) : this.restServer.authRejected(payload);
  }

  // remove session
  removeSession(id) {
    this.restServer.removeSession(id);
  }

  clearAllSessions() {
    this.restServer.clearAllSessions();
  }

  // focus window
  focusWindow() {
    const browserWindow = this.remote.getCurrentWindow();
    browserWindow.setAlwaysOnTop(true);
    browserWindow.focus();
    browserWindow.setAlwaysOnTop(false);
  }

  // start proxy server
  startProxyServer() {
    this.proxy.start(this.proxyListener);
  }

  // handle proxy error
  onProxyError(callback) {
    this.proxyListener.registerOnError(callback);
  }

  // handle proxy exit
  onProxyExit(callback) {
    this.proxyListener.registerOnExit(callback);
  }

  // handle proxy start
  onProxyStart(callback) {
    this.proxyListener.registerOnStart(callback);
  }

  // stop proxy server
  stopProxyServer() {
    this.proxy.stop();
  }

  networkStateChange(state) {
    if (!this.onNetworkStateChange) {
      return;
    }
    this.onNetworkStateChange(state);
  }

  setNetworkStateChangeListener(callback) {
    this.onNetworkStateChange = callback;
  }

  reconnect = async (user) => {
    try {
      await cleanup();
       // reconnect Unauthorised client
      if (!user || Object.keys(user).length === 0) {
        await auth.getUnregisteredSession();
        return;
      }
      if (!user.accountSecret || !user.accountPassword) {
        return console.error('User account is not available for retrying');
      }
      // reconnect authorised client
      await auth.login(user.accountSecret, user.accountPassword);
      await this.restServer.registerConnectedApps();
    } catch(e) {
      console.error(e);
      if (!this.onNetworkStateChange) {
        return;
      }
      this.onNetworkStateChange(window.NETWORK_STATE.DISCONNECTED);
    }
  }

  onUploadEvent(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.DATA_UPLOADED, callback);
  }

  onDownloadEvent(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.DATA_DOWNLOADED, callback);
  }

  onNewAppActivity(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.ACTIVITY_NEW, callback);
  }

  onUpdatedAppActivity(callback) {
    this.restServer.addEventListener(this.restServer.EVENT_TYPE.ACTIVITY_UPDATE, callback);
  }

  getAppActivityList(id) {
    return this.restServer.getAppActivityList(id);
  }

  openExternal(url) {
    shell.openExternal(url);
  }
}
