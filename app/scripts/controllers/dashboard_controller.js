/**
 * Dashboard Controller
 */
window.safeLauncher.controller('dashboardController', [ '$scope', '$state', '$rootScope', '$interval', 'serverFactory',
  function($scope, $state, $rootScope, $interval, server) {
    window.Dashboard = $scope;
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
    timer = $interval(function() {
      currentTime = new Date();
      dateDiff = window.moment.duration(window.moment(currentTime).diff($rootScope.dashData.accountInfoTime)).asSeconds();
      dateDiff = Math.floor(dateDiff);
      if (dateDiff <= 120) {
        var secondsLeft = 120 - dateDiff;
        var min = Math.floor(secondsLeft / 60);
        var sec = secondsLeft - (min * 60);
        sec = ('0' + sec).slice(-2);
        $rootScope.dashData.accountInfoUpdateTimeLeft = '0' + min + ':' + sec ;
        $rootScope.$applyAsync();
      }
    }, 1000);
  }
]);
