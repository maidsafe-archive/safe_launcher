/**
 * User Controller
 */
window.safeLauncher.controller('UserController', [ '$scope', '$state', 'ServerFactory',
  function($scope, $state, Server) {
    $scope.manageList = [
      {
        name: 'Proxy',
        settings: [
          {
            name: 'SAFE Proxy',
            status: true
          }
        ]
      },
      {
        name: 'Apps',
        settings: [
          {
            name: 'Calender',
            status: false
          }
        ]
      }
    ];

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
      console.log('Session created :: ', session);
    });

    // handle session removed
    Server.onSessionRemoved(function(id) {
      console.log('Session removed :: ' + id);
    });

    // Toggle Setting
    $scope.toggleSetting = function(setting) {
      setting.status = !setting.status;
    };
  }
]);
