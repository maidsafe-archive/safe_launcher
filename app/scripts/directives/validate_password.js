// validate form fields on change
window.safeLauncher.directive('validatePassword', [ 'CONSTANTS', 'MESSAGES', '$rootScope',
  function($constant, $msg, $rootScope) {
    var onChange = function(scope, ele, attr, ctrl) {
      var msgEle = ele.siblings('.msg');
      var parent = ele.parent();
      var strengthEle = ele.siblings('.strength');
      var statusEle = ele.siblings('.status').children('.txt');
      var value = '';
      var zxcvbn = require('zxcvbn');

      var resetField = function() {
        parent.removeClass('success warn error');
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
        var guesses_log10 = zxcvbn(value).guesses_log10
        statusEle.removeClass('icn');
        switch (true) {
          case (guesses_log10 < 5):
            parent.addClass('error');
            msgEle.text($msg.PASS_TOO_GUESSABLE);
            break;
          case (guesses_log10 < 10):
            parent.addClass('error');
            msgEle.text($msg.PASS_VERY_GUESSABLE);
            break;
          case (guesses_log10 < 15):
            parent.addClass('error');
            msgEle.text($msg.PASS_SOMEWHAT_GUESSABLE);
            break;
          case (guesses_log10 < 20):
            parent.addClass('warn');
            statusEle.addClass('icn');
            msgEle.text($msg.PASS_SAFELY_UNGUESSABLE);
            ctrl.$setValidity('fieldValidator', true);
            break;
          case (guesses_log10 >= 20):
            parent.addClass('success');
            statusEle.addClass('icn');
            msgEle.text($msg.PASS_VERY_UNGUESSABLE);
            ctrl.$setValidity('fieldValidator', true);
            break;
          default:
        }
        scope.isPasswordValid({
          result: !parent.hasClass('error')
        });
        scope.$applyAsync();
        strengthEle.width(Math.min((Math.floor(guesses_log10)  * 5), 100) + '%');
      });
    };
    return {
      scope: {
        isPasswordValid: '&isPasswordValid'
      },
      restrict: 'A',
      require: '^?ngModel',
      link: onChange
    };
  }
]);
