/**
 * User Controller
 */
window.safeLauncher.controller('UserController', [ '$scope', '$state', 'ServerFactory',
  function($scope, $state, Server) {
    $scope.confirmation = {
      status: false,
      data: {}
    };
    $scope.manageListApp = [];

    var showConfirmation  = function(data) {
      $scope.confirmation.status = true;
      $scope.confirmation.data.payload = data.payload;
      $scope.confirmation.data.request = data.request;
      $scope.confirmation.data.response = data.response;
      $scope.$apply();
    };

    var hideConfirmation = function() {
      $scope.confirmation = {
        status: false,
        data: {}
      };
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
      $scope.$apply();
    });

    // handle session removed
    Server.onSessionRemoved(function(id) {
      console.log('Session removed :: ' + id);
    });

    // handle auth request
    Server.onAuthRequest(function(data) {
      console.log(data);
      showConfirmation(data);
    });

    // Toggle Setting
    $scope.toggleSetting = function(setting) {
      setting.status = !setting.status;
    };

    $scope.confirmResponse = function(payload, status) {
      hideConfirmation();
      Server.confirmResponse(payload, status);
    };
  }
]);
