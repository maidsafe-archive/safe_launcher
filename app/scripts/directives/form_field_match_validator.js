// validate form fields on change
window.safeLauncher.directive('fieldMatchValidator', [ 'CONSTANTS', 'MESSAGES',
  function($constant, $msg) {
    'use strict';
    var onChange = function(scope, ele, attr, ctrl) {
      var msgEle = $(ele).siblings('.msg').children('.txt');
      var parent = $(ele).parent();
      var target = ctrl.$$parentForm[attr.target];
      var value = '';
      var resetField = function() {
        parent.removeClass('warn error');
        ctrl.$setValidity('fieldValidator', true);
        return msgEle.text('');
      }
      ele.bind('keyup', function(e) {
        ctrl.$setValidity('fieldValidator', false);
        parent.addClass('error');
        value = e.target.value;
        if (!value) {
          return resetField();
        }
        if (value !== target.$viewValue) {
          return msgEle.text($msg.ENTRIES_DONT_MATCH);
        }
        return resetField();
      });
    };

    return {
      restrict: 'A',
      require: '^?ngModel',
      link: onChange
    };
  }
]);
