var childProcess = require("child_process");

var workerProcess = childProcess.fork(__dirname + '/api/ffi/worker.js');

workerProcess.on('message', function(e, d) {
  window.alert(e);
});

export var send = function(msg) {
  workerProcess.send(msg);
};
