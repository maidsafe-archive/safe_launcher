/**
 * Auth Factory
 */
window.safeLauncher.factory('AuthFactory', [
  function() {
    var self = this;

    // Login
    self.login = function(user, callback) {
      window.msl.login(user.pin, user.keyword, user.password, callback);
    };

    // Register
    self.register = function(user, callback) {
      window.msl.register(user.pin, user.keyword, user.password, callback);
    };

    return self;
  }
]);
