let instance = null;
export default class UserData {
  authToken = null;

  constructor() {
    if (!instance) {
      instance = this;
    }
    return instance;
  }

  setAuthToken(token) {
    this.authToken = token;
  }
}
