/**
 * Validate Keyword
 */
window.safeLauncher.directive('mslValidateKeyword', function() {
  var link = function(scope, element, attrs, controller) {
    element.bind('blur', function() {
      var value = element.val();
      var inpName = angular.element(element[0]).attr('name');
      var formName = element[0].form.name;
      var form = scope[formName][inpName];
      form.$setValidity('customValidation', false);
      element.addClass('invalid');
      if (!value) {
        scope.showErrorMsg(element, 'Cannot be left blank');
        return;
      }
      if (!(new RegExp(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/i)).test(value)) {
        scope.showErrorMsg(element, 'Must be alphanumeric');
        return;
      }
      if (value.length < 6) {
        scope.showErrorMsg(element, 'Must be 6 characters long');
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
