/**
 * Alert directive
 */
window.safeLauncher.directive('alert', [ '$rootScope', function($rootScope) {
  'use strict';
  return {
    replace: true,
    scope: {
      payload: '=payload',
      callback: '&callback'
    },
    restrict: 'E',
    templateUrl: 'views/common/prompt.html'
  };
}
]);
