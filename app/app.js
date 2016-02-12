// Use new ES6 modules syntax for everything.
// import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
// import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
import ProxyServer from './web_proxy';
import * as api from './api/safe';
import RESTServer from './server/boot';
import UIUtils from './ui_utils';
import {formatResponse} from './server/utils';

let restServer = new RESTServer(api, env.serverPort);
let proxyServer = new ProxyServer(env.proxyPort, env.serverPort);
window.msl = new UIUtils(api, remote, restServer);

window.proxy = proxyServer;
