var path = require('path');
var Hanlder = require('./mod/handler.js');

var rootFolder = __dirname;
if (rootFolder.indexOf('app.asar') > 0) {
  rootFolder = path.resolve(rootFolder, '../../../', 'app.asar.unpacked/api/ffi/');
}
var libPath = path.resolve(rootFolder, (process.platform === 'win32' ? 'safe_core' : 'libsafe_core'));
var hanlder = new Hanlder(libPath);

var onMessage = hanlder.dispatcher;

var BeforeExit = function(hanlder) {
  this.cleanUp = function() {
    if (!handler) {
      return;
    }
    handler.cleanUp();
  };
  return this.cleanUp;
};

process.on('message', onMessage);
process.on('beforeExit', new BeforeExit(hanlder));
