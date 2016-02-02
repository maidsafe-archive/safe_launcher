/**
 * Auth Factory
 */
window.safeLauncher.factory('LoaderFactory', [
  function() {
    var self = this;
    self.loading = false;

    // Login
    self.show = function() {
      self.loading = true;
    };

    // Register
    self.hide = function() {
      self.loading = false;
    };

    return self;
  }
]);
