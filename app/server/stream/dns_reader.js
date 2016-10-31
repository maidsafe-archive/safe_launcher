import { log } from './../../logger/log';
import { updateAppActivity, parseExpectionMsg } from './../utils.js';
import dns from '../../ffi/api/dns';
var Readable = require('stream').Readable;
var util = require('util');

export var DnsReader = function(req, res, longName, serviceName, filePath, start, end, app) {
  Readable.call(this);
  this.req = req;
  this.res = res;
  this.longName = longName;
  this.serviceName = serviceName;
  this.filePath = filePath;
  this.start = start;
  this.end = end;
  this.curOffset = start;
  this.sizeToRead = 0;
  this.app = app;
  return this;
};

util.inherits(DnsReader, Readable);

/*jscs:disable disallowDanglingUnderscores*/
DnsReader.prototype._read = function() {
  /*jscs:enable disallowDanglingUnderscores*/
  const self = this;
  try {
    if (self.curOffset === self.end) {
      self.push(null);
      return updateAppActivity(self.req, self.res, true);
    }
    let MAX_SIZE_TO_READ = 1048576; // 1 MB
    const diff = self.end - self.curOffset;
    let eventEmitter = self.req.app.get('eventEmitter');
    let eventType = self.req.app.get('EVENT_TYPE').DATA_DOWNLOADED;
    self.sizeToRead = diff > MAX_SIZE_TO_READ ? MAX_SIZE_TO_READ : diff;
    dns.readFile(self.app, self.longName, self.serviceName, self.filePath, self.curOffset,
      self.sizeToRead).then((data) => {
        self.curOffset += self.sizeToRead;
        self.push(data);
        eventEmitter.emit(eventType, data.length);
      }, (e) => {
        self.push(null);
        log.error(`Stream :: DNS Reader :: ${e}`);
        updateAppActivity(self.req, self.res);
        return self.res.end();
      });
  } catch(e) {
    log.warn(`Stream :: DNS Reader error :: ${parseExpectionMsg(e)}`);
  }
};
