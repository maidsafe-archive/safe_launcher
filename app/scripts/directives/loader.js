/**
 * Loader directive
 */
window.safeLauncher.directive('mslLoader', function() {
  'use strict';
  return {
    replace: true,
    scope: {},
    restrict: 'E',
    templateUrl: 'views/components/loader.html',
    controller: [ '$scope', 'LoaderFactory', function($scope, Loader) {
      $scope.show = false;
      $scope.api = Loader;
      var toggleDisplay = function() {
        $scope.show = !!($scope.api.loading);
      };
      $scope.$watch('api.loading', toggleDisplay, true);
    } ]
  };
});
