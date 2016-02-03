// Use new ES6 modules syntax for everything.
// import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
// import jetpack from 'fs-jetpack'; // module loaded from npm
// import env from './env';
import * as api from './api/safe';
import RESTServer from './server/boot';
import UIUtils from './UIUtils';
window.msl = new UIUtils(api, remote);

var onServerError = function(error) {};

var onServerStarted = function() {};

var onServerShutdown = function() {};

var onSessionCreated = function(session) {};

var onSessionRemoved = function(id) {};

var restServer = new RESTServer(api);
restServer.addEventListener(restServer.EVENT_TYPE.ERROR, onServerError);
restServer.addEventListener(restServer.EVENT_TYPE.STARTED, onServerStarted);
restServer.addEventListener(restServer.EVENT_TYPE.STOPPED, onServerShutdown);
restServer.addEventListener(restServer.EVENT_TYPE.SESSION_CREATED, onSessionCreated);
restServer.addEventListener(restServer.EVENT_TYPE.SESSION_REMOVED, onSessionRemoved);
restServer.start();
