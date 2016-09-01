import { log } from './../../logger/log';
import { updateAppActivity } from './../utils.js';
var Readable = require('stream').Readable;
var util = require('util');

export var NfsReader = function(req, res, filePath, isPathShared, start, end, hasSafeDriveAccess, appDirKey) {
  Readable.call(this);
  this.req = req;
  this.res = res;
  this.filePath = filePath;
  this.isPathShared = isPathShared;
  this.start = start;
  this.end = end;
  this.curOffset = start;
  this.sizeToRead = 0;
  this.hasSafeDriveAccess = hasSafeDriveAccess;
  this.appDirKey = appDirKey;
  return this;
};

util.inherits(NfsReader, Readable);

/*jscs:disable disallowDanglingUnderscores*/
NfsReader.prototype._read = function() {
  let self = this;
  if (self.curOffset === self.end) {
    updateAppActivity(self.req, self.res, true);
    return self.push(null);
  }
  let MAX_SIZE_TO_READ = 1048576; // 1 MB
  let diff = this.end - this.curOffset;
  let eventEmitter = self.req.app.get('eventEmitter');
  let eventType = self.req.app.get('EVENT_TYPE').DATA_DOWNLOADED;
  this.sizeToRead = diff > MAX_SIZE_TO_READ ? MAX_SIZE_TO_READ : diff;
  this.req.app.get('api').nfs.getFile(this.filePath, this.isPathShared,
    this.curOffset, this.sizeToRead, this.hasSafeDriveAccess, this.appDirKey,
    function(err, data) {
      if (err) {
        self.push(null);
        log.error(err);
        updateAppActivity(self.req, self.res);
        return self.res.end();
      }
      self.curOffset += self.sizeToRead;
      self.push(new Buffer(JSON.parse(data).content, 'base64'));
      eventEmitter.emit(eventType, data.length);
    });
};
/*jscs:enable disallowDanglingUnderscores*/
