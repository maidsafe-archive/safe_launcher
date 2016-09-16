import util from 'util';
import { Writable } from 'stream';
import { updateAppActivity } from './../utils.js';
import immutableData from '../../ffi/api/immutable_data';

export var ImmutableDataWriter = function(req, res, app, writerId, encryptionType,
    encryptKeyHandle, responseHandler, size, offset) {
  Writable.call(this);
  this.app = app;
  this.req = req;
  this.res = res;
  this.writerId = writerId;
  this.encryptKeyHandle = encryptKeyHandle;
  this.curOffset = parseInt(offset || 0);
  this.responseHandler = responseHandler;
  this.encryptionType = encryptionType;
  this.isReadStreamClosed = false;
  this.maxSize = size;
  return this;
};

util.inherits(ImmutableDataWriter, Writable);

/*jscs:disable disallowDanglingUnderscores*/
ImmutableDataWriter.prototype._write = function(data, enc, next) {
  /*jscs:enable disallowDanglingUnderscores*/
  const self = this;
  const eventEmitter = self.req.app.get('eventEmitter');
  const uploadEvent = self.req.app.get('EVENT_TYPE').DATA_UPLOADED;
  immutableData.write(this.writerId, data)
    .then(() => {
      eventEmitter.emit(uploadEvent, data.length);
      self.curOffset += data.length;
      if (self.curOffset === self.maxSize) {
        immutableData.closeWriter(self.app, self.writerId, self.encryptionType, self.encryptKeyHandle)
          .then((dataIdHandle) => {
            self.res.set('Handle-Id', dataIdHandle);
            self.res.sendStatus(200);
            updateAppActivity(self.req, self.res, true);
          }, self.responseHandler, console.error);
      }
      next();
    }, (err) => {
      self.responseHandler(err);
    }, console.error);
};
