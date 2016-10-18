import { log } from './../../logger/log';
import immutableData from '../../ffi/api/immutable_data';
import { ResponseHandler } from './../utils.js';
var Readable = require('stream').Readable;
var util = require('util');

export var ImmutableDataReader = function(req, res, readerId, start, end) {
  Readable.call(this);
  this.eventEmitter = req.app.get('eventEmitter');
  this.eventType = req.app.get('EVENT_TYPE').DATA_DOWNLOADED;
  this.responseHandler = new ResponseHandler(req, res);
  this.res = res;
  this.readerId = readerId;
  this.end = end;
  this.curOffset = start;
  this.sizeToRead = 0;
  return this;
};

util.inherits(ImmutableDataReader, Readable);

/*jscs:disable disallowDanglingUnderscores*/
ImmutableDataReader.prototype._read = function() {
  /*jscs:enable disallowDanglingUnderscores*/
  if (this.curOffset === this.end) {
    this.responseHandler();
    return this.push(null);
  }
  const MAX_SIZE_TO_READ = 1048576; // 1 MB
  const diff = this.end - this.curOffset;
  
  this.sizeToRead = diff > MAX_SIZE_TO_READ ? MAX_SIZE_TO_READ : diff;
  immutableData.read(this.readerId, this.curOffset, this.sizeToRead).then((data) => {
      this.curOffset += this.sizeToRead;
      this.push(data);
      this.eventEmitter.emit(this.eventType, data.length);
    }, (err) => {
      this.push(null);
      // log.error(err);
      this.responseHandler(err);
    }, console.error);
};
