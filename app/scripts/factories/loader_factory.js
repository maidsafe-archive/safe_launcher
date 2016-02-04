/**
 * Auth Factory
 */
window.safeLauncher.factory('LoaderFactory', [
  function() {
    var self = this;
    self.loading = false;

    // show
    self.show = function() {
      self.loading = true;
    };

    // hide
    self.hide = function() {
      self.loading = false;
    };

    return self;
  }
]);
