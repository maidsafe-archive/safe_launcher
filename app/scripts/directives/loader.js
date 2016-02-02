/**
 * Loader directive
 */
window.safeLauncher.directive('mslLoader', function() {
  'use strict';
  return {
    scope: {},
    replace: true,
    restrict: 'E',
    templateUrl: 'views/components/loader.html',
    controller: ['$scope', 'LoaderFactory', function($scope, Loader) {
      $scope.show = false;
      $scope.api = Loader;
      $scope.$watch('api.loading', toggledisplay);
      function toggledisplay() {
        $scope.show = !!($scope.api.loading);
      };
    }]
  };
});
