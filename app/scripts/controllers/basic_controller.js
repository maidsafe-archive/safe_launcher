/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope', '$interval', 'serverFactory', 'CONSTANTS',
  function($scope, $state, $rootScope, $interval, server, CONSTANTS) {

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
        console.log('Proxy Server started');
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

    var updateActivity = function(data) {
      var logKeys = Object.keys($rootScope.logList);
      if (logKeys.length >= CONSTANTS.LOG_LIST_LIMIT) {
        var lastkey = logKeys.pop();
        delete $rootScope.logList[lastkey];
      }
      if (!data.app) {
        return;
      }
      var ACTIVITY_STATUS = {
        0: 'IN_PROGRESS',
        1: 'SUCCESS',
        '-1': 'FAILURE'
      };
      $rootScope.logList[data.activity.activityId] = {
        name: $rootScope.appList[data.app].name,
        req: data.activity.activityName,
        time: data.activity.beginTime,
        status: ACTIVITY_STATUS[data.activity.activityStatus]
      };
      $rootScope.appList[data.app].status = data.activity;
    };

    server.onNewAppActivity(function(data) {
      if (!data) {
        return;
      }
      console.log(data);
      updateActivity(data);
    });

    server.onUpdatedAppActivity(function(data) {
      if (!data) {
        return;
      }
      console.log(data);
      updateActivity(data);
    });

    $interval(function() {
      server.fetchGetsCount(function(err, data) {
        if (data) {
          $rootScope.dashData.getsCount = data;
        }
      });
      server.fetchDeletesCount(function(err, data) {
        if (data) {
          $rootScope.dashData.deletesCount = data;
        }
      });
      server.fetchPostsCount(function(err, data) {
        if (data) {
          $rootScope.dashData.postsCount = data;
        }
      });
      for (var i in $rootScope.appList) {
        var item = $rootScope.appList[i];
        $rootScope.appList[i].lastActive = window.moment(item.status.endTime || item.status.beginTime).fromNow(true)
      }
    }, CONSTANTS.FETCH_DELAY);

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
        return $state.go('app');
      }
      $state.go('splash');
    }
    // initialize application
    server.start();
    // server.startProxyServer();
  }
]);
