/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope', '$interval', '$timeout', 'serverFactory', 'CONSTANTS',
  function($scope, $state, $rootScope, $interval, $timeout, server, CONSTANTS) {
    var completeCount = 0;
    var collectedData = {
      GET: {
        oldVal: 0,
        newVal: 0
      },
      POST: {
        oldVal: 0,
        newVal: 0
      },
      PUT: {
        oldVal: 0,
        newVal: 0
      },
      DELETE: {
        oldVal: 0,
        newVal: 0
      }
    };
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

    var updateActivity = function(data) {
      var logKeys = Object.keys($rootScope.logList);
      if (logKeys.length >= CONSTANTS.LOG_LIST_LIMIT) {
        var lastkey = logKeys.pop();
        delete $rootScope.logList[lastkey];
      }
      data.activity['appName'] = data.app ? $rootScope.appList[data.app].name : 'Unauthorised Application';
      $rootScope.logList[data.activity.activityId] = data.activity;
      if ($rootScope.currentAppDetails) {
        $rootScope.currentAppDetails['logs'][data.activity.activityId] = data.activity;
      }
      if (data.app) {
          $rootScope.appList[data.app].status = data.activity;
      }
      $rootScope.$applyAsync();
    };

    var proxyListener = function(status) {
      $rootScope.$proxyServer = status;
    };

    var onComplete = function(target, oldVal, newVal) {
      collectedData[target]['oldVal'] = oldVal;
      collectedData[target]['newVal'] = newVal;
      var temp = {};
      if (completeCount === 4) {
        temp.GET = collectedData.GET.newVal - collectedData.GET.oldVal;
        temp.POST = collectedData.POST.newVal - collectedData.POST.oldVal;
        temp.PUT = collectedData.PUT.newVal - collectedData.PUT.oldVal;
        temp.DELETE = collectedData.DELETE.newVal - collectedData.DELETE.oldVal;
        completeCount = 0;
        $rootScope.dashData.authHTTPMethods.push(temp);
        if ($rootScope.dashData.authHTTPMethods.length > 50) {
          $rootScope.dashData.authHTTPMethods.splice(0, 1);
        }
        $rootScope.$applyAsync();
      }
    };

    // handle server error
    server.onServerError(function(err) {
      console.log(err);
      // TODO show loader
      $rootScope.$prompt.show({
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
      $rootScope.$toaster.show({
        msg: 'Proxy Server started',
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
      console.log(msg);
    });

    // handle proxy error
    server.onProxyError(function(err) {
      setProxy(false);
      $rootScope.$proxyServer = false;
      $rootScope.$toaster.show({
        msg: err.message,
        hasOption: false,
        isError: true
      }, function() {});

    });

    server.onNewAppActivity(function(data) {
      if (!data) {
        return;
      }
      console.log(data);
      updateActivity(data);
    });

    server.onUploadEvent(function(data) {
      if (!data) {
        return;
      }
      console.log(data);
      $rootScope.dashData.upload += data;
    });

    server.onDownloadEvent(function(data) {
      if (!data) {
        return;
      }
      console.log(data);
      $rootScope.dashData.download += data;
    });

    server.onUpdatedAppActivity(function(data) {
      if (!data) {
        return;
      }
      console.log(data);
      updateActivity(data);
    });

    $scope.fetchStatsForUnauthorisedClient = function() {
      $rootScope.intervals.push($interval(function () {
        server.fetchGetsCount(function(err, data) {
          if (err) {
            return;
          }
          $rootScope.dashData.unAuthGET.push(data - $rootScope.dashData.getsCount);
          $rootScope.dashData.getsCount = data;
          if ($rootScope.dashData.unAuthGET.length > 50) {
            $rootScope.dashData.unAuthGET.splice(0, 1);
          }
          $rootScope.$applyAsync();
        });
      }, CONSTANTS.FETCH_DELAY));
    };

    $scope.fetchStatsForAuthorisedClient = function() {
      $rootScope.intervals.push($interval(function () {
        server.fetchGetsCount(function(err, data) {
          if (err) {
            return;
          }
          completeCount++;
          onComplete('GET', $rootScope.dashData.getsCount, data);
          $rootScope.dashData.getsCount = data;
        });
        server.fetchDeletesCount(function(err, data) {
          if (err) {
            return;
          }
          if ($rootScope.isAuthenticated) {
            completeCount++;
            onComplete('DELETE', $rootScope.dashData.deletesCount, data);
          }
          $rootScope.dashData.deletesCount = data;
        });
        server.fetchPostsCount(function(err, data) {
          if (err) {
            return;
          }
          completeCount++;
          onComplete('POST', $rootScope.dashData.postsCount, data);
          $rootScope.dashData.postsCount = data;
        });
        server.fetchPutsCount(function(err, data) {
          if (err) {
            return;
          }
          completeCount++;
          onComplete('PUT', $rootScope.dashData.putsCount, data);
          $rootScope.dashData.putsCount = data;
        });
        for (var i in $rootScope.appList) {
          var item = $rootScope.appList[i];
          $rootScope.appList[i].lastActive = window.moment(item.status.endTime || item.status.beginTime).fromNow()
        }
        $rootScope.dashData.accountInfoTimeString = window.moment($rootScope.dashData.accountInfoTime).fromNow(true);
        $rootScope.$applyAsync();
      }, CONSTANTS.FETCH_DELAY));
    };

    $scope.updateUserAccount = function () {
      server.getAccountInfo(function(err, data) {
        if (err) {
          return;
        }
        $rootScope.dashData.accountInfo = data;
        $rootScope.dashData.accountInfoTime = (new Date()).toLocaleString();
        $rootScope.dashData.accountInfoTimeString = window.moment().fromNow(true);
        $rootScope.dashData.accountInfoUpdateEnabled = false;
        $rootScope.$applyAsync();
        $timeout(function() {
          $rootScope.dashData.accountInfoUpdateEnabled = true;
          $rootScope.$applyAsync();
        }, CONSTANTS.ACCOUNT_INFO_UPDATE_TIMEOUT)
      });
    };

    $scope.pollUserAccount = function() {
      $rootScope.intervals.push($interval($scope.updateUserAccount, CONSTANTS.ACCOUNT_FETCH_INTERVAL));
    }

    $scope.toggleProxyServer = function() {
      $rootScope.$proxyServer = !$rootScope.$proxyServer;
      if (!$rootScope.$proxyServer) {
        return server.stopProxyServer();
      }
      server.startProxyServer(proxyListener);
    };

    $scope.enableProxySetting = function(status) {
      setProxy(status);
      if (status) {
        $scope.toggleProxyServer();
      }
      $state.go('app', {isFirstLogin: true});
    };

    $scope.checkProxy = function() {
      if ($state.params.hasOwnProperty('isFirstLogin') && $state.params.isFirstLogin) {
        return;
      }
      var proxy = getProxy();
      if (proxy && proxy.hasOwnProperty('status')) {
        if (proxy.status) {
          return $scope.toggleProxyServer();
        }
        return;
      }
      $state.go('splash');
    };

    $scope.openExternal= function(e, url) {
      e.preventDefault();
      server.openExternal(url);
    };

    window.msl.setNetworkStateChangeListener(function(state) {
      $rootScope.$networkStatus.show = true;
      $rootScope.$networkStatus.status = state;
      if ($rootScope.$networkStatus.status === window.NETWORK_STATE.CONNECTED
        && $rootScope.$state.current.name !== 'splash') {
        $scope.fetchStatsForUnauthorisedClient();
        $rootScope.$toaster.show({
          msg: 'Network connected',
          hasOption: false,
          isError: false
        }, function(err, data) {
          console.log(data);
        });
      }
      if ($rootScope.$networkStatus.status === window.NETWORK_STATE.DISCONNECTED
        && $rootScope.$state.current.name !== 'splash') {
        // $rootScope.clearIntervals();
        $rootScope.$toaster.show({
          msg: 'Network Disconnected. Retrying in ',
          hasOption: true,
          isError: true,
          autoCallbackIn: 10,
          opt: {
            name: "Retry Now"
          }
        }, function(err, data) {
          server.reconnectNetwork();
        });
      }
      console.log('Network status :: ' + state);
      $rootScope.$applyAsync();
    });

    // initialize application
    server.start();
  }
]);
