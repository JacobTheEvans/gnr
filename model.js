var mongoose = require("mongoose");
var Schema = mongoose.Schema;

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

module.exports = {
  Post: mongoose.model("post", postSchema),
};
