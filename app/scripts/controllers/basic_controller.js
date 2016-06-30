/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {
    // handle server error
    server.onServerError(function(err) {
      $rootScope.$loader.hide();
      $rootScope.$msAlert.show('Server error', err.message, function() {
        server.closeWindow();
      });
    });

    // handle server start
    server.onServerStarted(function() {
      console.log('Server started');
    });

    // handle server shutdown
    server.onServerShutdown(function() {
      $rootScope.$loader.hide();
      console.log('Server stopped');
    });

    // handle proxy start
    server.onProxyStart(function(msg) {
      $rootScope.$proxyServer = true;
      $rootScope.$loader.hide();
      console.log(msg);
    });

    // handle proxy stop
    server.onProxyExit(function(msg) {
      $rootScope.$loader.hide();
      console.log(msg);
    });

    // handle proxy error
    server.onProxyError(function(err) {
      $rootScope.$loader.hide();
      $rootScope.$msAlert.show('Proxy server error', err.message, function() {
        server.closeWindow();
      });
    });

    // initialize application
    $scope.initApplication = function() {
      $rootScope.$loader.show();
      server.start();
      server.startProxyServer();
    };
  }
]);
