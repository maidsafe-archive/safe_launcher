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
      if (!value || isNaN(value)) {
        return;
      }
      if (value.length < 4) {
        return;
      }
      form.$setValidity('customValidation', true);
    });
  };
  return {
    restrict: 'A',
    link: link
  };
});
