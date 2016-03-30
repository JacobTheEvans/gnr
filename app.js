var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");

//base express app
var app = express();

//setup JSON requests
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//setup public facing files
app.use(express.static(path.join(__dirname + "/public")));
app.set("views", __dirname + "/public/views");

//setup view engine
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");

app.get("/", function(req, res) {
  res.render("index.html");
});

app.listen(8080);
