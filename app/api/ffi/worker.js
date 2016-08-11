var path = require('path');
var Handler = require('./mod/handler.js');

var rootFolder = __dirname;
if (rootFolder.indexOf('app.asar') > 0) {
  rootFolder = path.resolve(rootFolder, '../../../', 'app.asar.unpacked/api/ffi/');
}
var libPath = path.resolve(rootFolder, (process.platform === 'win32' ? 'safe_core' : 'libsafe_core'));
var handler = new Handler(libPath);

var onMessage = handler.dispatcher;

var BeforeExit = function(handler) {
  this.handler = handler;
  var self = this;
  this.cleanUp = function() {
    try {
      self.handler.cleanUp();
    } catch (e) {}
  };
  return this.cleanUp;
};
process.on('message', onMessage);
process.on('beforeExit', new BeforeExit(handler));
