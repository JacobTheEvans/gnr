var app = angular.module("app", ["ngCookies"]);

app.service("adminRequests", ["$http", function($http) {
  this.getSongs = function(dj) {

  };
  this.postSong = function(dj, url) {

  };
}]);

app.controller("mainController", ["$scope", "$cookies", function($scope, $cookies) {
  $scope.dj = "Three Dog";
  var token = $cookies.get("UserToken");
  if(!token) {
    window.location.href = "/login";
  };
  $scope.setDj = function(name) {
    $scope.dj = name;
  };
  $scope.updateMDL = function() {
    componentHandler.upgradeAllRegistered();
  };
  setTimeout(function() {
    $scope.updateMDL();
    $("#loading").hide();
  }, 1000);
}]);
