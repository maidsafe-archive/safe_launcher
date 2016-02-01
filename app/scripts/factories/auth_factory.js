/**
 * Auth Factory
 */
window.safeLauncher.factory('AuthFactory', [
  function() {
    var self = this;

    /**
     * Register
     */
    self.register = function(payload, callback) {
      return callback(null, 'Registered');
    };

    return self;
  }
]);
