var should = require('should');
var utils = require('./test_utils');

describe('Authorisation', function() {
  before(function(done) {
    utils.startLauncher(function() {
      done();
    });
  });

  after(function() {
    utils.killLauncher();
  });

  describe('userAuthorise', function() {
    it('should be ok', function() {
      (true).should.be.true();
    });
  });

});
