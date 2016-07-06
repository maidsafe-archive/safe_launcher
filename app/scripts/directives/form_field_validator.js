// validate form fields on change
window.safeLauncher.directive('fieldValidator', [ 'CONSTANTS', 'MESSAGES',
  function($constant, $msg) {
    'use strict';
    var onChange = function(scope, ele, attr, ctrl) {
      var msgEle = $(ele).siblings('.msg').children('.txt');
      var parent = $(ele).parent();
      var value = '';
      var resetField = function() {
        parent.removeClass('warn');
        ctrl.$setValidity('fieldValidator', true);
        return msgEle.text('');
      }
      ele.bind('keyup', function(e) {
        ctrl.$setValidity('fieldValidator', false);
        parent.addClass('warn');
        value = e.target.value;
        if (!value) {
          return resetField();
        }
        switch (attr.name.toLowerCase()) {
          case 'pin':
            if (isNaN(value)) {
              return msgEle.text($msg.PLEAUSE_USE_NUMBERS);
            }
            if (value.length < $constant.PIN_MIN_LEN) {
              return msgEle.text($msg.PLEAUSE_USE_ATLEAST_FOUR_DIGITS);
            }
            break;
          case 'keyword':
            if (value.length < $constant.KEYWORD_MIN_LEN) {
              return msgEle.text($msg.PLEAUSE_USE_ATLEAST_SIX_CHAR);
            }
            break;
          case 'password':
            if (value.length < $constant.PASSWORD_MIN_LEN) {
              return msgEle.text($msg.PLEAUSE_USE_ATLEAST_SIX_CHAR);
            }
            break;
          default:
            console.error('Invalid Field');
            break;
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
