import path from 'path';
import env from './../env';
import { remote } from 'electron';
import { log } from './../logger/log';
import childProcess from 'child_process';

export default class ProxyController {

  constructor() {
    this.process = null;
  }
  
  start(proxyListener) {
    if (this.process) {
      log.warn('Trying to start proxy server which is already running');
      return;
    }
    log.info('Starting proxy server');
    this.process = childProcess.spawn(remote.app.getPath('exe'), [
      'web_proxy.js',
      '--proxyPort',
      env.proxyPort,
      '--serverPort',
      env.serverPort
    ], {
      cwd: path.resolve(__dirname, 'server'),
      stdio: [ null, null, null, 'ipc' ]
    });
    this.process.on('close', function() {
      log.info('Proxy server stopped');
      proxyListener.onExit('Proxy server closed');
    });
    this.process.on('message', function(event) {
      log.debug('Proxy Server - onMessage event - received - ');
      event = JSON.parse(event);
      switch (event.type) {
        case 'connection':
          if (event.msg.status) {
            log.info('Proxy server started');
            return proxyListener.onStart(event.msg.data);
          }
          proxyListener.onError(event.msg.data);
          break;
        case 'log':
          log.error(event.msg.log);
          break;
        default:
          log.warn('Invalid event type from proxy');
      }
    });
  }

  stop() {
    if (!this.process) {
      return;
    }
    log.info('Stopping proxy server');
    this.process.kill();
    this.process = null;
  }
}
