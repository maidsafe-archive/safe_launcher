var should = require('should');
var utils = require('./test_utils');

describe("DNS", function() {
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
});
