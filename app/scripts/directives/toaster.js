/**
 * Toaster directive
 */
window.safeLauncher.directive('toaster', [ '$rootScope', '$interval', function($rootScope, $interval) {
  'use strict';
  var link = function(scope, ele, attr) {
    scope.rootScope = $rootScope;
    var isMouseOnTost = false;
    var timer  = null;
    scope.autoCallbackCount = 0;
    ele.bind('mouseenter', function() {
      isMouseOnTost = true;
    });

    ele.bind('mouseleave', function() {
      isMouseOnTost = false;
    });
    if (scope.payload.hasOption && scope.payload.autoCallbackIn) {
      scope.autoCallbackCount = scope.payload.autoCallbackIn;
      timer = $interval(function() {
        if (!scope.payload) {
          return;
        }
        scope.autoCallbackCount -= 1;
        scope.$applyAsync();
        if (scope.autoCallbackCount === 0) {
          scope.callback();
        }
      }, 1000);
    }
    if (!scope.payload.hasOption) {
      timer = $interval(function() {
        if (!scope.payload || isMouseOnTost) {
          return;
        }
        scope.callback();
      }, 2000);

      ele.on('$destroy', function() {
        $interval.cancel(timer);
      });
    }
  };

  return {
    replace: true,
    scope: {
      payload: '=payload',
      callback: '&callback'
    },
    restrict: 'E',
    templateUrl: 'views/common/toaster.html',
    link: link
  };
}
]);
