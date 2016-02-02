/**
 * Auth Factory
 */
window.safeLauncher.factory('AuthFactory', [
  function() {
    var self = this;

    // Login
    self.login = function(user, callback) {
      window.login(user.pin, user.keyword, user.password, callback);
    };

    // Register
    self.register = function(user, callback) {
      window.register(user.pin, user.keyword, user.password, callback);
    };

    return self;
  }
]);
