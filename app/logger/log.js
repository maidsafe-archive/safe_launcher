import util from 'util';
import fse from 'fs-extra';
import winston from 'winston';
import env from '../env';

class Logger {
  static pad(value) {
    return (`0${value}`).slice(-2);
  }

  static logFormatter(log) {
    const date = new Date();
    const timeStamp = util.format('%s:%s:%s.%d',
      this.pad(date.getHours()),
      this.pad(date.getMinutes()),
      this.pad(date.getSeconds()),
      date.getMilliseconds());
    return util.format('%s %s - %s', log.level.toUpperCase(), timeStamp, log.message);
  }

  constructor() {
    this.logFilePath = null;
    // TODO pass log id that can used for the log visualiser
    // let id = 'uid_' + 1001;
    this.winston = winston;
    if (env && env.log) {
      this.logLevel = env.log.level ? env.log.level : 'warn';
    } else {
      this.logLevel = 'warn';
    }
    this.winston.remove(this.winston.transports.Console);
    if (env.name === 'test') {
      return;
    }
    try {
      process.stdout.write('\n');
      this.winston.add(this.winston.transports.Console, {
        level: this.logLevel,
        handleExceptions: true,
        formatter: this.logFormatter
      });
    } catch (e) {
      console.error('Console Logger initialisation failed', e);
    }
  }

  setFileLogger(path) {
    if (env.name === 'test') {
      return;
    }
    try {
      this.logFilePath = path;
      fse.ensureFileSync(this.logFilePath);
      this.winston.add(this.winston.transports.File, {
        filename: this.logFilePath,
        json: false,
        options: {
          flags: 'w'
        },
        level: this.logLevel,
        formatter: this.logFormatter
      });
    } catch (e) {
      console.error('File logger could not be added ', e);
    }
  }

  info(msg) {
    try {
      this.winston.info(msg);
    } catch (e) {
      console.error(e);
    }
  }

  warn(msg) {
    try {
      this.winston.warn(msg);
    } catch (e) {
      console.error(e);
    }
  }

  error(msg) {
    try {
      this.winston.error(msg);
    } catch (e) {
      console.error(e);
    }
  }

  debug(msg) {
    try {
      this.winston.debug(msg);
    } catch (e) {
      console.error(e);
    }
  }

  verbose(msg) {
    try {
      this.winston.verbose(msg);
    } catch (e) {
      console.error(e);
    }
  }
}

const log = new Logger();
export default log;
