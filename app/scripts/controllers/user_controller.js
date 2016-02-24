/**
 * User Controller
 */
window.safeLauncher.controller('userController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {
    var LIST_COLORS = [ 'bg-light-green', 'bg-blue', 'bg-yellow', 'bg-pink', 'bg-purple', 'bg-green', 'bg-orange' ];
    $scope.proxyState = false;
    $scope.confirmation = {
      status: false,
      data: {}
    };
    $scope.manageListApp = [];

    var Loader = {
      show: function() {
        $rootScope.$loader = true;
      },
      hide: function() {
        $rootScope.$loader = false;
        if (!$rootScope.$$phase) {
          $rootScope.$apply();
        }
      }
    };

    var showConfirmation = function(data) {
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
      Loader.hide();
      $scope.proxyState = status;
    };

    // toggle proxy server
    var toggleProxyServer = function() {
      $scope.proxyState = !$scope.proxyState;
      Loader.show();
      if (!$scope.proxyState) {
        return server.stopProxyServer();
      }
      server.startProxyServer(proxyListener);
    };

    // start server
    server.start();

    // start proxy server
    toggleProxyServer();

    // handle server error
    server.onServerError(function(error) {
      console.error(error);
    });

    // handle server start
    server.onServerStarted(function() {
      console.log('Server Started');
    });

    // handle server shutdown
    server.onServerShutdown(function() {
      console.log('Server Stopped');
    });

    // handle session creation
    server.onSessionCreated(function(session) {
      console.log('Session created :: ');
      $scope.manageListApp.push({
        id: session.id,
        name: session.info.appName,
        version: session.info.appVersion,
        vendor: session.info.vendor,
        status: true,
        permissions: session.info.permissions
      });
      Loader.hide();
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
      server.restoreWindow();
      showConfirmation(data);
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
        Loader.show();
      }
      server.confirmResponse(payload, status);
    };

    // toggle proxy server as public function
    $scope.toggleProxyServer = toggleProxyServer;

    // Parse authorise permissions
    $scope.parsePermission = function(str) {
      str = str.toLowerCase();
      str = str.replace(/_/g, ' ');
      str = str[0].toUpperCase() + str.slice(1);
      return str;
    };

    // remove session
    $scope.removeSession = function(id) {
      server.removeSession(id);
    };
  }
]);
