/**
 * Server Factory
 */
window.safeLauncher.factory('serverFactory', [
  function() {
    var self = this;

    var SERVER_ERR = {
      'EADDRINUSE': 'Unable to start Server. Port ::port:: already in use',
      'EPERM': 'Unable to start Server at ::port::. Need elevated privileges. Try running as Administrator'
    };

    // Start server
    self.start = function() {
      window.msl.startServer();
    };

    // close window
    self.closeWindow = function() {
      window.msl.closeWindow();
    };

    // Handle server error
    self.onServerError = function(callback) {
      window.msl.onServerError(function(error) {
        var errMsg = 'Unable to start Local Server';
        if (error.hasOwnProperty('code') && SERVER_ERR.hasOwnProperty(error.code)) {
          errMsg = SERVER_ERR[error.code];
          errMsg = errMsg.replace('::port::', error.port)
        }
        callback({
          code: error.code,
          message: errMsg
        });
      });
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
    self.startProxyServer = function() {
      window.msl.startProxyServer();
    };

    // handle proxy error
    self.onProxyError = function(callback) {
      window.msl.onProxyError(function(error) {
        var errMsg = 'Unable to start Local Server';
        if (error.hasOwnProperty('code') && SERVER_ERR.hasOwnProperty(error.code)) {
          errMsg = SERVER_ERR[error.code];
          errMsg = errMsg.replace('::port::', error.port)
        }
        callback({
          code: error.code,
          message: errMsg
        });
      });
    }

    // handle proxy exit
    self.onProxyExit = function(callback) {
      window.msl.onProxyExit(callback);
    }

    // handle proxy start
    self.onProxyStart = function(callback) {
      window.msl.onProxyStart(callback);
    }

    // stop proxy server
    self.stopProxyServer = function() {
      window.msl.stopProxyServer();
    };
    return self;
  }
]);
