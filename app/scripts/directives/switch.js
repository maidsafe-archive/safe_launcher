/**
 * Switch directive
 */
 'use strict';
window.safeLauncher.directive('mslSwitch', function() {
  var link = function(scope, element, attrs) {
    var switchState = {
      "open": true,
      "close": false
    };
    scope.switchId = attrs.switchId;
    scope.isChecked = switchState[attrs.state];
    scope.toggleSwitch = function() {
      scope.isChecked = !scope.isChecked;
    }
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
