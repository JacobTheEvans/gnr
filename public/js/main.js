var app = angular.module("app", ["youtube-embed","chat.io", "ngCookies"]);

app.service("news", ["$http", function($http) {
  this.getNews = function(isSuc, isFail) {
    $http.get("http://localhost:8080/news").then(isSuc,isFail);
  };
}]);

app.service("songRequest", ["$http", function($http) {
  this.getSong = function(dj, index, isSuc, isFail) {
    var data = {
      "dj": dj,
      "index": index
    };
    $http.post("http://localhost:8080/song", data).then(isSuc,isFail);
  };
}]);

app.controller("mainController", ["$scope", "news", "io", "songRequest", "$cookies", function($scope, news, io, songRequest, $cookies) {
  $scope.dj = $cookies.get("dj");
  if(!$scope.dj) {
    $scope.dj = "Three Dog";
  }
  $scope.paused = true;
  $scope.newsItems = [];
  $scope.currentSong = "";
  $scope.socket = "";
  $scope.player = "";
  $scope.setSong = function(response) {
    $scope.currentSong = response.data.url.replace("https://www.youtube.com/watch?v=", "");
    $scope.$on("youtube.player.ready", function ($event, player) {
      $scope.player = player;
      $scope.player.seekTo($scope.time);
      $scope.player.playVideo();
      $scope.paused = false;
    });
  };
  $scope.logError = function(response) {
    console.log(response.data)
  };
  $scope.getSong = function(data) {
    $scope.time = data["data"]["time"];
    songRequest.getSong($scope.dj, data["data"]["index"], $scope.setSong, $scope.logError);
  };
  $scope.setupSocket = function() {
    $scope.socket = io.connect($scope.dj);
    io.getUpdate($scope.socket, $scope.getSong)
  };
  $scope.stopVideo = function() {
    $scope.paused = true;
  };
  $scope.playVideo = function() {
    $scope.paused = false;
  }
  $scope.getNews = function() {
    news.getNews($scope.setNews, $scope.fail);
  };
  $scope.setNews = function(response) {
    $scope.newsItems = response.data;
  };
  $scope.fail = function(response) {
    console.log(response.status);
  };
  $scope.updateMDL = function() {
    componentHandler.upgradeAllRegistered();
  };
  $scope.setDj = function(dj) {
    $cookies.put("dj", dj);
    window.location = "/";
  };
  setTimeout(function() {
    $scope.updateMDL();
    $scope.setupSocket();
    $("#loading").hide();
  }, 1000);
}]);
