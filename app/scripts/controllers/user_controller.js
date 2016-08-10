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

    // remove session
    $scope.removeSession = function(id) {
      $rootScope.currentAppDetails = {
        logs: []
      };
      var logIndex = $rootScope.logList.map(function(obj) { return obj.activityId; }).indexOf(id);
      $rootScope.logList[logIndex] = {
        appName: $rootScope.appList[id].name,
        activityName: 'Revoke app',
        activityStatus: 1,
        beginTime: (new Date()).getTime()
      };
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
        return $rootScope.currentAppDetails = {
          logs: []
        };
      }
      for(var i in $rootScope.appList) {
        if ($rootScope.appList[i].id === id) {
          $rootScope.currentAppDetails['app'] = $rootScope.appList[i];
          break;
        }
      }
      if ($rootScope.currentAppDetails) {
        server.getAppActivityList($rootScope.currentAppDetails.app.id, function(data) {
          $rootScope.currentAppDetails.logs = [];
          for(var i in data) {
            data[i]['name'] = $rootScope.currentAppDetails.app.appName;
            $rootScope.currentAppDetails.logs.unshift(data[i]);
          }
        });
      }
    };

    $scope.logout = function() {
      window.msl.clearAllSessions();
      $rootScope.clearIntervals();
      $rootScope.resetStats();
      $rootScope.resetAppStates();
      server.stopProxyServer();
      window.msl.networkStateChange(0);
      server.reconnectNetwork();      
      $state.go('app.account', {
        currentPage: 'login'
      });
    };
  }
]);
