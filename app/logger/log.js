import fs from 'fs';
import path from 'path';
import util from 'util';
import env from '../env';
import fse from 'fs-extra';
import winston from 'winston';

class Logger {

  constructor() {
    const self = this;
    self.logFilePath = null;
    // TODO pass log id that can used for the log visualiser
    // let id = 'uid_' + 1001;
    self.winston = winston;
    let pad = function(value) {
      return ('0' + value).slice(-2);
    };

    let transports = [];
    self.logLevel = (env && env.log) ? (env.log.level ? env.log.level : 'warn') : 'warn';
    self.logFormatter = function(log) {
      let date = new Date();
      let timeStamp = util.format('%s:%s:%s.%d', pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds()),
          date.getMilliseconds());
      return util.format('%s %s - %s', log.level.toUpperCase(), timeStamp, log.message);
    };
    self.winston.remove(self.winston.transports.Console);
    if(env.name !== 'test') {
      try {
        process.stdout.write('\n');
        self.winston.add(self.winston.transports.Console, {
          level: self.logLevel,
          handleExceptions: true,
          formatter: self.logFormatter
        });
      } catch (e) {
        console.log('Console Logger initialisation failed', e);
      }
    }
  }

  setFileLogger(path) {
    var self = this;
    if(env.name !== 'test') {
      try {
        self.logFilePath = path;
        fse.ensureFileSync(self.logFilePath);
        self.winston.add(self.winston.transports.File, {
          filename: self.logFilePath,
          json: false,
          options: {
            flags: 'w'
          },
          level: self.logLevel,
          formatter: self.logFormatter
        });
      } catch (e) {
        console.log('File logger could not be added ', e);
      }
    }
  }

  info(msg) {
    try {
      this.winston.info(msg);
    } catch(e) {
      console.log(e)
    }
  }

  warn(msg) {
    try {
      this.winston.warn(msg);
    } catch(e) {
      console.log(e)
    }
  }

  error(msg) {
    try {
      this.winston.error(msg);
    } catch(e) {
      console.log(e)
    }
  }

  debug(msg) {
    try {
      this.winston.debug(msg);
    } catch(e) {
      console.log(e)
    }
  }

  verbose(msg) {
    try {
      this.winston.verbose(msg);
    } catch(e) {
      console.log(e)
    }
  }

}

export const log = new Logger();
