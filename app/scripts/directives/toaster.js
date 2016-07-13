/**
 * Toaster directive
 */
window.safeLauncher.directive('toaster', [ '$rootScope', '$interval', function($rootScope, $interval) {
  'use strict';
  var link = function(scope, ele, attr) {
    scope.rootScope = $rootScope;
    var isMouseOnTost = false;
    var timer  = null;
    ele.bind('mouseenter', function() {
      isMouseOnTost = true;
    });

    ele.bind('mouseleave', function() {
      isMouseOnTost = false;
    });

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
