/**
 * User Controller
 */
window.safeLauncher.controller('userController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {
    var LIST_COLORS = [ 'bg-light-green', 'bg-blue', 'bg-yellow', 'bg-pink', 'bg-purple', 'bg-green', 'bg-orange' ];
    $scope.confirmation = {
      status: false,
      data: {}
    };
    $scope.manageListApp = [];
    var isAuthReqProcessing = false;
    var requestQueue = [];

    var showConfirmation = function() {
      if (isAuthReqProcessing || requestQueue.length === 0) {
        return;
      }
      isAuthReqProcessing = true;
      data = requestQueue.pop();
      $scope.confirmation.status = true;
      $scope.confirmation.data.payload = data.payload;
      $scope.confirmation.data.request = data.request;
      $scope.confirmation.data.response = data.response;
      $scope.confirmation.data.permissions = data.permissions;
      $scope.$apply();
    };

    var hideConfirmation = function() {
      $scope.confirmation = {
        status: false,
        data: {}
      };
    };

    var checkRequestQueue = function() {
      isAuthReqProcessing = false;
      showConfirmation();
    };

    var removeApplication = function(id) {
      $scope.manageListApp.forEach(function(list, index) {
        if (list.id === id) {
          $scope.manageListApp.splice(index, 1);
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        }
      });
    };

    var proxyListener = function(status) {
      $rootScope.$loader.hide();
      $rootScope.$proxyServer = status;
    };

    // toggle proxy server
    var toggleProxyServer = function() {
      $rootScope.$proxyServer = !$rootScope.$proxyServer;
      $rootScope.$loader.show();
      if (!$rootScope.$proxyServer) {
        return server.stopProxyServer();
      }
      server.startProxyServer(proxyListener);
    };

    // handle session creation
    server.onSessionCreated(function(session) {
      console.log('Session created :: ');
      $scope.manageListApp.push({
        id: session.id,
        name: session.info.appName,
        version: session.info.appVersion,
        vendor: session.info.vendor,
        status: true,
        permissions: session.info.permissions.list
      });
      $rootScope.$loader.hide();
      $scope.$apply();
    });

    // handle session removed
    server.onSessionRemoved(function(id) {
      console.log('Session removed :: ' + id);
      removeApplication(id);
    });

    // handle auth request
    server.onAuthRequest(function(data) {
      console.log(data);
      server.focusWindow();
      requestQueue.push(data);
      showConfirmation();
    });

    // get list colors
    $scope.getListColor = function(index) {
      index = index % LIST_COLORS.length;
      return LIST_COLORS[index];
    };

    // Toggle Setting
    $scope.toggleSetting = function(setting) {
      setting.status = !setting.status;
    };

    $scope.confirmResponse = function(payload, status) {
      hideConfirmation();
      if (status) {
        $rootScope.$loader.show();
      }
      server.confirmResponse(payload, status);
      checkRequestQueue();
    };

    // toggle proxy server as public function
    $scope.toggleProxyServer = toggleProxyServer;

    // Parse authorise permissions
    $scope.parsePermission = function(str) {
      str = str.toUpperCase();
      str = str.replace(/_/g, ' ');
      return str;
    };

    // remove session
    $scope.removeSession = function(id) {
      server.removeSession(id);
    };
  }
]);
