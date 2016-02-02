/**
 * Validate PIN
 */
window.safeLauncher.directive('mslValidatePin', function() {
  var link = function(scope, element, attrs, controller) {
    element.bind('blur', function() {
      var value = element.val();
      var inpName = angular.element(element[0]).attr('name');
      var formName = element[0].form.name;
      var form = scope[formName][inpName];
      form.$setValidity('customValidation', false);
      if(!value) {
        scope.showErrorMsg(element, 'PIN cannot be empty');
        return;
      }
      if (isNaN(value)) {
        scope.showErrorMsg(element, 'PIN must be only digits');
        return;
      }
      if (value.length < 4) {
        scope.showErrorMsg(element, 'Minimum PIN length should be four digits');
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
