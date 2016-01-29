import childProcess from 'child_process';
import libSodium from 'libsodium-wrappers';

var workerProcess = childProcess.fork(__dirname + '/api/ffi/worker.js');
var callbackPool = {};

var addToCallbackPool = function(id, callback) {
  if (!callbackPool[id]) {
    callbackPool[id] = [];
  }
  callbackPool[id].push(callback);
};

workerProcess.on('message', function(msg) {
  if (!callbackPool[msg.id]) {
    return;
  }
  let isError = msg.errorCode !== 0;
  let id = msg.id;
  delete msg.id;
  let cb;
  for (let i in callbackPool[id]) {
    cb = callbackPool[id][i];
    if (isError) {
      cb(msg);
    } else {
      cb(null, msg.data);
    }
  }
  delete callbackPool[id];
});

export var send = function(msg, callback) {
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  let id = new Buffer(libSodium.crypto_hash(JSON.stringify(msg))).toString('base64');
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  addToCallbackPool(id, callback);
  msg.id = id;
  workerProcess.send(msg);
};

export var close = function() {
  workerProcess.exit();
}
