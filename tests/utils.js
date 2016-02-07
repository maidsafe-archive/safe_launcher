// generate random string
var genRandomString = function(len) {
  var text = " ";
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < len; i++ ) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
};

// register
var register = function(api, pin, keyword, password, callback) {
  api.auth.register(String(pin), keyword, password, callback);
};

var authorize = function(request, callback) {
  var payload = {
    "app": {
      "name": "Mozilla",
      "version": "0.0.1",
      "id": "com.sample",
      "vendor": "DEMO"
    },
    "permissions": [],
    "publicKey": "y4PQimgUkoaGdDTWmhgqxvXDZVluRlwCvUdgRibKUCA=",
    "nonce": "lVhti2zazoTTVgmOGkXq0wjnn+9fbjfW"
  };
  var req = {
    headers: {'content-type' : 'application/json'},
    url: 'http://localhost:3000/auth',
    body: JSON.stringify(payload)
  };
  request.post(req, callback);
};

// login
var login = function(api, pin, keyword, password, callback) {
  api.auth.login(String(pin), keyword, password, callback);
};

var electronRemote = {
  getCurrentWindow: function() {
    return this;
  },
  on: function(type, callback) {
    return;
  }
}
exports.register = register;
exports.login = login;
exports.genRandomString = genRandomString;
exports.electronRemote = electronRemote;
exports.authorize = authorize;
