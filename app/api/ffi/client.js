import childProcess from 'child_process';
import * as libSodium from 'libsodium-wrappers';

var workerProcess;
var workerPath = __dirname;
workerPath += workerPath.indexOf('ffi') === -1 ? '/api/ffi/worker.js' : '/worker.js';
var callbackPool = {};
var isClosed = false;
var networkStateListener;

var addToCallbackPool = function(id, callback) {
  if (!callbackPool[id]) {
    callbackPool[id] = [];
  }
  callbackPool[id].push(callback);
};

var startWorker = function() {
  workerProcess = childProcess.fork(workerPath);
  workerProcess.on('close', function() {
    if (isClosed) {
      return;
    }
    isClosed = true;
    if (networkStateListener) {
      networkStateListener(-1);
    }
  });

  workerProcess.on('message', function(msg) {
    // console.log(msg);
    if (msg.id === 0 && networkStateListener) {
      return networkStateListener(msg.data.state);
    } else if (!callbackPool[msg.id]) {
      return;
    }
    let isError = msg.errorCode !== 0;
    let id = msg.id;
    let callbacks = callbackPool[id];
    delete msg.id;
    delete callbackPool[id];
    for (let i in callbacks) {
      if (isError) {
        callbacks[i](msg);
      } else {
        callbacks[i](null, msg.data);
      }
    }
  });
  send({
    'module': 'connect'
  });
};

export var send = function(msg, callback) {
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  let id = new Buffer(libSodium.crypto_hash(JSON.stringify(msg))).toString('base64');
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  if (callback) {
    addToCallbackPool(id, callback);
  }
  msg.id = id;
  workerProcess.send(msg);
};

export var close = function() {
  if (isClosed) {
    return;
  }
  isClosed = true;
  workerProcess.kill();
};

export var setNetworkStateListener = function(callback) {
  networkStateListener = callback;
};

export var restart = function() {
  close();
  startWorker();
};

startWorker();
