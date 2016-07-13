/**
 * User Controller
 */
window.safeLauncher.controller('userController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {
    $scope.LIST_ORDER_BY = {
      NAME: 'name',
      LAST_ACTIVE: 'last_active'
    };
    $scope.logFilter = [
      'IN_PROGRESS',
      'SUCCESS',
      'FAILURE'
    ];
    var requestQueue = [];
    var isAuthReqProcessing = false;

    var showConfirmation = function() {
      var checkRequestQueue = function() {
        isAuthReqProcessing = false;
        showConfirmation();
      };
      if (isAuthReqProcessing || requestQueue.length === 0) {
        return;
      }
      isAuthReqProcessing = true;
      $rootScope.$authReq.show(requestQueue[0], function(err, status) {
        if (status) {
          // $rootScope.$loader.show();
        }
        console.log(requestQueue[0]);
        server.confirmResponse(requestQueue.shift(), status);
        checkRequestQueue();
      });
      $rootScope.$applyAsync();
    };

    var removeApplication = function(id) {
      for (var i in $rootScope.appList) {
        if ($rootScope.appList[i].id === id) {
          delete $rootScope.appList[i];
          break;
        }
      }
    };

    // handle auth request
    server.onAuthRequest(function(data) {
      console.log(data);
      server.focusWindow();
      requestQueue.push(data);
      showConfirmation();
    });

    // handle session creation
    server.onSessionCreated(function(session) {
      console.log('Session created :: ');
      $rootScope.appList[session.id] = {
        id: session.id,
        name: session.info.appName,
        version: session.info.appVersion,
        vendor: session.info.vendor,
        permissions: session.info.permissions.list,
        status: {},
        lastActive: null
      };
      $rootScope.$applyAsync();
    });

    // handle session removed
    server.onSessionRemoved(function(id) {
      console.log('Session removed :: ' + id);
      $rootScope.$toaster.show({
        msg: 'Revoked access ' + ($rootScope.appList[id] ? ('for ' + $rootScope.appList[id].name) : ''),
        hasOption: false,
        isError: false
      }, function(err, data) {
        console.log('Revoked application');
      });
      removeApplication(id);
    });

    // remove session
    $scope.removeSession = function(id) {
      $rootScope.currentAppDetails = null;
      $rootScope.$applyAsync();
      server.removeSession(id);
    };

    $scope.changeListOrder = function(order) {
      $scope.listOrderBy = order;
    };

    $scope.toggleFilter = function(name) {
      var index = $scope.logFilter.indexOf(name);
      if ( index !== -1) {
        return $scope.logFilter.splice(index, 1);
      }
      $scope.logFilter.unshift(name);
    };

    $scope.toggleAppDetails = function(id) {
      if (!id) {
        return $rootScope.currentAppDetails = null;
      }
      for(var i in $rootScope.appList) {
        if ($rootScope.appList[i].id === id) {
          $rootScope.currentAppDetails = $rootScope.appList[i];
          break;
        }
      }
      if ($rootScope.currentAppDetails) {
        server.getAppActivityList($rootScope.currentAppDetails.id, function(data) {
          $rootScope.currentAppDetails['logs'] = {};
          for(var i in data) {
            $rootScope.currentAppDetails.logs[data[i].activityId] = data[i];
            $rootScope.currentAppDetails.logs[data[i].activityId]['name'] = $rootScope.currentAppDetails.appName;
          }
        });
      }
    };

    $rootScope.clearIntervals();
    $scope.fetchStatsForAuthorisedClient();
    $scope.updateUserAccount();
    $scope.pollUserAccount();
  }
]);
