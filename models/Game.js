var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var GameSchema = new Schema({
  //Title of the Game
  title: {
    type: String,
    required: true
  },
  //URL of the Game
  link: {
    type: String,
    required: true
  },
  //Short Summary About Game
  summary: {
    type: String
  },
  //Image
  imageURL: {
    type: String
  },
  //Rating out of 10
  rating: {
    type: Number
  },
  //Saved or Not
  saved: {
    type: Boolean,
    default: false
  },
  //comments linked with Comment Schema
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    }
  ]
});

var Game = mongoose.model("Game", GameSchema);

module.exports = Game;
