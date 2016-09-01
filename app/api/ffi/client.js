import childProcess from 'child_process';
import { log } from './../../logger/log';
import uuid from 'uuid';
import path from 'path';
import { remote } from 'electron';

var workerProcess;
// var workerPath = __dirname;
var workerPath = process.cwd();
workerPath += workerPath.indexOf('ffi') === -1 ? '/dist/api/ffi/worker.js' : '/worker.js';
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
  let executableDirPath = path.dirname(remote.app.getPath('exe'));
  workerProcess = childProcess.fork(workerPath, [], { cwd: executableDirPath });
  workerProcess.on('close', function() {
    if (isClosed) {
      log.warn('FFI worker client closed already');
      return;
    }
    log.debug('FFI worker client closed');
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
    } else if (msg.id === 'logFilePath') {
      if (msg.errorCode !== 0) {
        return networkStateListener(msg.errorCode);
      }
      if (msg.data) {
        log.setFileLogger(msg.data);
      } else {
        log.debug('Config file path not found');
      }
      log.debug('Sending FFI initialisation request');
      send({
        'module': 'connect'
      });
    } else if (!callbackPool[msg.id]) {
      log.warn('Callback not found :: ' + msg.id);
      return;
    }
    log.debug('FFI response code ' + (msg.errorCode || 0) + ' for id - ' + msg.id);
    let isError = msg.errorCode !== 0;
    let id = msg.id;
    let callbacks = callbackPool[id];
    delete msg.id;
    delete callbackPool[id];
    for (let i in callbacks) {
      if (isError) {
        log.verbose('Invoking error response callback :: callback id - ' + id);
        callbacks[i](msg);
      } else {
        log.verbose('Invoking response callback :: callback id - ' + id);
        callbacks[i](null, msg.data);
      }
    }
  });
  if (!log.logFilePath) {
    console.log('sending log path request');
    send({
      'module': 'get-log-path'
    });
  } else {
    log.debug('Sending FFI initialisation request');
    send({
      'module': 'connect'
    });
  }
};

export var send = function(message, callback) {
  let id = uuid.v4();
  log.debug('Sending message to FFI - ' + id + ' - ' + message.module + ' - ' +
    (message.action || ''));
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

export var reset = function() {
  log.debug('Restarting FFI client worker handles');
  send({
    module: 'reset'
  });
};

export var connectWithUnauthorisedClient = function() {
  send({
    module: 'connect'
  });
};

startWorker();
