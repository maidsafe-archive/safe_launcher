// validate account password on change
window.safeLauncher.directive('validateAccountSecret', [ 'CONSTANTS', 'MESSAGES', '$rootScope',
  function($constant, $msg, $rootScope) {
    var onChange = function(scope, ele, attr, ctrl) {
      var msgEle = ele.siblings('.msg');
      var parent = ele.parent();
      var strengthEle = ele.siblings('.strength');
      var statusEle = ele.siblings('.status');
      var value = '';
      var zxcvbn = require('zxcvbn');
      var isValid = false;

      var resetField = function() {
        isValid = false;
        parent.removeClass('vweak weak somewhat-secure secure');
        ctrl.$setValidity('fieldValidator', true);
        strengthEle.width('0');
        statusEle.removeClass('icn');
        return msgEle.text('');
      }
      ele.bind('keyup', function(e) {
        ctrl.$setValidity('fieldValidator', false);
        value = e.target.value;
        resetField();
        if (!value) {
          return;
        }
        var log10 = zxcvbn(value).guesses_log10;
        statusEle.removeClass('icn');
        switch (true) {
          case (log10 < 4):
            parent.addClass('vweak');
            msgEle.text($msg.PASS_VERY_WEEK);
            break;
          case (log10 < 8):
            parent.addClass('weak');
            msgEle.text($msg.PASS_WEEK);
            break;
          case (log10 < 10):
            parent.addClass('somewhat-secure');
            if (attr.fieldType === 'SECRET') {
              statusEle.addClass('icn');
              isValid = true;
            }
            msgEle.text($msg.PASS_SOMEWHAT_SECURE);
            break;
          case (log10 >= 10):
            parent.addClass('secure');
            statusEle.addClass('icn');
            msgEle.text($msg.PASS_SECURE);
            isValid = true;
            break;
          default:
        }
        strengthEle.width(Math.min((log10/16)*100, 100) + '%');
        ctrl.$setValidity('fieldValidator', isValid);
        scope.isPasswordValid({
          result: isValid
        });
        scope.$applyAsync();
      });
    };
    return {
      scope: {
        isPasswordValid: '&'
      },
      restrict: 'A',
      require: '^?ngModel',
      link: onChange
    };
  }
]);
