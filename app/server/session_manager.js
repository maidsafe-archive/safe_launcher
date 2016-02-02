export default class SessionManager {
  constructor() {
    this.sessionPool = {};
  }

  put(appName, appKey, vendor, permisssions) {
    var id = 100;
    var session = {
      keys: {
        signingKey: '',
        encryptionKey: '',
      },
      appDirKey: '',
      permisssions: []
    };
    this.sessionPool[id] = session;
    return {
      id: id,
      app: session.app,
      permisssions: session.permisssions
    };
  }

  get(id) {
    return this.sessionPool[id];
  }

  remove(id) {
    delete this.sessionPool[id];
  }

}

export var sessionManager = new SessionManager();
