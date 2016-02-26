/**
 * Server Factory
 */
window.safeLauncher.factory('serverFactory', [
  function() {
    var self = this;

    // Start server
    self.start = function() {
      window.msl.startServer();
    };

    // Handle server error
    self.onServerError = function(callback) {
      window.msl.onServerError(callback);
    };

    // handle server start
    self.onServerStarted = function(callback) {
      window.msl.onServerStarted(callback);
    };

    // handle server shutdown
    self.onServerShutdown = function(callback) {
      window.msl.onServerShutdown(callback);
    };

    // handle session creation
    self.onSessionCreated = function(callback) {
      window.msl.onSessionCreated(callback);
    };

    // handle session removed
    self.onSessionRemoved = function(callback) {
      window.msl.onSessionRemoved(callback);
    };

    // handle auth request
    self.onAuthRequest = function(callback) {
      window.msl.onAuthRequest(callback);
    };

    // handle revoke request
    self.onRevokeRequest = function(callback) {
      window.msl.onRevokeRequest(callback);
    };

    // remove session
    self.removeSession = function(id) {
      window.msl.removeSession(id);
    };

    // focus window
    self.focusWindow = function() {
      window.msl.focusWindow();
    };

    // handle auth request
    self.confirmResponse = function(payload, status) {
      window.msl.authResponse(payload, status);
    };

    // start proxy server
    self.startProxyServer = function(callback) {
      window.msl.startProxyServer(callback);
    };

    // stop proxy server
    self.stopProxyServer = function() {
      window.msl.stopProxyServer();
    };
    return self;
  }
]);
