/**
 * Validate Password
 */
window.safeLauncher.directive('mslValidatePassword', function() {
  var link = function(scope, element, attrs, controller) {
    element.bind('blur', function() {
      var value = element.val();
      var inpName = angular.element(element[0]).attr('name');
      var formName = element[0].form.name;
      var form = scope[formName][inpName];
      form.$setValidity('customValidation', false);
      element.addClass('ng-invalid');
      if (!value) {
        return scope.showErrorMsg(element, 'Cannot be left blank');
      }
      if (!(new RegExp(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/i)).test(value)) {
        return scope.showErrorMsg(element, 'Must be alphanumeric');
      }
      if (value.length < 6) {
        return scope.showErrorMsg(element, 'Must be 6 characters long');
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
