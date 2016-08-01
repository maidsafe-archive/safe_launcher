var should = require('should');
var utils = require('./test_utils');

describe('Authorisation', function() {
  var child = null;

  before(function(done) {
    utils.register(function(regKeys) {
      console.log('register');
      utils.setRegisteredKeys(regKeys);
      utils.login(true, function() {
        console.log('login');
        utils.startLauncher(function() {
          done();
        });
      });
    });
  });

  after(function() {
    utils.killLauncher();
  });

  describe('Authorise App', function() {
    it('should be able to authorise app', function(done) {
      utils.registerAuthApproval(true);
      utils.authoriseApp(function(status) {
        (status).should.be.equal(200);
        utils.removeAllEventListener();
        done();
      });
    });

    it('should be able to unauthorise app', function(done) {
      utils.registerAuthApproval(false);
      utils.authoriseApp(function(status) {
        (status).should.be.equal(401);
        utils.removeAllEventListener();
        done();
      });
    });
  });

  describe('Revoke App', function() {
    it('should be able to revoke app', function(done) {
      var revokeReq = function() {
        utils.revokeApp(utils.getToken(), function(status) {
          (status).should.be.equal(200);
          done();
        });
      };

      utils.registerAuthApproval(true);
      utils.authoriseApp(function(status) {
        utils.removeAllEventListener();
        revokeReq();
      });
    });
    it('should throw 401 unauthorised on revoke', function(done) {
      var revokeReq = function() {
        utils.revokeApp(Math.floor(Math.random() * 100000000), function(status) {
          (status).should.be.equal(401);
          done();
        });
      };

      utils.registerAuthApproval(true);
      utils.authoriseApp(function(status) {
        utils.removeAllEventListener();
        revokeReq();
      });
    });
  });
});
