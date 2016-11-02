/* eslint-disable import/prefer-default-export */
/* eslint-disable func-names */
import util from 'util';
import { Writable } from 'stream';
import nfs from '../../ffi/api/nfs';
import log from '../../logger/log';

export const NfsWriter = function (req, writerId, responseHandler, size, offset) {
  Writable.call(this);
  this.req = req;
  this.writerId = writerId;
  this.curOffset = parseInt(offset || 0, 10);
  this.responseHandler = responseHandler;
  this.isReadStreamClosed = false;
  this.maxSize = size;
  return this;
};

util.inherits(NfsWriter, Writable);

/* eslint-disable no-underscore-dangle */
NfsWriter.prototype._write = function (data, enc, next) {
  const self = this;
  const eventEmitter = self.req.app.get('eventEmitter');
  const uploadEvent = self.req.app.get('EVENT_TYPE').DATA_UPLOADED;
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
    }, (e) => {
      log.error(`Stream :: NFS writer :: ${e}`);
    });
};
/* eslint-enable no-underscore-dangle */
