/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout', 'authFactory',
  function($scope, $state, $rootScope, $timeout, auth) {
    var LOGIN_TIMEOUT = 90000;
    $scope.user = {};
    $scope.isLoading = false;
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

    // handle loader
    var Loader = {
      show: function() {
        $scope.isLoading = true;
      },
      hide: function() {
        $scope.isLoading = false;
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
      Loader.show();
      auth.register(payload, function(err, res) {
        reset();
        Loader.hide();
        if (err) {
          return alert('Registration failed. Please try again');
        }
        $state.go('user');
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
      var timer = null;

      if (!$scope.mslLogin.$valid) {
        return;
      }
      if (!$scope.user.hasOwnProperty('pin') || !$scope.user.pin) {
        return $scope.mslLogin.pin.$setValidity('customValidation', false);
      }
      if (!$scope.user.hasOwnProperty('keyword') || !$scope.user.keyword) {
        return $scope.mslLogin.keyword.$setValidity('customValidation', false);
      }
      if (!$scope.user.hasOwnProperty('password') || !$scope.user.password) {
        return $scope.mslLogin.password.$setValidity('customValidation', false);
      }
      var reset = function() {
        $scope.user = {};
        Loader.hide();
        $timeout.cancel(timer);
      };
      Loader.show();
      timer = $timeout(function() {
        reset();
      }, LOGIN_TIMEOUT);
      auth.login($scope.user, function(err, res) {
        reset();
        if (err) {
          alert('Login failed. Please try again');
          return;
        }
        $state.go('user');
      });
    };

    // show error text
    $scope.showErrorMsg = function(ele, msg) {
      var parent = ele[0].parentNode;
      var children = parent.children;
      var target = children[ children.length - 1 ];

      // var siblingEle = ele[0].nextElementSibling;
      if (target.dataset.name === 'formError') {
        target.textContent = msg;
        return;
      }
      var errFild = document.createElement('span');
      errFild.setAttribute('class', 'form-err');
      errFild.setAttribute('data-name', 'formError');
      errFild.innerHTML = msg;
      parent.appendChild(errFild);
    };

    $scope.hideErrorMsg = function(ele) {
      var parent = ele[0].parentNode;
      var children = parent.children;
      var target = children[ children.length - 1 ];
      // var siblingEle = ele[0].nextElementSibling;
      ele.removeClass('ng-invalid');
      if (target.dataset.name !== 'formError') {
        return;
      }
      target.remove();
    };

    // reset input field
    $scope.resetInputField = function(model, $event) {
      var input = angular.element($event.target.previousElementSibling);
      if (input[0].nodeName !== 'INPUT') {
        return;
      }
      var form = input[0].form.name;
      $scope.user[model] = null;
      $scope[form][input[0].name].$setValidity('customValidation', true);
      input.removeClass('ng-invalid ng-invalid-custom-validation');
      input.focus();
      // $scope[form][ele].$setValidity('customValidation', false);
      // user.pin = null;mslLogin.pin.$setValidity('customValidation', false);
    };
  }
]);
