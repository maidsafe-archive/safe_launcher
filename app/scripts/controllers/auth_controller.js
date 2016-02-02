/**
 * Auth Controller
 * @param Auth - Auth factory dependency
 */
window.safeLauncher.controller('AuthController', [ '$scope', '$state', 'AuthFactory',
  function($scope, $state, Auth) {
    $scope.user = {};
    $scope.tabs = {
      state: [
        'PIN',
        'KEYWORD',
        'PASSWORD'
      ],
      currentPos: null,
      init: function() {
        this.currentPos = this.state[0];
      },
      changePos: function(state) {
        if (state === this.state[0]) {
          this.currentPos = this.state[0];
          return;
        }
        if (state === this.state[1]) {
          $scope.validatePin();
          return;
        }
        if (state === this.state[2]) {
          if (!$scope.validatePin()) {
            return;
          }
          if (!$scope.validateKeyword()) {
            return;
          }
        }
      }
    };

    // register user
    var register = function() {
      var reset = function() {
        $scope.user = {};
        $scope.tabs.init();
      };
      var payload = {
        pin: $scope.user.pin,
        keyword: $scope.user.keyword,
        password: $scope.user.password
      };
      console.log('Register :: ', payload);
      Auth.register(payload, function(err, res) {
        reset();
        if (err) {
          alert(err);
          return;
        }
        alert(res);
      });
    };

    // validate pin
    $scope.validatePin = function() {
      if (!$scope.registerPin.$valid) {
        return;
      }
      if (!$scope.user.hasOwnProperty('pin') || !$scope.user.pin) {
        $scope.registerPin.pin.$setValidity('customValidation', false);
        return;
      }
      if (!$scope.user.hasOwnProperty('confirmPin') || !$scope.user.confirmPin) {
        $scope.registerPin.confirmPin.$setValidity('customValidation', false);
        return;
      }
      $scope.tabs.currentPos = $scope.tabs.state[1];
      return true;
    };

    // validate keyword
    $scope.validateKeyword = function() {
      if (!$scope.registerKeyword.$valid) {
        return;
      }
      if (!$scope.user.hasOwnProperty('keyword') || !$scope.user.keyword) {
        $scope.registerKeyword.keyword.$setValidity('customValidation', false);
        return;
      }
      if (!$scope.user.hasOwnProperty('confirmKeyword') || !$scope.user.confirmKeyword) {
        $scope.registerKeyword.confirmKeyword.$setValidity('customValidation', false);
        return;
      }
      $scope.tabs.currentPos = $scope.tabs.state[2];
      return true;
    };

    // validate password
    $scope.validatePassword = function() {
      if (!$scope.registerPassword.$valid) {
        return;
      }
      if (!$scope.user.hasOwnProperty('password') || !$scope.user.password) {
        $scope.registerPassword.password.$setValidity('customValidation', false);
        return;
      }
      if (!$scope.user.hasOwnProperty('confirmPassword') || !$scope.user.confirmPassword) {
        $scope.registerPassword.confirmPassword.$setValidity('customValidation', false);
        return;
      }
      register();
      return true;
    };

    // user login
    $scope.login = function() {
      if (!$scope.mslLogin.$valid) {
        return;
      }
      var reset = function() {
        $scope.user = {};
      };
      Auth.login($scope.user, function(err, res) {
        reset();
        if (err) {
          alert(err);
          return;
        }
        alert(res);
        $state.go('user');
      });
    };

    // show error text
    $scope.showErrorMsg = function(ele, msg) {
      var siblingEle = ele[0].nextElementSibling;
      if (siblingEle.dataset.name === 'formError') {
        siblingEle.textContent = msg;
        return;
      }
      ele.after('<span class="form-err" data-name="formError">' + msg + '<span>');
    };

    $scope.hideErrorMsg = function(ele) {
      var siblingEle = ele[0].nextElementSibling;
      if (siblingEle.dataset.name !== 'formError') {
        return;
      }
      siblingEle.remove();
    };
  }
]);
