var request = require('request');
var server = require('./server_utils');
var config = require('../config/env_development.json');

var SERVER_URL = 'http://localhost:' + config.serverPort;
var authToken = null;
var registeredKeys = {};

var generateRandomStr = function() {
  var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 10; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
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
  var loginKeys = {};
  loginKeys['secret'] = generateRandomStr();
  loginKeys['password'] = generateRandomStr();
  return loginKeys;
};

var login = function(registered, callback) {
  var loginKeys = registered ? registeredKeys : generateAuthKeys();
  server.login(loginKeys.secret, loginKeys.password, function(err) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback();
  });
};

var register = function(callback) {
  var regKeys = generateAuthKeys();
  server.register(regKeys.secret, regKeys.password, function(err) {
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
  request({
    method: 'POST',
    url: SERVER_URL + '/auth',
    headers: {
      'Content-Type': 'application/json'
    },
    json: {
      app: {
        name: 'Test tool',
        id: 'maidsafe.net.test',
        version: '0.0.1',
        vendor: 'MaidSafe'
      },
      permissions: []
    }
  }, function(err, res, body) {
    if (err) {
      throw err;
    }
    if (res.statusCode !== 200) {
      return callback(res.statusCode);
    }
    setToken(body.token);
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
    url: SERVER_URL + '/auth',
    headers: {
      'Content-Type': 'application/json',
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
    isPrivate: true,
    userMetadata: '',
  };
  request({
    method: 'POST',
    url: SERVER_URL + '/nfs/directory/APP/' + dirPath,
    headers: {
      'Content-Type': 'application/json',
      'authorization': token
    },
    body: JSON.stringify(payload)
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
    url: SERVER_URL + '/nfs/directory/APP/' + dirPath,
    headers: {
      'Content-Type': 'text/plain',
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
    url: SERVER_URL + '/nfs/directory/APP/' + dirPath,
    headers: {
      'Content-Type': 'text/plain',
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
  request({
    method: 'PUT',
    url: SERVER_URL + '/nfs/directory/APP/' + dirPath,
    headers: {
      'Content-Type': 'application/json',
      'authorization': token
    },
    body: JSON.stringify(payload)
  }, function(err, res, body) {
    if (err) {
      console.error(err);
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var moveOrCopyDir = function(token, srcPath, destPath, toMove, callback) {
  var action = toMove ? 'MOVE' : 'COPY';
  var payload = {
    srcPath: srcPath,
    srcRootPath: 'APP',
    destPath: destPath,
    destRootPath: 'APP',
    action: action
  };
  request({
    method: 'POST',
    url: SERVER_URL + '/nfs/movedir',
    headers: {
      'Content-Type': 'application/json',
      'authorization': token
    },
    body: JSON.stringify(payload)
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

var createFile = function(token, filePath, callback) {
  var authKey = 'bearer';
  var fs = require('fs');
  var mime = require('mime');
  var localPath = './tests/file_to_create.txt';
  var fileStream = fs.createReadStream(localPath);
  var chunkSend = 0;
  fileStream.on('data', function(chunk) {
    chunkSend += chunk.length;
  });
  var writeStream =  request({
    method: 'POST',
    url: SERVER_URL + '/nfs/file/APP/' + filePath,
    headers: {
      'Content-Length': fs.statSync(localPath).size,
      'Content-Type': mime.lookup(filePath),
      'metadata': '',
      'authorization': token
    }
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
  fileStream.pipe(writeStream);
  return writeStream;
};

var deleteFile = function(token, filePath, callback) {
  request({
    method: 'DELETE',
    url: SERVER_URL + '/nfs/file/APP/' + filePath,
    headers: {
      'Content-Type': 'text/plain',
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
    url: SERVER_URL + '/nfs/file/APP/' + filePath,
    headers: {
      'Content-Type': 'text/plain',
      'authorization': token,
      'range': 'bytes=0-'
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
  request({
    method: 'PUT',
    url: SERVER_URL + '/nfs/file/metadata/APP/' + filePath,
    headers: {
      'Content-Type': 'application/json',
      'authorization': token
    },
    body: JSON.stringify(payload)
  }, function(err, res, body) {
    if (err) {
      return process.exit(0);
    }
    callback(res.statusCode);
  });
};

// TODO: Change api to v0.5
// var updateFileContent = function(token, fileContent, filePath, callback) {
//   var query ='?offset=' + 0;
//   request({
//     method: 'PUT',
//     url: SERVER_URL + '/nfs/file/APP/' + filePath + query,
//     headers: {
//       'Content-Type': 'text/plain',
//       'authorization': token
//     },
//     body: fileContent
//   }, function(err, res, body) {
//     if (err) {
//       return process.exit(0);
//     }
//     console.log(body);
//     callback(res.statusCode);
//   });
// };

var moveOrCopyFile = function(token, srcPath, destPath, toMove, callback) {
  var action = toMove ?  'MOVE' : 'COPY'
  var payload = {
    srcPath: srcPath,
    srcRootPath: 'APP',
    destPath: destPath,
    destRootPath: 'APP',
    action: action
  };
  request({
    method: 'POST',
    url: SERVER_URL + '/nfs/movefile',
    headers: {
      'Content-Type': 'application/json',
      'authorization': token
    },
    body: JSON.stringify(payload)
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
  request({
    method: 'POST',
    url: SERVER_URL + '/dns',
    headers: {
      'Content-Type': 'application/json',
      'authorization': token
    },
    body: JSON.stringify(payload)
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
    url: SERVER_URL + '/dns/' + encodeURIComponent(longName),
    headers: {
      'Content-Type': 'text/plain',
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
    url: SERVER_URL + '/dns/' + encodeURIComponent(longName),
    headers: {
      'Content-Type': 'text/plain',
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
  request({
    method: 'PUT',
    url: SERVER_URL + '/dns',
    headers: {
      'Content-Type': 'application/json',
      'authorization': token
    },
    body: JSON.stringify(payload)
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
    url: SERVER_URL + '/dns/' + encodeURIComponent(serviceName) + '/' + encodeURIComponent(longName),
    headers: {
      'Content-Type': 'text/plain',
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
    url: SERVER_URL + '/dns/' + encodeURIComponent(serviceName) + '/' + encodeURIComponent(longName),
    headers: {
      'Content-Type': 'text/plain',
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
    url: url,
    headers: {
      'Content-Type': 'text/plain',
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
    url: SERVER_URL + '/dns',
    headers: {
      'Content-Type': 'text/plain',
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
    url: SERVER_URL + '/dns/' + encodeURIComponent(longName),
    headers: {
      'Content-Type': 'text/plain',
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
  // updateFileContent: updateFileContent,
  moveOrCopyFile: moveOrCopyFile,
  moveOrCopyDir: moveOrCopyDir,
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
