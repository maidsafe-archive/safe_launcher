/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {

    // handle server error
    server.onServerError(function(err) {
      $rootScope.$loader.hide();
      $rootScope.$msAlert.show('Server Error', err.message, function() {
        server.closeWindow();
      });
    });

    // handle server start
    server.onServerStarted(function() {
      console.log('Server Started');
    });

    // handle server shutdown
    server.onServerShutdown(function() {
      $rootScope.$loader.hide();
      console.log('Server Stopped');
    });

    // handle proxy start
    server.onProxyStart(function(msg) {
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
      $rootScope.$msAlert.show('Proxy Server Error', err.message, function() {
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
