var Readable = require('stream').Readable;
var util = require('util');

export var NfsReader = function (req, filePath, isPathShared, start, end, hasSafeDriveAccess, appDirKey) {
  Readable.call(this);
  this.req = req;
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

NfsReader.prototype._read = function() {
  let self = this;
  if (self.curOffset === self.end) {
    return self.push(null);
  }
  let MAX_SIZE_TO_READ = 1048576; // 1 MB
  let diff = this.end - this.curOffset;
  this.sizeToRead = diff > MAX_SIZE_TO_READ ? MAX_SIZE_TO_READ : diff;
  this.req.app.get('api').nfs.getFile(this.filePath, this.isPathShared,
    this.curOffset, this.sizeToRead, this.hasSafeDriveAccess, this.appDirKey,
    function(err, data) {
      if (err) {
        return log.error(err);
      }
      self.curOffset += self.sizeToRead;
      self.push(new Buffer(JSON.parse(data).content, 'base64'));
    });
};
