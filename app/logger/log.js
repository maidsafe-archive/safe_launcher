import fs from 'fs';
import path from 'path';
import util from 'util';
import env from '../env';
import fse from 'fs-extra';
// import FFILogWatcher from './ffi_log_watcher';

class Logger {

  // _getLogId() {
  //   var args = require('remote').process.argv;
  //   var temp;
  //   for (var i in args) {
  //     temp = args[i].split('=');
  //     console.log(temp)
  //     if (temp[0] !== '--logId') {
  //       continue;
  //     }
  //     return temp[1];
  //   }
  //   return;
  // }

  constructor() {
    var self = this;
    // TODO pass log id that can used for the log visualiser
    // let id = 'uid_' + 1001;
    let winston = require('winston');
    let consoleFormatter = function(log) {
      return util.format('%s: %s', log.level, log.message);
    };
    let executablePath = require('remote').app.getPath('exe');
    let executableDirPath = path.dirname(executablePath);
    let logFilePath = path.resolve(executableDirPath, path.basename(executablePath).split('.')[0] + '_ui.log');

    let transports = [];
    var logLevel = env.log ? (env.log.level ? env.log.level : 'debug') : 'debug';
    try {
      process.stdout.write('\n');
      transports.push(new (winston.transports.Console)({
        level: logLevel,
        handleExceptions: true,
        formatter: consoleFormatter
      }));
    } catch (e) {
      console.log('Console Logger initialisation failed');
    }
    try {
      fse.ensureFileSync(logFilePath);
      transports.push(new (winston.transports.File)({
        filename: logFilePath,
        maxsize: env.log.file.maxFileSize,
        maxFiles: env.log.file.maxFiles,
        tailable: true,
        options: {
          flags: 'w'
        },
        level: logLevel
      }));
    } catch (e) {
      console.log('File logger could not be added ', e.message);
    }
    self.logger = new (winston.Logger)({
      transports: transports
    });
  }

  info(msg) {
    this.logger.info(msg);
  }

  warn(msg) {
    this.logger.warn(msg);
  }

  error(msg) {
    this.logger.error(msg);
  }

  debug(msg) {
    this.logger.debug(msg);
  }

  verbose(msg) {
    this.logger.verbose(msg);
  }

}

export var log = new Logger();
