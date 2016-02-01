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
      console.log("Register :: ", payload);
      Auth.register(payload, function(err, res) {
        reset();
        if(err) {
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
      $scope.tabs.currentPos = $scope.tabs.state[1];
    };

    // validate keyword
    $scope.validateKeyword = function() {
      if (!$scope.registerKeyword.$valid) {
        return;
      }
      $scope.tabs.currentPos = $scope.tabs.state[2];
    };

    // validate password
    $scope.validatePassword = function() {
      if (!$scope.registerPassword.$valid) {
        return;
      }
      register();
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
        if(err) {
          alert(err);
          return;
        }
        alert(res);
        $state.go('user');
      });
    };
  }
]);
