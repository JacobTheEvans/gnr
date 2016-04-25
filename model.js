var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var songSchema = new Schema({
  dj: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

var postSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  createdAt: { type: Date, expires: "30m", default: Date.now }
});


var userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
});

module.exports = {
  Song: mongoose.model("song", songSchema),
  Post: mongoose.model("post", postSchema),
  User: mongoose.model("user", userSchema),
};
