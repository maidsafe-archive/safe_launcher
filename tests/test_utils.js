var childProcess = require('child_process');
var path = require('path');
var token = null;
var safeLauncherProcess = null;

module.exports = {
  startLauncher: function(callback) {
    safeLauncherProcess = childProcess.fork(path.resolve('./tests/server.js'));
    safeLauncherProcess.on('message', function(msg) {
      console.log(msg);
      callback()
    });
  },
  killLauncher: function() {
    safeLauncherProcess.kill();
  }
};
