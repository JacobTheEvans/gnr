var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var mongoose = require("mongoose");
var hn = require("hacker-news-api");
var request = require("request");
var config = require("./config.js");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");

//base express app
var app = express();

//connect to mongoDB
mongoose.connect("mongodb://localhost/gnr");

//data schema
var Post = require("./model.js").Post;
var Song = require("./model.js").Song;
var User = require("./model.js").User;

//youtube api token
var youtubeToken = config["token"];

//bcrypt secret
var secret = config["secret"];

//setup JSON requests
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//setup public facing files
app.use(express.static(path.join(__dirname + "/public")));
app.set("views", __dirname + "/public/views");

//setup view engine
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");

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

app.get("/login", function(req, res) {
  res.render("login.html");
});

app.post("/auth", function(req,res) {
  User.findOne({username: req.body.username}, function(err,user) {
    if(err) {
      res.status(500).send(err);
    }
    if(!user) {
      res.status(200).send({pass: false, message: "Username is not valid"});
    } else if(user) {
      bcrypt.compare(req.body.password, user.password, function(err, result) {
        if(result) {
          var token = jwt.sign(user, secret, {
            expiresIn: 40 * 60
          });
          res.status(200).json({success: true, token: token});
        } else {
          res.status(200).json({pass: false, message: "Password is not valid"})
        }
      });
    }
  });
});

app.get("/admin", function(req, res) {
  res.render("admin.html");
});

app.use(function(req,res,next) {
  var token = req.body.token;
  if(token) {
    jwt.verify(token, config.secret, function(err, decoded) {
      if (err) {
        return res.status(200).json({ success: false, message: "Failed to authenticate token" });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.status(400).json({success: false, message: "No token given. This area requires a token to be given to access."});
  }
});

app.post("songs", function(req, res) {
  var pass = true;
  if(!req.body.dj) {
    pass = false;
    res.status(400).send("No dj given in JSON");
  }
  if(pass) {
    Song.find({}, function(err, data) {
      if(err) {
        res.status(500).send(err);
      }
      if(data) {
        res.status(200).send(data);
      } else {
        res.status(404).send("No data found");
      }
    });
  }
});

app.post("new", function(req, res) {
  var pass = true;
  if(!req.body.name) {
    pass = false;
    res.status(400).send("No name given in JSON");
  }
  if(!req.body.link) {
    pass = false;
    res.status(400).send("No link given in JSON");
  }
  if(!req.body.dj) {
    pass = false;
    res.status(400).send("No dj given in JSON");
  }
  if(pass) {
    Song.find({dj: req.body.dj}, function(err, data) {
      if(err) {
        res.status(500).send(err);
      }
      var largestIndex = -1;
      if(data) {
        for(var i = 0; i < data.length; i++) {
          if(data[i].index > largestIndex) {
            largestIndex = data[i].index;
          }
        }
      }
      var newData = {
        index: largestIndex + 1,
        name: req.body.name,
        dj: req.body.dj,
        link: req.body.link
      };
      newSong = new Song(newData);
      newSong.save(function(error, result) {
        if(error) {
          res.status(500).send(error);
        }
        if(result) {
          res.status(200).send("success");
        }
      });
    });
  }
});

app.post("delete", function(req, res) {
  var pass = true;
  if(!req.body.name) {
    pass = false;
    res.status(400).send("No name given in JSON");
  }
  if(!req.body.dj) {
    pass = false;
    res.status(400).send("No dj given in JSON");
  }
  if(pass) {
    Song.findOne({name: req.body.name, dj: req.body.dj}, function(req, res) {
      if(err) {
        res.status(500).send(err);
      }
      if(data) {
        data.remove();
        data.save();
        res.status(200).send({success: true, message: "Item deleted"});
      } else {
        res.status(403).send({success: false, message: "No song found with these attributes"});
      }
    });
  }
});

app.listen(8080);


// var convert_time = function(duration) {
//     var a = duration.match(/\d+/g);
//
//     if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
//         a = [0, a[0], 0];
//     }
//
//     if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
//         a = [a[0], 0, a[1]];
//     }
//     if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
//         a = [a[0], 0, 0];
//     }
//
//     duration = 0;
//
//     if (a.length == 3) {
//         duration = duration + parseInt(a[0]) * 3600;
//         duration = duration + parseInt(a[1]) * 60;
//         duration = duration + parseInt(a[2]);
//     }
//
//     if (a.length == 2) {
//         duration = duration + parseInt(a[0]) * 60;
//         duration = duration + parseInt(a[1]);
//     }
//
//     if (a.length == 1) {
//         duration = duration + parseInt(a[0]);
//     }
//     var h = Math.floor(duration / 3600);
//     var m = Math.floor(duration % 3600 / 60);
//     var s = Math.floor(duration % 3600 % 60);
//     return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
// }
//
// id = "TgisehuGOyY"
// url = "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&part=snippet,contentDetails&key=" + youtubeToken.toString();
// console.log(url)
//   request(url , function (error, response, body) {
//       if (!error && response.statusCode == 200) {
//           console.log(convert_time(JSON.parse(body)["items"][0]["contentDetails"]["duration"]));
//       } else {
//         console.log(error)
//       }
//   });
