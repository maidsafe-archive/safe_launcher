/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {

    // handle proxy localy
    var setProxy = function(status) {
      window.localStorage.setItem('proxy', JSON.stringify({status: Boolean(status)}));
    };
    var getProxy = function() {
      return JSON.parse(window.localStorage.getItem('proxy'));
    };
    var clearProxy = function() {
      window.localStorage.clear();
    };

    // handle server error
    server.onServerError(function(err) {
      console.log(err);
      // TODO show loader
      $rootScope.$alert.show($rootScope.ALERT_TYPE.PROMPT, {
        title: 'Server Error',
        msg: err.message
      }, function(err, data) {
        server.closeWindow();
      });
    });

    // handle server start
    server.onServerStarted(function() {
      console.log('Server started');
    });

    // handle server shutdown
    server.onServerShutdown(function() {
      // $rootScope.$loader.hide();
      console.log('Server Stopped');
    });

    // handle proxy start
    server.onProxyStart(function(msg) {
      $rootScope.$proxyServer = true;
      setProxy(true);
      $rootScope.$alert.show($rootScope.ALERT_TYPE.TOASTER, {
        msg: msg,
        hasOption: false,
        isError: false
      }, function(err, data) {
        console.log(data);
      });
    });

    // handle proxy stop
    server.onProxyExit(function(msg) {
      // $rootScope.$loader.hide();
      $rootScope.$proxyServer = false;
      setProxy(false);
      console.log(msg);
    });

    // handle proxy error
    server.onProxyError(function(err) {
      setProxy(false);
      $rootScope.$proxyServer = false;
      $rootScope.$alert.show($rootScope.ALERT_TYPE.TOASTER, {
        msg: err.message,
        hasOption: false,
        isError: true
      }, function(err, data) {
        console.log(data);
        server.closeWindow();
      });
      console.log(err);
    });

    window.msl.setNetworkStateChangeListener(function(state) {
      $rootScope.$networkStatus.show = true;
      $rootScope.$networkStatus.status = state;
      if ($rootScope.$networkStatus.status === 1) {
        $rootScope.$alert.show($rootScope.ALERT_TYPE.TOASTER, {
          msg: 'Network connected',
          hasOption: false,
          isError: false
        }, function(err, data) {
          console.log(data);
        });
      }
      if ($rootScope.$networkStatus.status === window.NETWORK_STATE.DISCONNECTED) {
        $rootScope.$alert.show($rootScope.ALERT_TYPE.TOASTER, {
          msg: 'Network Error',
          hasOption: true,
          isError: true,
          opt: {
            name: "Retry Now",
            err: null,
            data: true
          }
        }, function(err, data) {
          server.reconnectNetwork();
        });
      }
      console.log('Network status :: ' + state);
      $rootScope.$applyAsync();
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

    $scope.enableProxySetting = function(status) {
      setProxy(status);
      $rootScope.$proxyServer = Boolean(status);
      $state.go('app');
    };

    $scope.checkProxy = function() {
      var proxy = getProxy();
      if (proxy && proxy.hasOwnProperty('status')) {
        $rootScope.$proxyServer = proxy.status;
        $state.go('app');
      }
    }
    // initialize application
    server.start();
    // server.startProxyServer();
  }
]);
