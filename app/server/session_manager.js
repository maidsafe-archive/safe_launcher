var sessionManager = null;
class SessionManager {
  constructor() {
    this.sessionPool = {};
  }

  clear() {
    this.sessionPool = {};
  }

  put(sessionId, sessionInfo) {
    if (this.sessionPool[sessionId]) {
      return false;
    }
    this.sessionPool[sessionId] = sessionInfo;
    return true;
  }

  get(id) {
    return this.sessionPool[id];
  }

  remove(id) {
    delete this.sessionPool[id];
    return !this.sessionPool.hasOwnProperty(id);
  }

  hasSessionForApp(appData) {
    let app;
    for (var key in this.sessionPool) {
      app = this.sessionPool[key];
      if (app.appId === appData.id && app.appName === appData.name &&
      app.appVersion === appData.version && app.vendor === appData.vendor &&
      app.permissions.isEqual(appData.permissions)) {
        return key;
      }
    }
    return null;
  }
}

export default sessionManager = new SessionManager();
