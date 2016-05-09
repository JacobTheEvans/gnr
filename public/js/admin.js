var app = angular.module("app", ["ngCookies"]);

app.service("adminRequests", ["$http", function($http) {
  this.getSongs = function(token, dj, isSuc, isFail) {
    var data = {
      dj: dj,
      token: token,
    };
    $http.post("http://localhost:8080/songs", data).then(isSuc, isFail);
  };
  this.postSong = function(token, dj, name, link, isSuc, isFail) {
    var data = {
      dj: dj,
      token: token,
      name: name,
      link: link
    };
    $http.post("http://localhost:8080/new", data).then(isSuc, isFail);
  };
  this.deleteSong = function(token, dj, name, isSuc, isFail) {
    var data = {
      dj: dj,
      token: token,
      name: name
    };
    $http.post("http://localhost:8080/delete", data).then(isSuc, isFail);
  };
  this.updateIndex = function(token, dj, name, typeReq, isSuc, isFail) {
    var data = {
      dj: dj,
      token: token,
      name: name,
      typeReq: typeReq
    };
    $http.post("http://localhost:8080/update", data).then(isSuc, isFail);
  };
}]);

app.controller("mainController", ["$scope", "$cookies", "adminRequests", function($scope, $cookies, adminRequests) {
  $scope.data = [];
  var token = $cookies.get("UserToken");
  if(!token) {
    window.location.href = "/login";
  };
  $scope.setData = function(response) {
    $scope.data = response.data;
  };
  $scope.logError = function(response) {
    console.log(response.status);
    console.log(response.data);
  };
  $scope.updateData = function(response) {
    $scope.name = "";
    $scope.url = "";
    $scope.setDj($scope.dj);
  }
  $scope.setDj = function(name) {
    $scope.dj = name;
    adminRequests.getSongs(token, name, $scope.setData, $scope.logError);
  };
  $scope.addSong = function() {
    if($scope.name != "" && $scope.url != "") {
      adminRequests.postSong(token, $scope.dj, $scope.name, $scope.url, $scope.updateData, $scope.logError);
    } else {
      alert("Must provide name and URL")
    }
  };
  $scope.delete = function(name) {
    adminRequests.deleteSong(token, $scope.dj, name, $scope.updateData, $scope.logError);
  };
  $scope.alertError = function(response) {
    alert(response.data.message)
  };
  $scope.updateIndex = function(name, typeReq) {
    adminRequests.updateIndex(token, $scope.dj, name, typeReq, $scope.updateData, $scope.alertError);
  }
  $scope.updateMDL = function() {
    componentHandler.upgradeAllRegistered();
  };
  setTimeout(function() {
    $scope.updateMDL();
    $scope.setDj("Three Dog");
    $("#loading").hide();
  }, 1000);
}]);
