import { log } from './../../logger/log';
import immutableData from '../../ffi/api/immutable_data';
import { updateAppActivity } from './../utils.js';
var Readable = require('stream').Readable;
var util = require('util');

export var ImmutableDataReader = function(req, res, readerId, start, end) {
  Readable.call(this);
  this.req = req;
  this.res = res;
  this.readerId = readerId;
  this.start = start;
  this.end = end;
  this.curOffset = start;
  this.sizeToRead = 0;
  return this;
};

util.inherits(ImmutableDataReader, Readable);

/*jscs:disable disallowDanglingUnderscores*/
ImmutableDataReader.prototype._read = function() {
  /*jscs:enable disallowDanglingUnderscores*/
  const self = this;
  if (self.curOffset === self.end) {
    updateAppActivity(self.req, self.res, true);
    immutableData.closeReader(this.readerId);
    return self.push(null);
  }
  const MAX_SIZE_TO_READ = 1048576; // 1 MB
  const diff = this.end - this.curOffset;
  const eventEmitter = self.req.app.get('eventEmitter');
  const eventType = self.req.app.get('EVENT_TYPE').DATA_DOWNLOADED;
  this.sizeToRead = diff > MAX_SIZE_TO_READ ? MAX_SIZE_TO_READ : diff;
  immutableData.read(this.readerId, this.curOffset, this.sizeToRead).then((data) => {
      self.curOffset += self.sizeToRead;
      // data = new Buffer(data.toString(), 'base64');
      self.push(data);
      eventEmitter.emit(eventType, data.length);
    }, (err) => {
      self.push(null);
      log.error(err);
      updateAppActivity(self.req, self.res);
      self.res.end();
    }, console.error);
};
