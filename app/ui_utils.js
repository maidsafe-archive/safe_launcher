class AppLifeCycleHandler {
  constructor(api) {
    this.api = api;
  }
  close() {
    this.api.close();
  }
}

// UI Utils
export default class UIUtils {
  constructor(api, remote, restServer) {
    this.api = api;
    this.remote = remote;
    this.restServer = restServer;
    this.lifeCycleHandler = new AppLifeCycleHandler(api);
    this.remote.getCurrentWindow().on('close', this.lifeCycleHandler.close);
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

  // restore window if minimized
  restoreWindow() {
    var browserWindow = this.remote.getCurrentWindow();
    if (!browserWindow.isMinimized()) {
      return;
    }
    this.remote.getCurrentWindow().restore();
  }
}
