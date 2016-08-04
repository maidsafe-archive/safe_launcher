'use strict';

var api = require('../testApp/api/safe.js');
var RESTServer = require('../testApp/server/boot.js').default;
let server = null;

exports.start = function(port, callback) {
  server = new RESTServer(api, port, callback);
  server.start();
};

exports.stop = function() {
  server.clearAllSessions();
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

exports.login = function(secret, password, callback) {
  api.auth.login(secret, password, callback)
};

exports.register = function(secret, password, callback) {
  api.auth.register(secret, password, callback);
};
