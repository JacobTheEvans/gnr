var app = angular.module("app", ["ngCookies"]);

app.service("loginRequests", ["$http", function($http) {
  this.requestLogin = function(username, password, isSuc, isFail) {
    var data = {
      "username": username,
      "password": password
    }
    $http.post("http://localhost:8080/auth", data).then(isSuc, isFail);
  }
}]);

app.controller("mainController", ["$scope", "loginRequests", "$cookies", function($scope, loginRequests, $cookies) {
  $scope.login = function() {
    loginRequests.requestLogin($scope.userdata.username,$scope.userdata.password,$scope.setUserToken,$scope.requestFail);
  };
  $scope.setUserToken = function(response) {
    if(!response.data.success) {
      alert(response.data.message);
    } else {
      var minutes = 40;
      var date = new Date();
      var expires = new Date(date.getTime() + minutes*60000);
      $cookies.put("UserToken",response.data.token,{expires:expires});
      window.location.href = "/admin";
    }
  };
  $scope.requestFail = function(response) {
    console.log(response.data);
  };
  $scope.updateMDL = function() {
    componentHandler.upgradeAllRegistered();
  };
  setTimeout(function() {
    $scope.updateMDL();
    $("#loading").hide();
  }, 1000);
}]);
