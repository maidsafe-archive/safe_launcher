/**
 * Authorise request directive
 */
window.safeLauncher.directive('authoriseReq', [ '$rootScope', function($rootScope) {
  'use strict';
  var link = function(scope, ele, attr) {
    scope.rootScope = $rootScope;
  };

  return {
    replace: true,
    scope: {
      payload: '=payload',
      callback: '&callback'
    },
    restrict: 'E',
    templateUrl: 'views/common/auth_request.html',
    link: link
  };
}
]);
