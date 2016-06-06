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
  $scope.currentIndex = 0;
  $scope.currentSong = "";
  $scope.socket = "";
  $scope.player = "";
  $scope.logError = function(response) {
    console.log(response.data)
  };
  $scope.setupSongs = function(data) {
    var indexFound = false;
    $scope.currentIndex = data.index;
    for(var i = 0; i < data.playlist.length; i++) {
      if(data.playlist[i].index == data.index) {
        $scope.currentSong = data.playlist[i].url.replace("https://www.youtube.com/watch?v=", "");
        indexFound = true;
        break;
      }
    }
    if(!indexFound) {
      console.log("Error song not found in given playlist");
    }
    $scope.$apply();
    $scope.$on("youtube.player.ready", function ($event, player) {
      $scope.player = player;
      $scope.player.playVideo();
      $scope.paused = false;
    });
    $scope.$on("youtube.player.ended", function($event, player) {
      $scope.player = player;
      if($scope.currentIndex >= data.playlist.length) {
        $scope.currentIndex = 0;
      } else {
        $scope.currentIndex += 1;
      }
      $scope.currentSong = data.playlist[$scope.currentIndex].url.replace("https://www.youtube.com/watch?v=", "");
      setTimeout(function() {
        $scope.player.playVideo();
      }, 1000);
    });
  };
  $scope.setupSocket = function() {
    $scope.socket = io.connect($scope.dj);
    io.getUpdate($scope.socket, $scope.setupSongs)
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
