/**
 * Validate Confirmation
 */
window.safeLauncher.directive('mslValidateConfirmation', function() {
  var link = function(scope, element, attrs, controller) {
    element.bind('blur', function() {
      var value = element.val();
      var inpName = angular.element(element[0]).attr('name');
      var formName = element[0].form.name;
      var form = scope[formName][inpName];
      form.$setValidity('customValidation', false);
      var targetName = attrs.targetName;
      var targetValue = scope[formName][targetName].$viewValue;
      if (value !== targetValue) {
        scope.showErrorMsg(element, "Values must match");
        return;
      }
      scope.hideErrorMsg(element);
      form.$setValidity('customValidation', true);
    });
  };
  return {
    restrict: 'A',
    link: link
  };
});
