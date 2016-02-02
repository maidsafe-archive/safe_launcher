/**
 * User Controller
 */
window.safeLauncher.controller('UserController', [ '$scope', '$state',
  function($scope, $state) {
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

    $scope.toggleSetting = function(setting) {
      setting.status = !setting.status;
    };
  }
]);
