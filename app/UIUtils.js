class AppLifeCycleHandler {
  constructor(api) {
    this.api = api;
  }
  close() {
    this.api.close();
  }
};


// UI Utils
export default class UIUtils {
  constructor(api, remote) {
    this.api = api;
    this.remote = remote;
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

  closeWindow() {
    this.remote.getCurrentWindow().close();
  }
}
