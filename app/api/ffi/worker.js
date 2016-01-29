var path = require('path');
var Hanlder = require('./mod/handler.js');

var rootFolder = __dirname;
if (rootFolder.indexOf('app.asar') > 0) {
  rootFolder = path.resolve(rootFolder, '../../../', 'app.asar.unpacked/api/ffi/');
}
var libPath = path.resolve(rootFolder, (process.platform === 'win32' ? 'safe_ffi' : 'libsafe_ffi'));
var hanlder = new Hanlder(libPath);

var onMessage = hanlder.dispatcher;

var onUnhadledException = function() {

};

process.on('message', onMessage);
process.on('uncaughtException', onUnhadledException);
