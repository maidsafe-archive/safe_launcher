/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout', 'authFactory',
  function($scope, $state, $rootScope, $timeout, auth) {
    var LOGIN_TIMEOUT = 90000;
    var AuthResponse = function() {
      var self = this;
      self.status = true;
      self.onResponse = function(err) {
        if (!self.status) {
          return;
        }
        self.onComplete(err);
      };
      self.onComplete = function(err) {};
      self.cancel = function() {
        console.log('Request canceled');
        self.status = false;
      };
    };
    var authRes = new AuthResponse();

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

    $scope.authLoader = {
      isLoading: false,
      error: false,
      show: function() {
        this.isLoading = true;
      },
      hide: function() {
        this.isLoading = false;
        this.error = false;
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
      $scope.authLoader.show();
      authRes.onComplete = function(err) {
        reset();
        if (err) {
          $scope.authLoader.error = true;
          return;
        }
        $state.go('user');
      };
      auth.register(payload, authRes.onResponse);
    };

    // validate pin
    $scope.validatePin = function() {
      if (!$scope.registerPin.$valid) {
        return;
      }
      var form = $('form[name = ' + $scope.registerPin.$name + ']');
      var pin = null;
      var confirmPin = null;
      if (!$scope.user.hasOwnProperty('pin') || !$scope.user.pin) {
        $scope.registerPin.pin.$setValidity('customValidation', false);
        pin = form.find('input[name=' + $scope.registerPin.pin.$name + ']');
        $scope.showErrorMsg(pin, 'Can\'t be left blank');
        return;
      }
      if (!$scope.user.hasOwnProperty('confirmPin') || !$scope.user.confirmPin) {
        $scope.registerPin.confirmPin.$setValidity('customValidation', false);
        confirmPin = form.find('input[name=' + $scope.registerPin.confirmPin.$name + ']');
        $scope.showErrorMsg(confirmPin, 'Can\'t be left blank');
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
      var form = $('form[name = ' + $scope.registerKeyword.$name + ']');
      var keyword = null;
      var confirmKeyword = null;

      if (!$scope.user.hasOwnProperty('keyword') || !$scope.user.keyword) {
        $scope.registerKeyword.keyword.$setValidity('customValidation', false);
        keyword = form.find('input[name=' + $scope.registerKeyword.keyword.$name + ']');
        $scope.showErrorMsg(keyword, 'Can\'t be left blank');
        return;
      }
      if (!$scope.user.hasOwnProperty('confirmKeyword') || !$scope.user.confirmKeyword) {
        $scope.registerKeyword.confirmKeyword.$setValidity('customValidation', false);
        confirmKeyword = form.find('input[name=' + $scope.registerKeyword.confirmKeyword.$name + ']');
        $scope.showErrorMsg(confirmKeyword, 'Can\'t be left blank');
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
      var form = $('form[name = ' + $scope.registerPassword.$name + ']');
      var password = null;
      var confirmPassword = null;

      if (!$scope.user.hasOwnProperty('password') || !$scope.user.password) {
        $scope.registerPassword.password.$setValidity('customValidation', false);
        password = form.find('input[name=' + $scope.registerPassword.password.$name + ']');
        $scope.showErrorMsg(password, 'Can\'t be left blank');
        return;
      }
      if (!$scope.user.hasOwnProperty('confirmPassword') || !$scope.user.confirmPassword) {
        $scope.registerPassword.confirmPassword.$setValidity('customValidation', false);
        confirmPassword = form.find('input[name=' + $scope.registerPassword.confirmPassword.$name + ']');
        $scope.showErrorMsg(confirmPassword, 'Can\'t be left blank');
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
        $timeout.cancel(timer);
      };

      $scope.authLoader.show();
      if (!$rootScope.$$phase) {
        $rootScope.$apply();
      }
      timer = $timeout(function() {
        $scope.authLoader.error = true;
        reset();
      }, LOGIN_TIMEOUT);
      authRes.onComplete = function(err) {
        reset();
        if (err) {
          $scope.authLoader.error = true;
          return $scope.$applyAsync();
        }
        $state.go('user');
      };
      auth.login($scope.user, authRes.onResponse);
    };

    $scope.cancelRequest = function() {
      authRes.cancel();
      $scope.authLoader.hide();
    };

    // show error text
    $scope.showErrorMsg = function(ele, msg) {
      var parent = ele[0].parentNode;
      var children = parent.children;
      var target = children[children.length - 1];

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
      var target = children[children.length - 1];
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
    };
  }
]);
