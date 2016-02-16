/**
 * User Controller
 */
window.safeLauncher.controller('UserController', [ '$scope', '$state', '$rootScope', 'ServerFactory',
  function($scope, $state, $rootScope, Server) {
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

    var showConfirmation  = function(data) {
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

    // start server
    Server.start();

    // handle server error
    Server.onServerError(function(error) {
      console.error(error);
    });

    // handle server start
    Server.onServerStarted(function() {
      console.log('Server Started');
    });

    // handle server shutdown
    Server.onServerShutdown(function() {
      console.log('Server Stopped');
    });

    // handle session creation
    Server.onSessionCreated(function(session) {
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
    Server.onSessionRemoved(function(id) {
      console.log('Session removed :: ' + id);
      removeApplication(id);
    });

    // handle auth request
    Server.onAuthRequest(function(data) {
      console.log(data);
      Server.restoreWindow();
      showConfirmation(data);
    });

    // Toggle Setting
    $scope.toggleSetting = function(setting) {
      setting.status = !setting.status;
    };

    $scope.confirmResponse = function(payload, status) {
      hideConfirmation();
      Loader.show();
      Server.confirmResponse(payload, status);
    };

    // toggle proxy server
    $scope.toggleProxyServer = function() {
      $scope.proxyState = !$scope.proxyState;
      Loader.show();
      if (!$scope.proxyState) {
        Server.stopProxyServer();
        Loader.hide();
        return;
      }
      Server.startProxyServer(function(msg) {
        Loader.hide();
        console.log(msg);
      });
    };

    // Parse authorise permissions
    $scope.parsePermission = function(str) {
      str = str.toLowerCase();
      str = str.replace(/_/g, " ");
      str = str[0].toUpperCase() + str.slice(1);
      return str;
    };

    // remove session
    $scope.removeSession = function(id) {
      Server.removeSession(id);
    }
  }
]);
