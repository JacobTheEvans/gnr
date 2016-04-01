var app = angular.module("app", ["youtube-embed"]);

app.service("news", ["$http", function($http) {
  this.getNews = function(isSuc, isFail) {
    $http.get("http://localhost:8080/news").then(isSuc,isFail);
  };
}]);

app.controller("mainController", ["$scope", "news", function($scope, news) {
  $scope.newsItems = [];
  $scope.currentSong = "WGmHaMRAXuI";
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
  setTimeout(function() {
    $scope.updateMDL();
    $("#loading").hide();
  }, 1000);
}]);
