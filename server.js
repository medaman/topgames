var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");


var request = require("request");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 8080;

var app = express();

app.use(express.static("views"));

app.use(bodyParser.urlencoded({ extended: false }));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/topgames";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

var methodOverride = require("method-override");
app.use(methodOverride("_method"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var results = [];

// Routes

app.get("/", function(req, res) {
  db.Game.find({}, function(err, data) {
    if(err) {
      console.log(err);
      res.status(500).end();
    }

    res.render("index", {games: data});
  }).sort({rating:-1});
});

app.get("/scrape", function(req, res) {
  
  db.Game.find({}, function(err, data) {
    if(err) {
      return console.log(err);
    }
    results = data;
  }).then(function() {
    request("https://www.gamespot.com/reviews", function(error, response, html) {
      if(error) {
        return console.log(error + "Stufffffffffff");
      }

      var $ = cheerio.load(html);
      var added = 0;
      $(".media-game").each(function(i, element) {

        var title = $(this)
          .children("a")
          .attr("data-event-title").replace(/ \w+[.!?]?$/, '');
        var link = "https://www.gamespot.com" + $(this)
          .children("a")
          .attr("href");
        var summary = $(this)
          .find(".media-deck")
          .text();
        var rating = $(this)
          .find(".media-well--review-score")
          .text();
        var imageURL = $(this)
          .find(".media-img")
          .children("img")
          .attr("src");
        var alreadyThere = false;
        for(var j=0; j<results.length; j++) {
          if (results[j].link === link) {
            alreadyThere=true;
          }
        }
        if(!alreadyThere) {
          added++;
          var newGame = {
            title: title,
            link: link,
            summary: summary,
            rating: rating,
            imageURL: imageURL
          };
          console.log(newGame)
            results.push(newGame);
            db.Game
              .create(newGame)
              .then(function(dbGame) {
                console.log("added");
              })
              .catch(function(err) {
                res.json(err);
              });
        }
      });
      res.redirect("/");
    });
  });
});

app.get("/games", function(req, res) {
  db.Game.find({}, function(err, result) {
    if(err) {
      console.log(err);
      res.status(500).end();
    }
    res.json(result);
  });
});

app.get("/games/:id", function(req, res) {
  db.Game
    .findOne({"_id": req.params.id})
    .populate("comments")
    .then(function(dbGame) {
      res.json(dbGame);
    })
    .catch(function(err) {
      if(err) {
        console.log(err);
        res.status(500).end();
      }
    })
});

app.get("/saved", function(req, res) {
  db.Game.find({saved: true}, function(err, data) {
    if (err) {
      console.log(err);
      res.status(500).end();
    }
    res.render("saved", {games: data});
  }).populate("comments").sort({rating:-1});
});

app.post("/games/:id", function(req, res) {
  db.Game.updateOne({_id: req.params.id}, {$set: {saved: true}}, function(err) {
    if (err) {
      console.log(err);
      res.status(500).end();
    }
    res.redirect("/")
  })
});

app.post("/games/comment/:id", function(req, res) {
  db.Comment
    .create(req.body)
    .then(function(dbComment) {
      return db.Game.findOneAndUpdate({"_id": req.params.id}, {$push: {comments: dbComment._id }}, { new: true });
    })
    .then(function(dbGame) {
      res.redirect("/saved");
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/games/remove/:id", function(req, res) {
  db.Game.updateOne({_id: req.params.id}, {$set: {saved: false}}, function(err) {
    if (err) {
      console.log(err);
      res.status(500).end();
    }
    res.redirect("/saved")
  })
});

app.delete("/games/:id", function(req, res) {
  db.Game.remove({_id: req.params.id}, function(err) {
    if (err) {
      console.log(err);
      res.status(500).end();
    }
    res.redirect("/")
  })
});

app.delete("/games/delete/comment/:id", function(req, res) {
  db.Comment.remove({_id: req.params.id}, function(err) {
    if (err) {
      console.log(err);
      res.status(500).end();
    }
    res.redirect("/saved")
  })
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});