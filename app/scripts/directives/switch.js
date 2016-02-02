/**
 * Switch directive
 */
window.safeLauncher.directive('mslSwitch', function() {
  'use strict';
  var link = function(scope, element, attrs) {
    scope.switchId = attrs.switchId;
  };
  return {
    scope: true,
    replace: true,
    restrict: 'E',
    transclude: true,
    templateUrl: 'views/components/switch.html',
    link: link
  };
});
