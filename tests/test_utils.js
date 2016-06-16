var request = require('request');
var sodium = require('../app/node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js');

var server = require('./server_utils');
var config = require('../config/env_development.json');

var SERVER_URL = 'http://localhost:' + config.serverPort;
var authToken = null;
var keys = {
  pub: null,
  pvt: null,
  nonce: null,
  symKey: null,
  symNonce: null
};
var registeredKeys = {
  pin: 1111,
  keyword: '1111aa',
  password: '1111aa'
};

var encryptPayload = function(payload, isPlainText) {
  if (!isPlainText) {
    payload = new Uint8Array(new Buffer(JSON.stringify(payload)));
  }
  return new Buffer(sodium.crypto_secretbox_easy(payload, keys.symNonce, keys.symKey)).toString('base64');
};

var generateKeys = function() {
  var generatedKeys = sodium.crypto_box_keypair();
  keys.nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  keys.pub = generatedKeys.publicKey;
  keys.pvt = generatedKeys.privateKey;
};

var setToken = function(token) {
  authToken = 'bearer ' + token;
};


var getToken = function() {
  return authToken;
}

var setRegisteredKeys = function(keys) {
  registeredKeys = keys;
};

var generateAuthKeys = function() {
  var pin_len = 4;
  var keyword_len = 6;
  var password_len = 6;
  var loginKeys = {
    pin: null,
    keyword: null,
    password: null
  };
  loginKeys.pin = Math.floor(Math.random() * 10000).toString();
  loginKeys.keyword = Math.floor(Math.random() * 1000000).toString();
  loginKeys.password = Math.floor(Math.random() * 1000000).toString();
  while (loginKeys.pin.length < pin_len) {
    loginKeys.pin += '0';
  }
  while (loginKeys.keyword.length < keyword_len) {
    loginKeys.keyword += '0';
  }
  while (loginKeys.password.length < password_len) {
    loginKeys.password += '0';
  }
  return loginKeys;
};

var login = function(registered, callback) {
  var loginKeys = registered ? registeredKeys : generateAuthKeys();
  server.login(loginKeys.pin, loginKeys.keyword, loginKeys.password, function(err) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback();
  });
};

var register = function(callback) {
  var regKeys = generateAuthKeys();
  server.register(regKeys.pin, regKeys.keyword, regKeys.password, function(err) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback(regKeys);
  });
};

var startLauncher = function(callback) {
  server.start(config.serverPort, function(err) {
    if (err) {
      console.error('server Error :: ' + err)
      return process.exit(0);
    }
    callback();
  });
};

var killLauncher = function() {
  server.stop();
};

var authoriseApp = function(callback) {
  generateKeys();
  var nonce = new Buffer(keys.nonce).toString('base64');
  var pubKey = new Buffer(keys.pub).toString('base64');

  request({
    method: 'POST',
    uri: SERVER_URL + '/auth',
    headers: {
      'content-type': 'application/json'
    },
    json: {
      app: {
        name: 'Test tool',
        id: 'maidsafe.net.test',
        version: '0.0.1',
        vendor: 'MaidSafe'
      },
      permissions: [],
      publicKey: pubKey,
      nonce: nonce
    }
  }, function(err, res, body) {
    if (err) {
      throw err;
    }
    if (res.statusCode !== 200) {
      return callback(res.statusCode);
    }
    var authRes = body;
    var cipher = new Uint8Array(new Buffer(authRes.encryptedKey, 'base64'));
    var publicKey = new Uint8Array(new Buffer(authRes.publicKey, 'base64'));
    var plainText = sodium.crypto_box_open_easy(cipher, keys.nonce, publicKey, keys.pvt);
    keys.symKey = plainText.slice(0, sodium.crypto_secretbox_KEYBYTES);
    keys.symNonce = plainText.slice(sodium.crypto_secretbox_KEYBYTES);
    setToken(authRes.token);
    callback(res.statusCode);
  })
};

var registerAuthApproval = function(allow) {
  server.registerAuthApproval(allow);
};

var removeAllEventListener = function() {
  server.removeAllEventListener();
};

var revokeApp = function(token, callback) {
  request({
    method: 'DELETE',
    uri: SERVER_URL + '/auth',
    headers: {
      'content-type': 'application/json',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      throw err;
    }
    callback(res.statusCode);
  });
};

var createDir = function(token, dirPath, callback) {
  var payload = {
    dirPath: dirPath,
    isPrivate: true,
    userMetadata: '',
    isVersioned: false,
    isPathShared: false
  };
  payload = encryptPayload(payload);
  // payload = new Uint8Array(new Buffer(JSON.stringify(payload)));
  // payload = new Buffer(sodium.crypto_secretbox_easy(payload, keys.symNonce, keys.symKey)).toString('base64');
  request({
    method: 'POST',
    uri: SERVER_URL + '/nfs/directory',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var deleteDir = function(token, dirPath, callback) {
  request({
    method: 'DELETE',
    uri: SERVER_URL + '/nfs/directory/' + dirPath + '/false',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var getDir = function(token, dirPath, callback) {
  request({
    method: 'GET',
    uri: SERVER_URL + '/nfs/directory/' + dirPath + '/false',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var updateDir = function(token, dirPath, newName, callback) {
  var payload = {
    name: newName
  };
  payload = encryptPayload(payload);
  // payload = new Uint8Array(new Buffer(JSON.stringify(payload)));
  // payload = new Buffer(sodium.crypto_secretbox_easy(payload, keys.symNonce, keys.symKey)).toString('base64');

  request({
    method: 'PUT',
    uri: SERVER_URL + '/nfs/directory/' + dirPath + '/false',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var createFile = function(token, filePath, callback) {
  var payload = {
    filePath: filePath,
    metadata: '',
    isPathShared: false,
    localFilePath: ''
  };
  payload = encryptPayload(payload);
  // payload = new Uint8Array(new Buffer(JSON.stringify(payload)));
  // payload = new Buffer(sodium.crypto_secretbox_easy(payload, keys.symNonce, keys.symKey)).toString('base64');
  request({
    method: 'POST',
    uri: SERVER_URL + '/nfs/file',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var deleteFile = function(token, filePath, callback) {
  request({
    method: 'DELETE',
    uri: SERVER_URL + '/nfs/file/' + encodeURIComponent(filePath) + '/false',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var getFile = function(token, filePath, callback) {
  request({
    method: 'GET',
    uri: SERVER_URL + '/nfs/file/' + encodeURIComponent(filePath) + '/false',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  })
};

var updateFileMeta = function(token, newFileName, filePath, callback) {
  var payload = {
    name: newFileName
  };
  payload = encryptPayload(payload);

  request({
    method: 'PUT',
    uri: SERVER_URL + '/nfs/file/metadata/' + encodeURIComponent(filePath) + '/false',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var updateFileContent = function(token, fileContent, filePath, callback) {
  var payload = encryptPayload(fileContent, true);
  var query = encryptPayload('offset=' + 0, true);
  request({
    method: 'PUT',
    uri: SERVER_URL + '/nfs/file/' + encodeURIComponent(filePath) + '/false?' + query,
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var moveFile = function(token, srcPath, destPath, callback) {
  var payload = {
    srcPath: srcPath,
    isSrcPathShared: false,
    destPath: destPath,
    isDestPathShared: false,
    retainSource: false
  };
  payload = encryptPayload(payload);
  request({
    method: 'POST',
    uri: SERVER_URL + '/nfs/movefile',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var moveDir = function(token, srcPath, destPath, callback) {
  var payload = {
    srcPath: srcPath,
    isSrcPathShared: false,
    destPath: destPath,
    isDestPathShared: false,
    retainSource: false
  };
  payload = encryptPayload(payload);
  request({
    method: 'POST',
    uri: SERVER_URL + '/nfs/movedir',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

// DNS
var registerDns = function(token, longName, serviceName, dirPath, callback) {
  var payload = {
    longName: longName,
    serviceName: serviceName,
    serviceHomeDirPath: dirPath,
    isPathShared: false
  };
  payload = encryptPayload(payload);
  request({
    method: 'POST',
    uri: SERVER_URL + '/dns',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var deleteDns = function(token, longName, callback) {
  request({
    method: 'DELETE',
    uri: SERVER_URL + '/dns/' + encodeURIComponent(longName),
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var createPublicId = function(token, longName, callback) {
  request({
    method: 'POST',
    uri: SERVER_URL + '/dns/' + encodeURIComponent(longName),
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var addService = function(token, longName, serviceName, dirPath, callback) {
  var payload = {
    longName: longName,
    serviceName: serviceName,
    serviceHomeDirPath: dirPath,
    isPathShared: false
  };
  payload = encryptPayload(payload);
  request({
    method: 'PUT',
    uri: SERVER_URL + '/dns',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    },
    body: payload
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var deleteService = function(token, longName, serviceName, callback) {
  request({
    method: 'DELETE',
    uri: SERVER_URL + '/dns/' + encodeURIComponent(serviceName) + '/' + encodeURIComponent(longName),
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var getHomeDir = function(token, longName, serviceName, callback) {
  request({
    method: 'GET',
    uri: SERVER_URL + '/dns/' + encodeURIComponent(serviceName) + '/' + encodeURIComponent(longName),
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var getFilePath = function(token, longName, serviceName, filePath, callback) {
  var url = SERVER_URL + '/dns/' + encodeURIComponent(serviceName) + '/' + encodeURIComponent(longName) + '/' + encodeURIComponent(filePath);
  request({
    method: 'GET',
    uri: url,
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var getLongNames = function(token, callback) {
  request({
    method: 'GET',
    uri: SERVER_URL + '/dns',
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var getServices = function(token, longName, callback) {
  request({
    method: 'GET',
    uri: SERVER_URL + '/dns/' + encodeURIComponent(longName),
    headers: {
      'content-type': 'text/plain',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

module.exports = {
  login: login,
  register: register,
  startLauncher: startLauncher,
  killLauncher: killLauncher,
  authoriseApp: authoriseApp,
  registerAuthApproval: registerAuthApproval,
  removeAllEventListener: removeAllEventListener,
  setRegisteredKeys: setRegisteredKeys,
  getToken: getToken,
  revokeApp: revokeApp,
  createDir: createDir,
  deleteDir: deleteDir,
  getDir: getDir,
  updateDir: updateDir,
  createFile: createFile,
  deleteFile: deleteFile,
  getFile: getFile,
  updateFileMeta: updateFileMeta,
  updateFileContent: updateFileContent,
  moveFile: moveFile,
  moveDir: moveDir,
  registerDns: registerDns,
  deleteDns: deleteDns,
  createPublicId: createPublicId,
  addService: addService,
  deleteService: deleteService,
  getHomeDir: getHomeDir,
  getFilePath: getFilePath,
  getLongNames: getLongNames,
  getServices: getServices,
};
