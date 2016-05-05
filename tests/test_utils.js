var request = require('request');
var sodium = require('../app/node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js');

var server = require('./server_utils');
var config = require('../config/env_development.json');

var SERVER_URL = 'http://localhost:' + config.serverPort;
var token = null;
var keys = { pub: null, pvt: null, nonce: null, symKey: null, symNonce: null };

var generateKeys = function() {
  var generatedKeys = sodium.crypto_box_keypair();
  keys.nonce = new Buffer(sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)).toString('base64');
  keys.pub = new Buffer(generatedKeys.publicKey).toString('base64');
  keys.pvt = generatedKeys.privateKey;
};

var startLauncher = function(callback) {
  server.start(config.serverPort, function(err) {
    if (err) {
      return throw err;
    }
    callback();
  });
};

var killLauncher = function() {
  server.stop();
};

var authoriseApp = function(callback) {

};

module.exports = {
  startLauncher: startLauncher,
  killLauncher: killLauncher,
  authoriseApp: authoriseApp,
};
