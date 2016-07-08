/**
 * Dashboard Controller
 */
window.safeLauncher.controller('dashboardController', [ '$scope', '$state', '$rootScope', '$interval', 'serverFactory',
  function($scope, $state, $rootScope, $interval, server) {
    $scope.logFilter = [];
    $scope.dashData = {
      getsCount: 0,
      deletesCount: 0,
      postsCount: 0,
    };
    var FETCH_DELAY = 2000;
    $interval(function() {
       server.fetchGetsCount(function(err, data) {
         if (data) {
           $scope.dashData.getsCount = data;
         }
       });
       server.fetchDeletesCount(function(err, data) {
         if (data) {
           $scope.dashData.deletesCount = data;
         }
       });
       server.fetchPostsCount(function(err, data) {
         if (data) {
           $scope.dashData.postsCount = data;
         }
       });
    }, FETCH_DELAY);
  }
]);
