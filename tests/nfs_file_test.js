var should = require('should');
var utils = require('./test_utils');

describe('NFS File', function() {
  var dirPath = 'test_' + (new Date()).getTime();
  before(function(done) {
    var createDirCb = function(status) {
      if (status !== 200) {
        return process.exit(0);
      }
      done();
    };

    var authoriseCb = function(status) {
      if (status !== 200) {
        return process.exit(0);
      }
      utils.createDir(utils.getToken(), dirPath, createDirCb);
    };
    var startLauncherCb = function() {
      utils.registerAuthApproval(true);
      utils.authoriseApp(authoriseCb);
    };
    var loginCb = function() {
      utils.startLauncher(startLauncherCb);
    };
    utils.register(function(regKeys) {
      utils.setRegisteredKeys(regKeys);
      utils.login(true, loginCb);
    });
  });

  after(function(done) {
    utils.removeAllEventListener();
    var revokeAppCb = function(status) {
      utils.killLauncher();
      if (status === 200) {
        done();
      }
    };
    var deleteDirCb = function(status) {
      if (status !== 200) {
        process.exit(0);
      }
      utils.revokeApp(utils.getToken(), revokeAppCb);
    };
    utils.deleteDir(utils.getToken(), dirPath, deleteDirCb);
  });

  describe('Create File', function() {
    var filePath = dirPath + '/test.txt';

    after(function(done) {
      utils.deleteFile(utils.getToken(), filePath, function(status) {
        if (status !== 200) {
          console.log('Unable to delete File :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to create file', function(done) {
      utils.createFile(utils.getToken(), filePath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.createFile(Math.floor(Math.random() * 1000000000), filePath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 400 file path not found', function(done) {
      utils.createFile(utils.getToken(), '/test_' + (new Date().getTime()) + '/test.txt', function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

  describe('Get File', function() {
    var filePath = dirPath + '/test.txt';

    before(function(done) {
      utils.createFile(utils.getToken(), filePath, function(status) {
        if (status !== 200) {
          console.error('Unable to create file :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteFile(utils.getToken(), filePath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete file :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to get file', function(done) {
      utils.getFile(utils.getToken(), filePath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.getFile(Math.floor(Math.random() * 1000000000), filePath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 file path not found', function(done) {
      utils.getFile(utils.getToken(), ('/test_' + (new Date().getTime()) + '/test.txt'), function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  describe('Delete File', function() {
    var filePath = dirPath + '/test.txt';

    before(function(done) {
      utils.createFile(utils.getToken(), filePath, function(status) {
        if (status !== 200) {
          console.error('Unable to create file :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to delete file', function(done) {
      utils.deleteFile(utils.getToken(), filePath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.deleteFile(Math.floor(Math.random() * 1000000000), filePath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 400 file path not found', function(done) {
      utils.deleteFile(utils.getToken(), ('/test_' + (new Date().getTime()) + '/test.txt'), function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

  describe('Update file metadata', function() {
    var filePath = dirPath + '/test.txt';
    var newFileName = 'testNew.txt';

    before(function(done) {
      utils.createFile(utils.getToken(), filePath, function(status) {
        if (status !== 200) {
          console.error('Unable to create file :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteFile(utils.getToken(), (dirPath + '/' + newFileName), function(status) {
        if (status !== 200) {
          console.error('Unable to delete file :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to update file metadata', function(done) {
      utils.updateFileMeta(utils.getToken(), newFileName, filePath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.updateFileMeta(Math.floor(Math.random() * 1000000000), newFileName, filePath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 400 file path not found', function(done) {
      utils.updateFileMeta(utils.getToken(), newFileName, ('/test_' + (new Date().getTime()) + '/test.txt'), function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

  describe('Update file content', function() {
    var filePath = dirPath + '/test.txt';
    var fileContent = 'Hi this is test content';

    before(function(done) {
      utils.createFile(utils.getToken(), filePath, function(status) {
        if (status !== 200) {
          console.error('Unable to create file :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteFile(utils.getToken(), filePath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete file :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to update file content', function(done) {
      utils.updateFileContent(utils.getToken(), fileContent, filePath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.updateFileContent(Math.floor(Math.random() * 1000000000), fileContent, filePath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 400 file path not found', function(done) {
      utils.updateFileContent(utils.getToken(), fileContent, ('/test_' + (new Date().getTime()) + '/test.txt'), function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

  describe('Move File', function() {
    var fileName = '/test.txt';
    var filePath = dirPath + fileName;
    var destDirPath = 'dest_' + (new Date()).getTime();

    before(function(done) {
      var createDirCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create directory :: ' + status);
          return process.exit(0);
        }
        done();
      };

      var createFileCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create file :: ' + status);
          return process.exit(0);
        }
        utils.createDir(utils.getToken(), destDirPath, createDirCb);
      };

      utils.createFile(utils.getToken(), filePath, createFileCb);
    });

    after(function(done) {
      utils.deleteDir(utils.getToken(), destDirPath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete directory :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to move file', function(done) {
      utils.moveOrCopyFile(utils.getToken(), filePath, destDirPath, true, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.moveOrCopyFile(Math.floor(Math.random() * 1000000000), filePath, destDirPath, true, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 400 path not found', function(done) {
      utils.moveOrCopyFile(utils.getToken(), ('/test_' + (new Date().getTime()) + '/test.txt'), destDirPath, true, function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

  // copy file
  describe('Copy File', function() {
    var fileName = '/test.txt';
    var filePath = dirPath + fileName;
    var destDirPath = 'dest_' + (new Date()).getTime();

    before(function(done) {
      var createDirCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create directory :: ' + status);
          return process.exit(0);
        }
        done();
      };

      var createFileCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create file :: ' + status);
          return process.exit(0);
        }
        utils.createDir(utils.getToken(), destDirPath, createDirCb);
      };

      utils.createFile(utils.getToken(), filePath, createFileCb);
    });

    after(function(done) {
      utils.deleteDir(utils.getToken(), destDirPath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete directory :: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to copy file', function(done) {
      utils.moveOrCopyFile(utils.getToken(), filePath, destDirPath, false, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.moveOrCopyFile(Math.floor(Math.random() * 1000000000), filePath, destDirPath, false, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 400 path not found', function(done) {
      utils.moveOrCopyFile(utils.getToken(), ('/test_' + (new Date().getTime()) + '/test.txt'), destDirPath, false, function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });
});
