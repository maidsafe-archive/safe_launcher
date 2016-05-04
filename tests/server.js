var api = require('../testApp/api/safe.js');
var RESTServer = require('../testApp/server/boot.js');
var config = require('../config/env_development.json');

new RESTServer.default(api, config.serverPort);
