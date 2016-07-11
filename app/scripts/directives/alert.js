/**
 * Alert directive
 */
window.safeLauncher.directive('alert', [ '$rootScope', function($rootScope) {
  'use strict';
  var link = function(scope, ele, attr) {
    scope.rootScope = $rootScope;
  };

  return {
    replace: true,
    scope: {
      type: '=type',
      payload: '=payload',
      callback: '&callback'
    },
    restrict: 'E',
    templateUrl: 'views/common/alert.html',
    link: link
  };
}
]);
