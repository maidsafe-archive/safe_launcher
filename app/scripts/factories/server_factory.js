/**
 * Server Factory
 */
window.safeLauncher.factory('ServerFactory', [
  function() {
    var self = this;

    // Start server
    self.start = function() {
      window.msl.startServer();
    };

    // Handle server error
    self.onServerError(callback) {
      window.msl.onServerError(callback);
    };

    // handle server start
    self.onServerStarted(callback) {
      window.msl.onServerStarted(callback);
    };

    // handle server shutdown
    self.onServerShutdown(callback) {
      window.msl.onServerShutdown(callback);
    };

    // handle session creation
    self.onSessionCreated(callback) {
      window.msl.onSessionCreated(callback);
    };

    // handle session removed
    self.onSessionRemoved(callback) {
      window.msl.onSessionRemoved(callback);
    };

    return self;
  }
]);
