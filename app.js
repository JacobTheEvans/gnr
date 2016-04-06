var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var mongoose = require("mongoose");
var hn = require("hacker-news-api");
var Youtube = require("youtube-api");
var config = require("./config.js");

//base express app
var app = express();

//connect to mongoDB
mongoose.connect("mongodb://localhost/gnr");

//data schema
var Post = require("./model.js").Post;

//setup JSON requests
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//setup public facing files
app.use(express.static(path.join(__dirname + "/public")));
app.set("views", __dirname + "/public/views");

//setup view engine
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");

//youtube api setup
Youtube.authenticate({
  type: "key",
  key: config["youtube_token"]
});

var refreshCache = function() {
  hn.story().since("past_24h").recent().top(function(error, data) {
    if(error) {
      console.log(error);
    }
    if(data) {
      var newData = [];
      for(var i = 0; i < data["hits"].length; i++) {
        newData.push({"title": data["hits"][i].title, "url": data["hits"][i].url, "points": data["hits"][i].points});
      }
      for( var i = 0; i < newData.length; i++) {
        var newPost = new Post(newData[i]);
        newPost.save(function(err, result) {
          if(err) {
            if(err.name != "ValidationError") {
              console.log(err);
            }
          }
        });
      }
    }
  });
};

//init cache
refreshCache();

//setup interval for cache of hacker news posts
setInterval(function(){
  refreshCache();
}, 1800000);

app.get("/", function(req, res) {
  res.render("index.html");
});

app.get("/news", function(req, res) {
  Post.find({}, function(err, data) {
    if(err) {
      res.status(500).send(err);
    }
    if(data) {
      res.status(200).send(data.slice(0, 30));
    } else {
      res.status(404).send({pass: false, message: "No data found"});
    }
  });
});

app.listen(8080);
