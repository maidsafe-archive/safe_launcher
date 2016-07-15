/**
 * Dashboard Controller
 */
window.safeLauncher.controller('dashboardController', [ '$scope', '$state', '$rootScope', '$interval', 'serverFactory',
  function($scope, $state, $rootScope, $interval, server) {
    var currentTime = 0;
    var dateDiff = 0;
    $scope.logFilter = [
      'IN_PROGRESS',
      'SUCCESS',
      'FAILURE'
    ];
    $scope.toggleFilter = function(name) {
      var index = $scope.logFilter.indexOf(name);
      if ( index !== -1) {
        return $scope.logFilter.splice(index, 1);
      }
      $scope.logFilter.unshift(name);
    };    
  }
]);
