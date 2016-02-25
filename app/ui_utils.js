class ProxyListener {
  constructor(callback) {
    this.callback = callback;
  }

  notify(status) {
    this.callback(status);
  }
}

// UI Utils
export default class UIUtils {
  constructor(api, remote, restServer, proxy) {
    this.api = api;
    this.remote = remote;
    this.restServer = restServer;
    this.proxy = proxy;
  }

  // login
  login(pin, keyword, password, callback) {
    this.api.auth.login(String(pin), keyword, password, callback);
  }

  // register
  register(pin, keyword, password, callback) {
    this.api.auth.register(String(pin), keyword, password, callback);
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

  // restore window if minimized
  restoreWindow() {
    var browserWindow = this.remote.getCurrentWindow();
    if (!browserWindow.isMinimized()) {
      return;
    }
    this.remote.getCurrentWindow().restore();
  }

  // start proxy server
  startProxyServer(callback) {
    this.proxy.start(new ProxyListener(callback));
  }

  // stop proxy server
  stopProxyServer() {
    this.proxy.stop();
  }
}
