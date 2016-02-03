export default class SessionManager {
  constructor() {
    this.sessionPool = {};
  }

  put(sessionId, sessionInfo) {
    if (this.sessionPool[sessionId]) {
      return;
    }
    this.sessionPool[sessionId] = sessionInfo;    
  }

  get(id) {
    return this.sessionPool[id];
  }

  remove(id) {
    delete this.sessionPool[id];
  }

}

export var sessionManager = new SessionManager();
