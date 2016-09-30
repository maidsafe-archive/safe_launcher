import util from 'util';
import { Writable } from 'stream';
import immutableData from '../../ffi/api/immutable_data';

export var ImmutableDataWriter = function(req, writerId, responseHandler, size, offset) {
  Writable.call(this);
  this.eventEmitter = req.app.get('eventEmitter');
  this.uploadEvent = req.app.get('EVENT_TYPE').DATA_UPLOADED;
  this.writerId = writerId;
  this.curOffset = parseInt(offset || 0);
  this.maxSize = size;
  this.responseHandler = responseHandler;
  return this;
};

util.inherits(ImmutableDataWriter, Writable);

/*jscs:disable disallowDanglingUnderscores*/
ImmutableDataWriter.prototype._write = function(data, enc, next) {
  /*jscs:enable disallowDanglingUnderscores*/
  immutableData.write(this.writerId, data)
    .then(() => {
      this.eventEmitter.emit(this.uploadEvent, data.length);
      this.curOffset += data.length;
      if (this.curOffset === this.maxSize) {
        return this.responseHandler();
      }
      next();
    }, (err) => {
      this.responseHandler(err);
    }, console.error);
};
