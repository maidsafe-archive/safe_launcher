'use strict';

var api = require('../testApp/api/safe.js');
var RESTServer = require('../testApp/server/boot.js').default;
let server = null;

exports.start = function(port, callback) {
  server = new RESTServer(api, port, callback);
  server.start();
};

exports.stop = function() {
  server.stop();
};

exports.registerAuthApproval = function(allow) {
  server.addEventListener(server.EVENT_TYPE.AUTH_REQUEST, function(payload) {
    if (allow) {
      return server.authApproved(payload);
    }
    return server.authRejected(payload);
  });
};

exports.removeAllEventListener = function() {
  server.removeAllEventListener(server.EVENT_TYPE.AUTH_REQUEST);
};

exports.login = function(pin, keyword, password, callback) {
  api.auth.login(String(pin), keyword, password, callback)
};

exports.register = function(pin, keyword, password, callback) {
  api.auth.register(String(pin), keyword, password, callback);
};
