/**
 * User Controller
 */
window.safeLauncher.controller('userController', [ '$scope', '$state', '$rootScope', '$interval', 'serverFactory',
  function($scope, $state, $rootScope, $interval, server) {
    $scope.LIST_ORDER_BY = {
      NAME: 'name',
      LAST_ACTIVE: 'last_active'
    };
    $scope.currentAppDetails = {};
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
      $rootScope.$alert.show($rootScope.ALERT_TYPE.AUTH_REQ, requestQueue[0], function(err, status) {
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
      $rootScope.appList.forEach(function(list, index) {
        if (list.id === id) {
          $rootScope.appList.splice(index, 1);
          $scope.$applyAsync();
        }
      });
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
      $rootScope.appList.push({
        id: session.id,
        name: session.info.appName,
        version: session.info.appVersion,
        vendor: session.info.vendor,
        permissions: session.info.permissions.list
      });
      $scope.$apply();
    });

    // handle session removed
    server.onSessionRemoved(function(id) {
      console.log('Session removed :: ' + id);
      removeApplication(id);
    });

    // remove session
    $scope.removeSession = function(id) {
      server.removeSession(id);
    };

    $scope.changeListOrder = function(order) {
      $scope.listOrderBy = order;
    };

    $scope.toggleAppDetails = function(id) {
      if (!id) {
        return $scope.currentAppDetails = null;
      }
      for(var i in $rootScope.appList) {
        if ($rootScope.appList[i].id === id) {
          $scope.currentAppDetails = $rootScope.appList[i];
          break;
        }
      }
    };
  }
]);
