/**
 * Basic Controller
 */
window.safeLauncher.controller('basicController', [ '$scope', '$state', '$rootScope',
  '$interval', '$timeout', 'serverFactory', 'CONSTANTS', 'eventRegistrationFactory',
  function($scope, $state, $rootScope, $interval, $timeout, server, CONSTANTS, eventRegistry) {
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
    eventRegistry.init();
    // handle proxy localy
    $rootScope.setProxy = function(status) {
      window.localStorage.setItem('proxy', JSON.stringify({status: Boolean(status)}));
    };
    $rootScope.getProxy = function() {
      return JSON.parse(window.localStorage.getItem('proxy'));
    };
    $rootScope.clearProxy = function() {
      window.localStorage.clear();
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
        $rootScope.dashData.accountInfoTime = new Date();
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
    };

    $scope.toggleProxyServer = function() {
      $rootScope.$proxyServer = !$rootScope.$proxyServer;
      if (!$rootScope.$proxyServer) {
        return server.stopProxyServer();
      }
      server.startProxyServer(proxyListener);
    };

    $scope.enableProxySetting = function(status) {
      $rootScope.setProxy(status);
      if (status) {
        $scope.toggleProxyServer();
      }
      $state.go('app', {isFirstLogin: true});
    };

    $scope.checkProxy = function() {
      if ($state.params.hasOwnProperty('isFirstLogin') && $state.params.isFirstLogin) {
        return;
      }
      var proxy = $rootScope.getProxy();
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
      if (state === window.NETWORK_STATE.CONNECTED) {
        if ($rootScope.isAuthenticated) {
          $rootScope.clearIntervals();
          $scope.fetchStatsForAuthorisedClient();
          $scope.updateUserAccount();
          $scope.pollUserAccount();
        } else {
          $scope.fetchStatsForUnauthorisedClient();
        }
        if ($rootScope.$networkStatus.status !== state) {
          $rootScope.$toaster.show({
            msg: 'Network connected',
            hasOption: false,
            isError: false
          }, function(err, data) {
            console.log(data);
          });
        }
        $rootScope.$networkStatus.status = state;
      } else if (state === window.NETWORK_STATE.DISCONNECTED
        && $rootScope.$state.current.name !== 'splash') {
        $rootScope.$networkStatus.status = state;
        $rootScope.clearIntervals();
        var retryCount = CONSTANTS.RETRY_NETWORK_INIT_COUNT * window.msl.retryCount;
        $rootScope.$toaster.show({
          msg: 'Network Disconnected. Retrying in ',
          hasOption: true,
          isError: true,
          autoCallbackIn: ((CONSTANTS.RETRY_NETWORK_MAX_COUNT >= retryCount) ? retryCount : CONSTANTS.RETRY_NETWORK_MAX_COUNT),
          opt: {
            name: "Retry Now"
          }
        }, function(err, data) {
          $rootScope.$toaster.show({
            msg: 'Trying to reconnnect to the network',
            hasOption: false,
            isError: false
          }, function(err, data) {});
          server.reconnectNetwork($rootScope.userInfo);
        });
      }
      console.log('Network status :: ' + state);
      $rootScope.$applyAsync();
    });

    // initialize application
    server.start();
  }
]);
