var should = require('should');
var utils = require('./test_utils');

describe('NFS Directory', function() {
  before(function(done) {
    var authoriseCb = function(status) {
      if (status !== 200) {
        return process.exit(0);
      }
      done();
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
    utils.revokeApp(utils.getToken(), function(status) {
      utils.killLauncher();
      if (status === 200) {
        done();
      }
    });
  });

  describe('Create Directory', function() {
    var dirPath = '/test_' + (new Date().getTime());
    after(function(done) {
      utils.deleteDir(utils.getToken(), dirPath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete directory');
          process.exit(0);
        }
        done();
      });
    });

    it('should be able to create directory', function(done) {
      utils.createDir(utils.getToken(), dirPath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.createDir(Math.floor(Math.random() * 1000000000), dirPath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw error 400 directory already exist', function(done) {
      utils.createDir(utils.getToken(), dirPath, function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

  // get directory
  describe('Get Directory', function() {
    var dirPath = '/test_' + (new Date().getTime());
    before(function(done) {
      utils.createDir(utils.getToken(), dirPath, function(status) {
        if (status !== 200) {
          console.error('Unable to create directory');
          process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteDir(utils.getToken(), dirPath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete directory');
          process.exit(0);
        }
        done();
      });
    });

    it('should be able to get directory', function(done) {
      utils.getDir(utils.getToken(), dirPath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.getDir(Math.floor(Math.random() * 1000000000), dirPath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 directory not found', function(done) {
      utils.getDir(utils.getToken(), ('/test_' + (new Date().getTime())), function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  // update directory
  describe('Update Directory', function() {
    var dirPath = 'test_' + (new Date().getTime());
    var newdirName = 'new_' + (new Date().getTime());
    before(function(done) {
      utils.createDir(utils.getToken(), dirPath, function(status) {
        if (status !== 200) {
          console.error('Unable to create directory');
          process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteDir(utils.getToken(), ('/' + newdirName), function(status) {
        if (status !== 200) {
          console.error('Unable to delete directory');
          process.exit(0);
        }
        done();
      });
    });

    it('should be able to update directory name', function(done) {
      utils.updateDir(utils.getToken(), dirPath, newdirName, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.updateDir(Math.floor(Math.random() * 1000000000), dirPath, newdirName, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 directory not found', function(done) {
      utils.updateDir(utils.getToken(), ('/test_' + (new Date().getTime())), newdirName, function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  // delete directory
  describe('Delete Directory', function() {
    var dirPath = 'test_' + (new Date().getTime());
    before(function(done) {
      utils.createDir(utils.getToken(), dirPath, function(status) {
        if (status !== 200) {
          console.error('Unable to create directory');
          process.exit(0);
        }
        done();
      });
    });

    it('should be able to delete directory', function(done) {
      utils.deleteDir(utils.getToken(), dirPath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.deleteDir(Math.floor(Math.random() * 1000000000), dirPath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 directory not found', function(done) {
      utils.deleteDir(utils.getToken(), dirPath, function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  describe('Move Directory', function() {
    var dirPath = '/test_' + (new Date().getTime());
    var destPath = '/dest_' + (new Date().getTime());

    before(function(done) {
      var createDestDirCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create directory');
          return process.exit(0);
        }
        done();
      };

      var createDirCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create directory');
          return process.exit(0);
        }
        utils.createDir(utils.getToken(), destPath, createDestDirCb);
      };

      utils.createDir(utils.getToken(), dirPath, createDirCb);
    });

    after(function(done) {
      utils.deleteDir(utils.getToken(), destPath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete directory');
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to move directory', function(done) {
      utils.moveOrCopyDir(utils.getToken(), dirPath, destPath, true, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.moveOrCopyDir(Math.floor(Math.random() * 1000000000), dirPath, destPath, true, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 unauthorised', function(done) {
      utils.moveOrCopyDir(utils.getToken(), '/test_new_' + (new Date().getTime()), destPath, true, function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  // copy directory
  describe('Copy Directory', function() {
    var dirPath = '/test_' + (new Date().getTime());
    var destPath = '/dest_' + (new Date().getTime());

    before(function(done) {
      var createDestDirCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create directory');
          return process.exit(0);
        }
        done();
      };

      var createDirCb = function(status) {
        if (status !== 200) {
          console.error('Unable to create directory');
          return process.exit(0);
        }
        utils.createDir(utils.getToken(), destPath, createDestDirCb);
      };

      utils.createDir(utils.getToken(), dirPath, createDirCb);
    });

    after(function(done) {
      utils.deleteDir(utils.getToken(), destPath, function(status) {
        if (status !== 200) {
          console.error('Unable to delete directory');
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to copy directory', function(done) {
      utils.moveOrCopyDir(utils.getToken(), dirPath, destPath, false, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.moveOrCopyDir(Math.floor(Math.random() * 1000000000), dirPath, destPath, false, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 unauthorised', function(done) {
      utils.moveOrCopyDir(utils.getToken(), '/test_new_' + (new Date().getTime()), destPath, false, function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });
});
