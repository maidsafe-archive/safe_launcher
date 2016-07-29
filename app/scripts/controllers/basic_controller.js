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
    var updateAccountInfoTimer = null;
    var LOCAL_STORAGE_KEYS = {
      PROXY: 'proxy',
      version: 'version'
    };
    eventRegistry.init();

    $rootScope.showIntroPage = false;
    var previousVersion = window.localStorage.getItem('version');
    var currentVersion = require('./package').version;
    if (previousVersion === null || previousVersion !== currentVersion) {
      $rootScope.showIntroPage = true;
      window.localStorage.setItem('version', currentVersion);
    }

    // handle proxy localy
    $rootScope.setProxy = function(status) {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.PROXY, JSON.stringify({status: Boolean(status)}));
    };

    $rootScope.getProxy = function() {
      return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEYS.PROXY));
    };

    $rootScope.clearLocalStorage = function() {
      window.localStorage.clear();
    };

    var startAccountUpdateTimer = function() {
      var currentTime = 0;
      var dateDiff = 0;
      updateAccountInfoTimer = $interval(function() {
        currentTime = new Date();
        dateDiff = window.moment.duration(window.moment(currentTime).diff($rootScope.dashData.accountInfoTime)).asSeconds();
        dateDiff = Math.floor(dateDiff);
        if (dateDiff <= 120) {
          var secondsLeft = 120 - dateDiff;
          var min = Math.floor(secondsLeft / 60);
          var sec = secondsLeft - (min * 60);
          sec = ('0' + sec).slice(-2);
          $rootScope.dashData.accountInfoUpdateTimeLeft = '0' + min + ':' + sec ;
          $rootScope.$applyAsync();
        } else {
          $interval.cancel(updateAccountInfoTimer);
        }
      }, 1000);
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

    var loadProxybasedOnSettings = function() {
      var proxy = $rootScope.getProxy();
      if (!(proxy && proxy.hasOwnProperty('status'))) {
        return
      }
      if (proxy.status === $rootScope.$proxyServer) {
        return;
      }
      if (proxy.status) {
        server.startProxyServer(proxyListener);
      } else {
        server.stopProxyServer();
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
        $rootScope.dashData.accountInfoTimeString = window.moment($rootScope.dashData.accountInfoTime).fromNow();
        $rootScope.$applyAsync();
      }, CONSTANTS.FETCH_DELAY));
    };

    $scope.updateUserAccount = function () {
      startAccountUpdateTimer();
      $rootScope.accountInfoLoading = true;
      server.getAccountInfo(function(err, data) {
        $rootScope.accountInfoLoading = false;
        if (err) {
          return;
        }
        $rootScope.dashData.accountInfo = data;
        $rootScope.dashData.accountInfoTime = new Date();
        $rootScope.dashData.accountInfoTimeString = window.moment().fromNow();
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
        $rootScope.setProxy($rootScope.$proxyServer);
        return server.stopProxyServer();
      }
      server.startProxyServer(proxyListener);
    };

    $scope.openExternal= function(e, url) {
      e.preventDefault();
      server.openExternal(url);
    };

    $scope.configureProxySetting = function(status) {
      $rootScope.setProxy(status);
      if (status) {
        $scope.toggleProxyServer();
      }
      return $state.go('app.account', {currentPage: 'register'});
    };

    $scope.reconnectNetwork = function(user) {
      $rootScope.$networkStatus.status = window.NETWORK_STATE.CONNECTING;
      server.reconnectNetwork(user);
    };

    window.msl.setNetworkStateChangeListener(function(state) {
      if (state === window.NETWORK_STATE.CONNECTED) {
        if ($state.current.name === 'splash' || $state.current.name === '') {
          $rootScope.getProxy() && $rootScope.getProxy().hasOwnProperty('status') ?
            ($rootScope.showIntroPage ? $state.go('app.account', {currentPage: 'register'}) : $state.go('app')) : $state.go('initProxy');
        }
        if ($rootScope.isAuthenticated) {
          $rootScope.clearIntervals();
          $scope.fetchStatsForAuthorisedClient();
          $scope.updateUserAccount();
          $scope.pollUserAccount();
        } else {
          loadProxybasedOnSettings();
          $scope.fetchStatsForUnauthorisedClient();
        }
        $rootScope.retryCount = 1;
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
      } else if (state === window.NETWORK_STATE.DISCONNECTED) {
        $rootScope.$networkStatus.status = state;
        $rootScope.clearIntervals();
        if ($rootScope.$state.current.name !== 'splash' && $rootScope.$state.current.name  !== '') {
          $rootScope.$toaster.show({
            msg: 'Network Disconnected. Retrying in ',
            hasOption: true,
            isError: true,
            autoCallbackIn: Math.min(CONSTANTS.RETRY_NETWORK_INIT_COUNT * $rootScope.retryCount, CONSTANTS.RETRY_NETWORK_MAX_COUNT),
            opt: {
              name: "Retry Now"
            }
          }, function(err, data) {
            $rootScope.retryCount *= 2;
            $rootScope.$networkStatus.status = window.NETWORK_STATE.CONNECTING;
            $rootScope.$toaster.show({
              msg: 'Trying to reconnnect to the network',
              hasOption: false,
              isError: false
            }, function(err, data) {});
            $scope.reconnectNetwork($rootScope.userInfo);
          });
        }
      } else if (state === window.NETWORK_STATE.CONNECTING) {
        $rootScope.$networkStatus.status = state;
      }
      console.log('Network status :: ' + state);
      $rootScope.$applyAsync();
    });

    // initialize application
    server.start();
  }
]);
