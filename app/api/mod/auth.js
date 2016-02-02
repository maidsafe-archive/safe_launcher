export default class Auth {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'auth';
  }

  register(pin, keyword, password, callback) {
    this.send({
      module: this.MODULE,
      action: 'register',
      params: {
        keyword: keyword,
        pin: pin,
        password: password
      }
    }, callback);
  }

  login(pin, keyword, password, callback) {
    this.send({
      module: this.MODULE,
      action: 'login',
      params: {
        keyword: keyword,
        pin: pin,
        password: password
      }
    }, callback);
  }

}
