var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var mongoose = require("mongoose");
var hn = require("hacker-news-api");
var jwt = require("jsonwebtoken");
var config = require("./config.js");
var bcrypt = require("bcrypt");

//express app setup
var app = express();
var server = app.listen(8080);
var io = require("socket.io")(server);

//connect to mongoDB
mongoose.connect("mongodb://localhost/gnr");

//data schema
var Post = require("./model.js").Post;
var Song = require("./model.js").Song;
var User = require("./model.js").User;
var Current = require("./model.js").Current;

//bcrypt secret
var secret = config["secret"];

//DJ constants
var djs = ["Three Dog", "Mr. New Vegas", "Travis Lonely Miles"];
var updated = {};

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


var updateDeletedIndexs = function(dj, missingIndex) {
  Song.find({dj: dj}, function(err, data) {
    if(err) {
      console.log(err);
    }
    if(data) {
      for(var i = 0; i < data.length; i++) {
        if(data[i].index > missingIndex) {
          data[i].index -= 1;
          data[i].save();
        }
      }
    }
  });
}

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

app.post("/song", function(req, res) {
  var pass = true;
  if(!req.body.dj) {
    pass = false;
    res.status(400).send("No dj given in JSON");
  }
  if(req.body.index == undefined) {
    pass = false;
    res.status(400).send("No index given in JSON");
  }
  if(pass) {
    Song.findOne({dj: req.body.dj, index: req.body.index}, function(err, data) {
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


io.on("connection", function(socket) {
  var connectionData = socket.request;
  var dj = connectionData._query["dj"];
  if(!dj) {
    io.sockets.connected[socket.id].emit("Failed", {"message": "No DJ was found in header data"});
  }
  Current.findOne({dj: dj}, function(error, data) {
    if(error) {
      console.log(error)
      io.sockets.connected[socket.id].emit("Failed", {"message": "Interal Database Error"});
    }
    if(data) {
      io.sockets.connected[socket.id].emit("update", {"message": "Update in song and song time", "data": data});
    } else {
      io.sockets.connected[socket.id].emit("Failed", {"message": "No Data Found"});
    }
  });
  (function(dj, io, socket){
    setInterval(function() {
      if(updated[dj] == true) {
        updated[dj] == false;
        Current.findOne({dj: dj}, function(error, data) {
          if(error) {
            io.sockets.connected[socket.id].emit("Failed", {"message": "Interal Database Error"});
          }
          if(data) {
            io.sockets.connected[socket.id].emit("update", {"message": "Update in song and song time", "data": data});
          } else {
            io.sockets.connected[socket.id].emit("Failed", {"message": "No Data Found"});
          }
        });
      }
    }, 1000);
  }(dj, io, socket));
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

app.post("/songs", function(req, res) {
  var pass = true;
  if(!req.body.dj) {
    pass = false;
    res.status(400).send("No dj given in JSON");
  }
  if(pass) {
    Song.find({dj: req.body.dj}, function(err, data) {
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

app.post("/new", function(req, res) {
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
        url: req.body.link
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

app.post("/delete", function(req, res) {
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
    Song.findOne({name: req.body.name, dj: req.body.dj}, function(err, data) {
      if(err) {
        res.status(500).send(err);
      }
      if(data) {
        var deletedIndex = data.index;
        data.remove();
        data.save();
        updateDeletedIndexs(req.body.dj, deletedIndex);
        res.status(200).send({success: true, message: "Item deleted"});
      } else {
        res.status(403).send({success: false, message: "No song found with these attributes"});
      }
    });
  }
});

app.post("/update", function(req, res) {
  var pass = true;
  if(!req.body.name) {
    pass = false;
    res.status(400).send("No name given in JSON");
  }
  if(!req.body.dj) {
    pass = false;
    res.status(400).send("No dj given in JSON");
  }
  if(!req.body.typeReq) {
    pass = false;
    res.status(400).send("No type given in JSON");
  }
  if(pass) {
    Song.findOne({name: req.body.name, dj: req.body.dj}, function(err, data) {
      if(err) {
        res.status(500).send(err);
      }
      if(data) {
        var currentIndex = data.index;
        var findIndex = 0;
        if(req.body.typeReq == "add") {
          findIndex = currentIndex + 1;
        } else {
          findIndex = currentIndex - 1;
        }
        Song.findOne({dj: req.body.dj, index: findIndex }, function(error, oldData) {
          if(error) {
            res.status(500).send(error);
          }
          if(oldData) {
            oldIndex = oldData.index;
            oldData.index = data.index;
            data.index = oldIndex
            data.save();
            oldData.save();
            res.status(200).send({success: true, message: "Indexes updated"});
          } else {
            res.status(403).send({success: false, message: "This song is already at the max index"});
          }
        });
      } else {
        res.status(403).send({success: false, message: "No song found with these attributes"});
      }
    });
  }
});

var currentSetup = function() {
  Current.find({}, function(error, data) {
    if(error) {
      console.log(error);
    }
    if(data.length != 0) {
      console.log("[+] Data set for current songs exists resuming.");
    } else {
      console.log("[-] No data set for current songs exists. System is creating one.");
      for(var i = 0; i < djs.length; i++) {
        var newData = {
          index: 0,
          dj: djs[i],
          time: 0
        };
        var newCurrent = new Current(newData);
        newCurrent.save(function(err, dt) {
          if(err) {
            console.log(err);
          }
        });
      }
    }
  });
};
currentSetup();

//set default false state for updated
var setupUpdates = function() {
  for(var i = 0; i < djs.length; i++) {
    updated[djs[i]] = false;
  }
};
setupUpdates();

//Interval for update of songs
var setupIntervals = function() {
  var prevIndexs = {};
  for(var i = 0; i < djs.length; i++) {
    Current.findOne({dj: djs[i]}, function(error, data) {
      if(error) {
        console.log(error);
      }
      if(data) {
        prevIndexs[djs[i]] = data.index;
      }
    });
    (function(index){
      setInterval(function(){
        Current.findOne({dj: djs[index]}, function(error, data) {
          if(error) {
            console.log(error);
          }
          if(data) {
            if(prevIndexs[djs[index]] != data.index) {
              prevIndexs[djs[index]] = data.index;
              updated[djs[index]] = true;
            }
          }
        });
       }, 1000);
    }(i));
  }
};

setupIntervals();
