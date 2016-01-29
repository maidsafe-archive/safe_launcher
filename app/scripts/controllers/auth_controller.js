/**
 * Auth Controller
 * @param Auth - Auth factory dependency
 */

window.safeLauncher.controller('AuthController', [ '$scope', 'AuthFactory',
  function($scope, Auth) {
    var REGISTER_TAB_INIT_POS = 1;
    var REGISTER_TAB_COUNT = 3;

    // Reset registration form
    var resetRegistration = function() {
      $scope.user = {};
      $scope.registerTab.currentPos = REGISTER_TAB_INIT_POS;
    };

    // User registration
    var register = function(payload) {
      Auth.register(payload, function(err, data) {
        if (err) {
          alert(err);
          return;
        }
        alert(data);
        resetRegistration();
      });
    };

    // Registration tabbing
    $scope.registerTab = {
      currentPos: REGISTER_TAB_INIT_POS,
      count: REGISTER_TAB_COUNT,
      changePosition: function(pos) {
        var self = this;

        // validate
        var validate = function(key) {
          var check = false;
          if (!$scope.user.hasOwnProperty(key) || !$scope.user[key].hasOwnProperty('value') ||
          !$scope.user[key].hasOwnProperty('confirm')) {
            alert('All field required');
            return check;
          }

          if (!$scope.user[key].value || !$scope.user[key].confirm) {
            alert('Field should not be left empty');
            return check;
          }

          if (key === 'pin') {
            if (isNaN($scope.user[key].value)) {
              alert('PIN must contain only numeric');
              return check;
            }

            if ($scope.user[key].value.length < 4) {
              alert('PIN should contain atleast 4 characters');
              return check;
            }
          }

          if (key === 'keyword' || key === 'password') {
            if (!(new RegExp(/^[a-z0-9]+$/i)).test($scope.user[key].value)) {
              alert('Keyword/Password must not contain special characters');
              return check;
            }

            if ($scope.user[key].value.length < 6) {
              alert('Keyword/Password should contain atleast 6 characters');
              return check;
            }
          }

          if ($scope.user[key].value !== $scope.user[key].confirm) {
            alert('Values must be same');
            return check;
          }
          return !check;
        };

        switch (pos) {
          case 1:
            self.currentPos = pos;
            break;
          case 2:
            if (!validate('pin')) {
              return;
            }
            self.currentPos = pos;
            break;
          case 3:
            if (!validate('pin') || !validate('keyword')) {
              return;
            }
            self.currentPos = pos;
            break;
          case self.count + 1:
            if (!validate('password')) {
              self.currentPos = 3;
              return;
            }
            register($scope.user);
            break;
        }
      }
    };

    $scope.user = {};
  }
]);
