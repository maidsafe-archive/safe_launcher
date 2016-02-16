/**
 * Loader directive
 */
window.safeLauncher.directive('mslLoader', function() {
  'use strict';
  return {
    replace: true,
    scope: {},
    restrict: 'E',
    templateUrl: 'views/components/loader.html'
  };
});
