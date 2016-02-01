/**
 * Tab directive
 */
window.safeLauncher.directive('mslTabs', function() {
  return {
    scope: true,
    replace: true,
    restrict: 'E',
    transclude: true,
    templateUrl: 'views/components/tabs.html',
    controller: function($scope) {
      $scope.currentTab = 0;
      $scope.tabs = [];
      $scope.selectTab = function(index) {
        $scope.currentTab = index;
      };
      return $scope;
    }
  };
});

window.safeLauncher.directive('mslTab', function() {
  var link = function(scope, element, attrs, mslTabs) {
    var tabId = mslTabs.tabs.length;
    scope.showTab = function() {
      return tabId === mslTabs.currentTab;
    };
    var obj = {
      heading: attrs.tabHeading,
      icon: attrs.tabIcon
    };
    mslTabs.tabs.push(obj);
  };

  return {
    require: '^mslTabs',
    scope: true,
    replace: true,
    restrict: 'E',
    transclude: true,
    template: '<div class="msl-frame-cntr-b" ng-show="showTab()" ng-transclude></div>',
    link: link
  };
});
