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
    var process = function() {
      if (scope.payload.hasOption && (scope.payload.autoCallbackIn > 0)) {
        scope.autoCallbackCount = scope.payload.autoCallbackIn;
        timer = $interval(function() {
          if (!scope.payload) {
            return;
          }
          scope.autoCallbackCount -= 1;
          scope.$applyAsync();
          if (scope.autoCallbackCount === 0) {
            $interval.cancel(timer);
            scope.callback();
          }
        }, 1000);
      }
      if (!scope.payload.hasOption) {
        timer = $interval(function() {
          if (!scope.payload || isMouseOnTost) {
            return;
          }
          $interval.cancel(timer);
          scope.callback();
        }, 2000);
      }
    };
    // attr.$observe('payload', function() {
    //   if (!scope.payload) {
    //     return;
    //   }
    //   process();
    // })
    scope.$watch('payload', function() {
      if (!scope.payload) {
        return;
      }
      process();
    })
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
