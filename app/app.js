// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
import * as api from './api/safe';

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Example usage of API
// api.auth.register('krishna', '1234', 'password', function(e, d) {
//   console.log(e, d);
// });
