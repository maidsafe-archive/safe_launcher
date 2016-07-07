/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {
    // handle server error
    server.onServerError(function(err) {
      console.log(err);
      // TODO remove and show loader
      alert(err.message);
      server.closeWindow();
      // $rootScope.$loader.hide();
      // $rootScope.$msAlert.show('Server Error', err.message, function() {
      //   server.closeWindow();
      // });
    });

    // handle server start
    server.onServerStarted(function() {
      console.log('Server Started');
    });

    // handle server shutdown
    server.onServerShutdown(function() {
      // $rootScope.$loader.hide();
      console.log('Server Stopped');
    });

    // handle proxy start
    server.onProxyStart(function(msg) {
      $rootScope.$proxyServer = true;
      // $rootScope.$loader.hide();
      console.log(msg);
    });

    // handle proxy stop
    server.onProxyExit(function(msg) {
      // $rootScope.$loader.hide();
      console.log(msg);
    });

    // handle proxy error
    server.onProxyError(function(err) {
      // $rootScope.$loader.hide();
      // $rootScope.$msAlert.show('Proxy Server Error', err.message, function() {
      //   server.closeWindow();
      // });
      console.log(err);
    });

    var proxyListener = function(status) {
      $rootScope.$proxyServer = status;
    };

    $scope.toggleProxyServer = function() {
      $rootScope.$proxyServer = !$rootScope.$proxyServer;
      if (!$rootScope.$proxyServer) {
        return server.stopProxyServer();
      }
      server.startProxyServer(proxyListener);
    };

    // initialize application
    server.start();
    server.startProxyServer();
  }
]);
