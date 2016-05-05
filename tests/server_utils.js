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
