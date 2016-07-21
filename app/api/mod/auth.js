import { log } from './../../logger/log';

export default class Auth {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'auth';
  }

  register(location, password, callback) {
    log.debug('Invoking Auth::register API');
    this.send({
      module: this.MODULE,
      action: 'register',
      params: {
        location: location,
        password: password
      }
    }, callback);
  }

  login(location, password, callback) {
    log.debug('Invoking Auth::login API');
    this.send({
      module: this.MODULE,
      action: 'login',
      params: {
        location: location,
        password: password
      }
    }, callback);
  }

  getAppDirectoryKey(appId, appName, vendor, callback) {
    log.debug('Invoking Auth::getAppDirectoryKey API');
    this.send({
      module: this.MODULE,
      action: 'app-dir-key',
      params: {
        appId: appId,
        appName: appName,
        vendor: vendor
      }
    }, callback);
  }

  dropUnregisteredClient(callback) {
    log.debug('Invoking Auth::dropUnregisteredClient API');
    this.send({
      module: this.MODULE,
      action: 'drop-unregistered-client',
      params: {}
    }, callback);
  }
}
