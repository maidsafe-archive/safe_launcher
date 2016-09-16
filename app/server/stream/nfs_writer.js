import util from 'util';
import nfs from '../../ffi/api/nfs';
import { Writable } from 'stream';

export var NfsWriter = function(req, writerId, responseHandler, size, offset) {
  Writable.call(this);
  var self = this;
  this.req = req;
  this.writerId = writerId;
  this.curOffset = parseInt(offset || 0);
  this.responseHandler = responseHandler;
  this.isReadStreamClosed = false;
  this.maxSize = size;
  return this;
};

util.inherits(NfsWriter, Writable);

/*jscs:disable disallowDanglingUnderscores*/
NfsWriter.prototype._write = function(data, enc, next) {
  var self = this;
  var eventEmitter = self.req.app.get('eventEmitter');
  var uploadEvent = self.req.app.get('EVENT_TYPE').DATA_UPLOADED;
  nfs.writeToFile(this.writerId, data)
  .then(() => {
    eventEmitter.emit(uploadEvent, data.length);
    self.curOffset += data.length;
    if (self.curOffset === self.maxSize) {
      nfs.closeWriter(self.writerId)
      .then(self.responseHandler, self.responseHandler, self.responseHandler);
    }
    next();
  }, (err) => {
    self.responseHandler(err);
  }, console.error);
};
/*jscs:enable disallowDanglingUnderscores*/
