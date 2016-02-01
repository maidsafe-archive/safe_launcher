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
      window.register(user.pin.confirm, user.keyword.confirm, user.password.confirm, callback);
    };

    return self;
  }
]);
