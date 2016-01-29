import childProcess from 'child_process';

var workerProcess = childProcess.fork(__dirname + '/api/ffi/worker.js');

workerProcess.on('message', function(msg) {
  console.log(msg);
});

export var send = function(msg, callback) {
  workerProcess.send(msg);
};
