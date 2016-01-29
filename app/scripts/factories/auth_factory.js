/**
 * Auth Factory
 */
window.safeLauncher.factory('AuthFactory', [
  function() {
    var self = this;

    // Login
    self.login = function(payload, callback) {
      return callback(null, 'Login successfull');
    };

    // Register
    self.register = function(payload, callback) {
      return callback(null, 'Registered');
    };

    return self;
  }
]);
