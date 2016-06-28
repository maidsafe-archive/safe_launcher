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
    if (msg.id === 'log') {
      if (msg.data.level === 'ERROR') {
        log.error(msg.data.msg);
      } else {
        log.debug(msg.data.msg);
      }
      return;
    } else if (msg.id === 0 && networkStateListener) {
      return networkStateListener(msg.data.state, msg.data.registeredClient);
    } else if (!callbackPool[msg.id]) {
      log.warn('callback not found :: ' + msg.id);
      return;
    }
    let isError = msg.errorCode !== 0;
    let id = msg.id;
    let callbacks = callbackPool[id];
    delete msg.id;
    delete callbackPool[id];
    for (let i in callbacks) {
      if (isError) {
        log.verbose('invoking Error Response callback :: callback id - ' + id);
        callbacks[i](msg);
      } else {
        log.verbose('invoking Response callback :: callback id - ' + id);
        callbacks[i](null, msg.data);
      }
    }
  });
  log.debug('Sending FFI initialisation request');
  send({
    'module': 'connect'
  });
};

export var send = function(message, callback) {
  let strMessage = JSON.stringify(message);
  log.debug('Sending message to FFI - ' + message.module + ' - ' + (message.action || ''));
  log.verbose('Sending message to FFI ' + strMessage);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  let id = new Buffer(libSodium.crypto_hash(strMessage)).toString('base64');
  log.verbose('Message callback ID' + id + ' ' + strMessage);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  if (callback) {
    addToCallbackPool(id, callback);
  }
  message.id = id;
  workerProcess.send(message);
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
