var should = require('should');
var utils = require('./test_utils');

describe('NFS Test', function() {
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
      done();
    });
  });

  describe('Create Directory', function() {
    var dirName = '/test_' + (new Date().getTime());
    it('should be able to create directory', function(done) {
      utils.createDir(utils.getToken(), dirName, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });
  });
});
