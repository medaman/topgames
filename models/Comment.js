var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  //comment
  comment: String
});

var Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
