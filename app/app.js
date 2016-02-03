// Use new ES6 modules syntax for everything.
// import os from 'os'; // native node.js module
// import { remote } from 'electron'; // native electron module
// import jetpack from 'fs-jetpack'; // module loaded from npm
// import env from './env';
import * as api from './api/safe';
import * as restServer from './server/boot';
// var app = remote.app;
// var appDir = jetpack.cwd(app.getAppPath());

window.login = function(pin, keyword, password, callback) {
  api.auth.login(String(pin), keyword, password, callback);
};
window.register = function(pin, keyword, password, callback) {
  api.auth.register(String(pin), keyword, password, callback);
};

var onServerError = function(error) {};

var onServerStarted = function(port) {};

var onServerShutdown = function() {};

var onSessionCreated = function(session) {};

var onSessionRemoved = function(id) {};

restServer.addEventListener(restServer.EVENT_TYPE.ERROR, onServerError);
restServer.addEventListener(restServer.EVENT_TYPE.STARTED, onServerStarted);
restServer.addEventListener(restServer.EVENT_TYPE.STOPPED, onServerShutdown);
restServer.addEventListener(restServer.EVENT_TYPE.SESSION_CREATED, onSessionCreated);
restServer.addEventListener(restServer.EVENT_TYPE.SESSION_REMOVED, onSessionRemoved);
restServer.startServer(api);
