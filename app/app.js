// Use new ES6 modules syntax for everything.
// import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
// import jetpack from 'fs-jetpack'; // module loaded from npm
// import env from './env';
import * as api from './api/safe';
import UIUtils from './UIUtils';

// var app = remote.app;
// var appDir = jetpack.cwd(app.getAppPath());
window.msl = new UIUtils(api, remote);
