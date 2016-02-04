var sessionManager = null;
class SessionManager {
  constructor() {
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
    return !this.sessionPool.containsKey(id);
  }

}

export default sessionManager = new SessionManager();
