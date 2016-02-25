/**
 * Authentication Factory
 */
window.safeLauncher.factory('authFactory', [
  function() {
    var self = this;

    // Login
    self.login = function(user, callback) {
      window.msl.login(user.pin, user.keyword, user.password, callback);
    };

    // Register
    self.register = function(user, callback) {
      window.msl.register(user.pin, user.keyword, user.password, function(err) {
        if (err) {
          return callback(err);
        }
        self.login(user, callback);
      });
    };

    return self;
  }
]);
