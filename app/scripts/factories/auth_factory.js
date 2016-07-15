/**
 * Authentication Factory
 */
window.safeLauncher.factory('authFactory', [ 'serverFactory',
  function(server) {
    var self = this;

    // Login
    self.login = function(passPhrase, callback) {
      window.msl.login(passPhrase, callback);
    };

    // Register
    self.register = function(passPhrase, callback) {
      window.msl.register(passPhrase, callback);
    };

    self.onAuthorisationReq = server.onAuthRequest;
    self.confirmAuthorisation = server.confirmResponse;

    return self;
  }
]);
