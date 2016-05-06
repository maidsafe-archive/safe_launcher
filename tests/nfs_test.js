var should = require('should');
var utils = require('./test_utils');

describe('NFS', function() {
  before(function(done) {
    var authoriseCb = function(status) {
      if (status !== 200) {
        return process.exit();
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
    utils.login(true, loginCb);
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
    var dirName = '/test_' + (new Date().getTime());
    after(function(done) {
      utils.deleteDir(utils.getToken(), encodeURIComponent(dirName), function(status) {
        if (status === 200) {
          done();
        }
      });
    });

    it('should be able to create directory', function(done) {
      utils.createDir(utils.getToken(), dirName, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.createDir(Math.floor(Math.random() * 1000000000), dirName, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw error 400 directory already exist', function(done) {
      utils.createDir(utils.getToken(), dirName, function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

  // get directory
  describe('Get Directory', function() {
    var dirName = '/test_' + (new Date().getTime());
    before(function(done) {
      utils.createDir(utils.getToken(), dirName, function(status) {
        if (status === 200) {
          done();
        }
      });
    });

    after(function(done) {
      utils.deleteDir(utils.getToken(), encodeURIComponent(dirName), function(status) {
        if (status === 200) {
          done();
        }
      });
    });

    it('should be able to get directory', function(done) {
      utils.getDir(utils.getToken(), encodeURIComponent(dirName), function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw 401 unauthorised', function(done) {
      utils.getDir(Math.floor(Math.random() * 1000000000), encodeURIComponent(dirName), function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 400 directory not found', function(done) {
      utils.getDir(utils.getToken(), encodeURIComponent('/test_' + (new Date().getTime())), function(status) {
        (status).should.be.equal(400);
        done();
      });
    });
  });

});
