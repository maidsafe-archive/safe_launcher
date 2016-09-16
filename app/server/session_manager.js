import Permission from '../ffi/model/permission';
import appManager from '../ffi/util/app_manager';
import _ from 'lodash';

let sessionManager = null;

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

  remove = async (id) => {
    try {
      await appManager.revokeApp(this.sessionPool[id].app);
      delete this.sessionPool[id];
      return !this.sessionPool.hasOwnProperty(id);
    } catch(e) {
      console.error(e);
    }
  }

  hasSessionForApp(appData) {
    let app;
    for (var key in this.sessionPool) {
      app = this.sessionPool[key].app;
      if (_.isEqual(app, appData)) {
        return key;
      }
    }
    return null;
  }

  registerApps = () => {
    return new Promise(async (resolve, reject) => {
      try {
        for (let key in this.sessionPool) {
          app = this.sessionPool[key].app;
          await appManager.registerApp(app)
        }
        resolve();
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }
}

export default sessionManager = new SessionManager();
