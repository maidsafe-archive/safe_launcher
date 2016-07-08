/**
 * User Controller
 */
window.safeLauncher.controller('userController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {
    $scope.LIST_ORDER_BY = {
      NAME: 'name',
      LAST_ACTIVE: 'last_active'
    };
    $scope.listOrderBy = $scope.LIST_ORDER_BY.NAME;
    $scope.appList = [] ;
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
        server.confirmResponse(requestQueue.shift(), status);
        checkRequestQueue();
      });
      $rootScope.$applyAsync();
    };

    var removeApplication = function(id) {
      $scope.appList.forEach(function(list, index) {
        if (list.id === id) {
          $scope.appList.splice(index, 1);
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
      $scope.appList.push({
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
  }
]);
