export default class Auth {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'auth';
  }

  register(keyword, pin, password, callback) {
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

  login(keyword, pin, password, callback) {
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
