import childProcess from 'child_process';
import * as libSodium from 'libsodium-wrappers';
import { log } from './../../logger/log';

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
  log.debug('Starting FFI worker client');
  workerProcess = childProcess.fork(workerPath);
  workerProcess.on('close', function() {
    if (isClosed) {
      log.warn('Starting FFI worker client closed already');
      return;
    }
    log.debug('Starting FFI worker client closed');
    isClosed = true;
    if (networkStateListener) {
      log.debug('Sending network state closed signal');
      networkStateListener(-1);
    }
  });

  workerProcess.on('message', function(msg) {
    log.debug('FFI onmessage :: ' + msg);
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
        log.debug('invoking Error Response callback :: callback id - ' + id);
        callbacks[i](msg);
      } else {
        log.debug('invoking Response callback :: callback id - ' + id);
        callbacks[i](null, msg.data);
      }
    }
  });
  log.debug('Sending FFI initialisation request');
  send({
    'module': 'connect'
  });
};

export var send = function(msg, callback) {
  log.debug('Sending message to FFI ' + msg);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  let id = new Buffer(libSodium.crypto_hash(JSON.stringify(msg))).toString('base64');
  log.debug('Message callback ID' + id + ' ' + msg);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  if (callback) {
    addToCallbackPool(id, callback);
  }
  msg.id = id;
  workerProcess.send(msg);
};

export var close = function() {
  if (isClosed) {
    log.warn('FFI worker client is already closed');
    return;
  }
  log.debug('Closing FFI worker client');
  isClosed = true;
  workerProcess.kill();
};

export var setNetworkStateListener = function(callback) {
  networkStateListener = callback;
};

export var restart = function() {
  log.debug('Restarting FFI client worker');
  close();
  startWorker();
};

startWorker();
