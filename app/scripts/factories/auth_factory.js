/*global safeLauncher:false */

safeLauncher.factory('AuthFactory', [
  function() {
    var self = this;

    /**
     * Register
     */
    self.register = function(payload, callback) {
      return callback(null, 'Done');
    };

    return self;
  }
]);
