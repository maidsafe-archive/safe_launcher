// validate form fields on change
window.safeLauncher.directive('fieldMatchValidator', [ 'CONSTANTS', 'MESSAGES',
  function($constant, $msg) {
    'use strict';
    var onChange = function(scope, ele, attr, ctrl) {
      var msgEle = $(ele).siblings('.msg');
      var parent = $(ele).parent();
      var targetEle = angular.element(document.getElementsByName(ctrl.$$parentForm.$name)).find('input[name='+attr.target+']');
      var targetVal = targetEle.val();
      var value = '';
      var resetField = function() {
        parent.removeClass('error');
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
        if (value !== targetVal) {
          return msgEle.text($msg.ENTRIES_DONT_MATCH);
        }
        return resetField();
      });
      targetEle.bind('keyup', function(e) {
        targetVal = e.target.value;
        if (!value || !targetVal) {
          return;
        }
        ctrl.$setValidity('fieldValidator', false);
        parent.addClass('error');
        if (value !== targetVal) {
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
