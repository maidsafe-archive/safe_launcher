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

      var resetField = function() {
        parent.removeClass('week somewhat-secure secure');
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
        var score = zxcvbn(value).score
        statusEle.removeClass('icn');
        switch (true) {
          case (score === 1):
            parent.addClass('week');
            msgEle.text($msg.PASS_VERY_WEEK);
            break;
          case (score === 2):
            parent.addClass('week');
            msgEle.text($msg.PASS_WEEK);
            break;
          case (score === 3):
            parent.addClass('somewhat-secure');
            msgEle.text($msg.PASS_SOMEWHAT_SECURE);
            break;
          case (score === 4):
            parent.addClass('secure');
            statusEle.addClass('icn');
            msgEle.text($msg.PASS_SECURE);
            ctrl.$setValidity('fieldValidator', true);
            break;
          default:
        }
        scope.isPasswordValid({
          result: !parent.hasClass('week')
        });
        scope.$applyAsync();
        strengthEle.width((score * 25) + '%');
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
