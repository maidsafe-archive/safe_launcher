import util from 'util';
import { Writable } from 'stream';

export var NfsWriter = function (req, filePath, startOffset, isPathShared, sessionInfo, responseHandler) {
  Writable.call(this);
  var self = this;
  this.req = req;
  this.filePath = filePath;
  this.curOffset = parseInt(startOffset);
  this.isPathShared = isPathShared;
  this.sessionInfo = sessionInfo;
  this.responseHandler = responseHandler;
  this.isReadStreamClosed = false;
  this.req.app.get('api').nfs.getWriter(filePath, isPathShared, 
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, function (err, writerId) {
        if (err) {
          return self.responseHandler(err);
        }
        self.writerId = writerId;
        self.emit('open');
      });
  return this;
};

util.inherits(NfsWriter, Writable);

NfsWriter.prototype._write = function(data, enc, next) {
  var self = this;
  var eventEmitter = self.req.app.get('eventEmitter');
  var uploadEvent = self.req.app.get('EVENT_TYPE').DATA_UPLOADED;
  this.req.app.get('api').nfs.write(this.writerId, this.curOffset, data, function(err) {
    if (err) {
      return self.callback(err);
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
