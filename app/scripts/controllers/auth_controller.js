/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout',
  'authFactory', 'serverFactory', 'validateFieldsFactory',
  function($scope, $state, $rootScope, $timeout, auth, server, validate) {
    var LOGIN_TIMEOUT = 90000;
    var FIELD_FOCUS_DELAY = 100;

    $scope.user = {};
    $scope.formError = null;

    // registration tabbing
    $scope.tabs = {
      state: [ 'PIN', 'KEYWORD', 'PASSWORD' ],
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

    var getFormEle = function(form, field) {
      var formEle = $('form[name=' + form.$name + ']');
      return formEle.find('input[name=' + form[field].$name + ']');
    };

    // show form error
    var showFormError = function(err, form, field) {
      var fieldEle = getFormEle(form, field);
      fieldEle.addClass('invalid');
      fieldEle.focus();
      $scope.formError = err;
    };

    // hide form error
    var hideFormError = function(form, field) {
      var fieldEle = getFormEle(form, field);
      fieldEle.removeClass('invalid');
      $scope.formError = null;
    };

    // validate pin
    $scope.validatePin = function() {
      var errMsg = null;
      var formName = 'registerPin';

      errMsg = validate.validateField($scope.user.pin, validate.AUTH_FIELDS.PIN);
      if (errMsg) {
        return showFormError(errMsg, $scope[formName], 'pin');
      }
      hideFormError($scope[formName], 'pin');

      errMsg = validate.validateConfirmationField($scope.user.pin, $scope.user.confirmPin, validate.AUTH_FIELDS.CONFIRM_PIN);
      if (errMsg) {
        return showFormError(errMsg, $scope[formName], 'confirmPin');
      }
      hideFormError($scope[formName], 'confirmPin');
      $scope.tabs.currentPos = $scope.tabs.state[1];
      $timeout(function() {
        $scope.focusField('registerKeyword', 'keyword');
      }, FIELD_FOCUS_DELAY);
      return true;
    };

    // validate keyword
    $scope.validateKeyword = function() {
      var errMsg = null;
      var formName = 'registerKeyword';

      errMsg = validate.validateField($scope.user.keyword, validate.AUTH_FIELDS.KEYWORD);
      if (errMsg) {
        return showFormError(errMsg, $scope[formName], 'keyword');
      }
      hideFormError($scope[formName], 'keyword');

      errMsg = validate.validateConfirmationField($scope.user.keyword, $scope.user.confirmKeyword, validate.AUTH_FIELDS.CONFIRM_KEYWORD);
      if (errMsg) {
        return showFormError(errMsg, $scope[formName], 'confirmKeyword');
      }
      hideFormError($scope[formName], 'confirmKeyword');
      $scope.tabs.currentPos = $scope.tabs.state[2];
      $timeout(function() {
        $scope.focusField('registerPassword', 'password');
      }, FIELD_FOCUS_DELAY);
      return true;
    };

    // validate password
    $scope.validatePassword = function() {
      var errMsg = null;
      var formName = 'registerPassword';
      errMsg = validate.validateField($scope.user.password, validate.AUTH_FIELDS.PASSWORD);
      if (errMsg) {
        return showFormError(errMsg, $scope[formName], 'password');
      }
      hideFormError($scope[formName], 'password');

      errMsg = validate.validateConfirmationField($scope.user.password, $scope.user.confirmPassword, validate.AUTH_FIELDS.CONFIRM_PASSWORD);
      if (errMsg) {
        return showFormError(errMsg, $scope[formName], 'confirmPassword');
      }
      hideFormError($scope[formName], 'confirmPassword');
      register();
      return true;
    };

    // user login
    $scope.login = function() {
      var timer = null;
      var errMsg = null;
      var fieldName = null;
      var formFields = [
        validate.AUTH_FIELDS.PIN,
        validate.AUTH_FIELDS.KEYWORD,
        validate.AUTH_FIELDS.PASSWORD
      ];

      for(var i = 0; i < formFields.length; i++ ) {
        fieldName = formFields[i];
        errMsg = validate.validateField($scope.user[fieldName], fieldName);
        if (errMsg) {
          return showFormError(errMsg, $scope.mslLogin, fieldName);
        }
        hideFormError($scope.mslLogin, fieldName);
      }

      var reset = function() {
        $scope.user = {};
        $timeout.cancel(timer);
      };

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

      $scope.authLoader.show();
      auth.login($scope.user, authRes.onResponse);
    };

    // cancel request
    $scope.cancelRequest = function() {
      authRes.cancel();
      $scope.authLoader.hide();
    };

    // reset input field
    $scope.resetInputField = function(model, $event) {
      var input = angular.element($event.target.previousElementSibling);
      if (input[0].nodeName !== 'INPUT') {
        return;
      }
      $scope.user[model] = null;
      input.removeClass('invalid');
      input.focus();
    };

    // focus field
    $scope.focusField = function(form, field) {
      var form = $('form[name="' + form + '"]');
      var input = form.find('input[name="' + field + '"]').focus();
      return true;
    };
  }
]);
