// focus input field
window.safeLauncher.directive('focus', function($timeout) {
  return {
    link : function(scope, element, attr) {
      attr.$observe('focus', function(value) {
        if (value === "true") {
          $timeout(function() {
            element[0].focus();
          });
        }
      });
    }
  };
});
