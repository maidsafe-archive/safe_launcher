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
      element.addClass('ng-invalid');
      if (!value) {
        scope.showErrorMsg(element, 'Cannot be left blank');
        return;
      }
      if (isNaN(value)) {
        scope.showErrorMsg(element, 'Must be numeric');
        return;
      }
      if (value.length < 4) {
        scope.showErrorMsg(element, 'Must be 4 characters long');
        return;
      }
      scope.hideErrorMsg(element);
      form.$setValidity('customValidation', true);
      form.$valid = true;
      form.$invalid = false;
    });
  };
  return {
    restrict: 'A',
    link: link
  };
});
