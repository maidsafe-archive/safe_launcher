/**
 * Dashboard Controller
 */
window.safeLauncher.controller('dashboardController', [ '$scope', '$state', '$rootScope', 'serverFactory',
  'eventRegistrationFactory', function($scope, $state, $rootScope, server, eventFactory) {
    var currentTime = 0;
    var dateDiff = 0;
    $scope.logFilter = [
      'IN_PROGRESS',
      'SUCCESS',
      'FAILURE'
    ];
    $scope.toggleFilter = function(name) {
      var index = $scope.logFilter.indexOf(name);
      if (index !== -1) {
        return $scope.logFilter.splice(index, 1);
      }
      $scope.logFilter.unshift(name);
    };
    $scope.logList = eventFactory.logList;
  }
]);
