var app = angular.module("chat.io", []);

app.service("io", [function() {
  this.connect = function(dj) {
    return io("/", {"query": {"dj": dj}}).connect();
  };
  this.getErrors = function(socket) {
    socket.on("Failed", function(data) {
      console.log(data)
    });
  };
  this.getUpdate = function(socket, onSuc) {
    socket.on("update", function(data) {
      onSuc(data);
    });
  };
}]);
