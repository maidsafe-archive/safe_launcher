/**
 * User Controller
 */
window.safeLauncher.controller('userController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  'eventRegistrationFactory', function($scope, $state, $rootScope, server, eventFactory) {
    $scope.LIST_ORDER_BY = {
      NAME: 'name',
      LAST_ACTIVE: 'last_active'
    };
    $scope.logFilter = [
      'IN_PROGRESS',
      'SUCCESS',
      'FAILURE'
    ];

    $scope.currentAppDetails = {
      logs: []
    };
    $scope.logList = eventFactory.logList;
    $scope.appList = eventFactory.appList;
    // remove session
    $scope.removeSession = function(id) {
      $scope.currentAppDetails = {
        logs: []
      };
      var logIndex = eventFactory.logList.map(function(obj) {
        return obj.activityId;
      }).indexOf(id);
      eventFactory.logList[logIndex] = {
        appName: $scope.appList[id].name,
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
      if (index !== -1) {
        return $scope.logFilter.splice(index, 1);
      }
      $scope.logFilter.unshift(name);
    };

    $scope.toggleAppDetails = function(id) {
      if (!id) {
        $scope.currentAppDetails = {
          logs: []
        };
        eventFactory.currentAppDetails = null;
        return;
      }
      $scope.currentAppDetails = eventFactory.currentAppDetails = {
        logs: []
      };
      for (var i in $scope.appList) {
        if ($scope.appList[i].id === id) {
          $scope.currentAppDetails.app = $scope.appList[i];
          break;
        }
      }
      if ($scope.currentAppDetails) {
        server.getAppActivityList($scope.currentAppDetails.app.id, function(data) {
          $scope.currentAppDetails.logs = [];
          for (var i in data) {
            data[i].name = $scope.currentAppDetails.app.appName;
            $scope.currentAppDetails.logs.unshift(data[i]);
          }
          $rootScope.logListComponent.update($scope.currentAppDetails.logs);
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
