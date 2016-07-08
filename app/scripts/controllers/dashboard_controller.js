/**
 * Dashboard Controller
 */

window.safeLauncher.controller('dashboardController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  function($scope, $state, $rootScope, server) {
    $scope.logList = [
      {
        id: 'test.com',
        name: 'Demo App',
        req: 'Updating Dir',
        status: 'In_Progress',
        time: '00:05:02'
      },
      {
        id: 'test1.com',
        name: 'Demo App',
        req: 'Updating Dir',
        status: 'completed',
        time: '00:05:02'
      },
      {
        id: 'test2.com',
        name: 'Demo App',
        req: 'Updating Dir',
        status: 'error',
        time: '00:05:02'
      }
    ]
    $scope.logFilter = [];
  }
]);
