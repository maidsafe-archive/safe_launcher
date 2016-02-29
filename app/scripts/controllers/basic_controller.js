/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {

    // handle server error
    server.onServerError(function(error) {
      $rootScope.$msAlert.show('Server Error', error.message, function() {
        server.closeWindow();
      });
    });

    // handle server start
    server.onServerStarted(function() {
      console.log('Server Started');
    });

    // handle server shutdown
    server.onServerShutdown(function() {
      console.log('Server Stopped');
    });

    // initialize application
    $scope.initApplication = function() {
      server.start();
      $rootScope.$loader.show();
      server.startProxyServer(function(status) {
        console.log('Proxy Server Started');
        $rootScope.$loader.hide();
        $rootScope.$proxyServer = status;
      });
    };
  }
]);
