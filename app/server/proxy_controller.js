import path from 'path';
import env from './../env';
import { log } from './../logger/log';
import childProcess from 'child_process';
import { remote } from 'electron';

class ProxyController {

  constructor() {
    this.process = null;
  }

  start(proxyListener) {
    if (this.process) {
      log.warn('Trying to start proxy server which is already running');
      return;
    }
    let self = this;
    log.info('Starting proxy server');
    var args = [
      '--proxyPort',
      env.proxyPort,
      '--serverPort',
      env.serverPort
    ];
    if (remote.getGlobal('proxyUnsafeMode')) {
      args.push('--unsafe_mode');
      args.push('true');
    }
    const rootPath = (process.env.NODE_ENV === 'production') ? remote.app.getAppPath() : process.cwd();
    this.process = childProcess.fork(path.resolve(rootPath, 'dist/server/web_proxy.js'), args);
    this.process.on('exit', function() {
      log.info('Proxy server stopped');
      remote.getGlobal('proxy').pid = null;
      proxyListener.onExit('Proxy server closed');
    });
    this.process.on('message', function(event) {
      log.debug('Proxy Server - onMessage event - received - ');
      event = JSON.parse(event);
      switch (event.type) {
        case 'connection':
          if (event.msg.status) {
            log.info('Proxy server started');
            remote.getGlobal('proxy').pid = self.process.pid;
            return proxyListener.onStart(event.msg.data);
          }
          proxyListener.onError(event.msg);
          break;
        case 'log':
          if (event.msg.level === 'INFO') {
            log.info(event.msg.log);
          } else {
            log.error(event.msg.log);
          }
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

export var proxyController = new ProxyController();
