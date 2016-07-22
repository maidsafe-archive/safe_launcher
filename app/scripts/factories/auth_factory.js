/**
 * Authentication Factory
 */
window.safeLauncher.factory('authFactory', [ 'serverFactory',
  function(server) {
    var self = this;

    // Login
    self.login = function(location, password, callback) {
      window.msl.login(location, password, callback);
    };

    // Register
    self.register = function(location, password, callback) {
      window.msl.register(location, password, callback);
    };

    self.onAuthorisationReq = server.onAuthRequest;
    self.confirmAuthorisation = server.confirmResponse;

    return self;
  }
]);
