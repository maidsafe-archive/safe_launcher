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
  constructor(api, remote, restServer, proxy) {
    this.api = api;
    this.remote = remote;
    this.restServer = restServer;
    this.proxy = proxy;
    this.proxyListener = new ProxyListener();
    this.onNetworkStateChange = null;
  }

  // login
  login(pin, keyword, password, callback) {
    this.api.auth.login(String(pin), keyword, password, callback);
  }

  // register
  register(pin, keyword, password, callback) {
    var self = this;
    this.api.auth.register(String(pin), keyword, password, function(err) {
      if (err) {
        return callback(err);
      }
      callback(err);
    });
  }

  dropUnregisteredClient(callback) {    
    this.api.auth.dropUnregisteredClient(callback);
  }

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

  // focus window
  focusWindow() {
    var browserWindow = this.remote.getCurrentWindow();
    this.remote.getCurrentWindow().setAlwaysOnTop(true);
    this.remote.getCurrentWindow().focus();
    this.remote.getCurrentWindow().setAlwaysOnTop(false);
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

  reconnect() {
    this.api.restart();
  }
}
