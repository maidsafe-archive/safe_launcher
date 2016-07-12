import util from 'util';
import { Writable } from 'stream';

export var NfsWriter = function (req, writerId, responseHandler, offset) {
  Writable.call(this);
  var self = this;
  this.req = req;
  this.writerId = writerId;
  this.curOffset = parseInt(offset || 0);
  this.responseHandler = responseHandler;
  this.isReadStreamClosed = false;
  return this;
};

util.inherits(NfsWriter, Writable);

NfsWriter.prototype._write = function(data, enc, next) {
  var self = this;
  var eventEmitter = self.req.app.get('eventEmitter');
  var uploadEvent = self.req.app.get('EVENT_TYPE').DATA_UPLOADED;
  this.req.app.get('api').nfs.write(this.writerId, this.curOffset, data, function(err) {
    if (err) {
      next(err);      
      return self.responseHandler(err);
    }
    eventEmitter.emit(uploadEvent, data.length);
    self.curOffset += data.length;
    if (self.isReadStreamClosed) {
      return self.req.app.get('api').nfs.closeWriter(self.writerId, self.responseHandler);
    }
    next();
  });
};

NfsWriter.prototype.onClose = function() {
  this.isReadStreamClosed = true;
};
