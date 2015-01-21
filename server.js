var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var async = require('async');
var request = require('request');
var xml2js = require('xml2js');
var _ = require('lodash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var exec = require("child_process").exec;

// TODO: fix this http://stackoverflow.com/questions/21011773/addtoset-works-like-push
// (duplicates from ruby script)
var moocSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  shortName: String,
  description: String,
  provider: String,
  tags: [String],
  rating: Number,
  ratingCount: Number,
  photo: String,
  sessions: [{
    sessionName: String,
    startDate: Date,
    endDate: Date,
    active: Number,
    subscribers: [{
      type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }]/*,
    deadlines: [{
      id: Number,
      summary: String,
      description: String,
      startDate: Number,
      endDate: Number,
      url: String,
      type: String,
      hard: Number
    }]*/
  }]
});

var deadlineSchema = new mongoose.Schema({
/*  _id : Number,*/
  _id : mongoose.Schema.Types.ObjectId,
  assId : Number,
  sessionName : String,
  summary : String,
  description : String,
  startDate : Number,
  endDate : Number,
  url : String,
  type : String,
  hard : Number,
  alarmOn : [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  subsOn : [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  subsDone : [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }]
});

var userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

var User = mongoose.model('User', userSchema);
var Mooc = mongoose.model('Mooc', moocSchema);
var Deadline = mongoose.model('Deadline', deadlineSchema);


mongoose.connect('localhost');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  User.findOne({ email: email }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false);
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if (isMatch) return done(null, user);
      return done(null, false);
    });
  });
}));

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  if (req.user) {
    res.cookie('user', JSON.stringify(req.user));
  }
  next();
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next();
  else res.send(401);
}

function callRuby(script, args) {
  var path = 'ruby scripts/' + script + ' ' + args;
  console.log("Executing " + path + " ...");
  exec(path, function (err, stdout, stderr) {
    //console.log(stdout);
    return stdout; // grezzo, ragazzo!
  });
}

app.post('/api/login', passport.authenticate('local'), function(req, res) {
  res.cookie('user', JSON.stringify(req.user));
  res.send(req.user);
});

app.post('/api/signup', function(req, res, next) {
  var user = new User({
    email: req.body.email,
    password: req.body.password
  });
  user.save(function(err) {
    if (err) return next(err);
    res.send(200);
  });
});

app.get('/api/logout', function(req, res, next) {
  req.logout();
  res.send(200);
});

// TODO: fix this mooc.sessions[0] everywhere asap.
app.post('/api/subson', ensureAuthenticated, function(req, res, next) {
  console.log(req.body);
  Deadline.findById(req.body.deadId, function(err, deadline) {
    if (err) return res.send("contact create error: " + err);

    console.log(deadline);
    // add the message to the contacts messages
    Deadline.update({_id: deadline.id}, {$push: {"subsOn": req.user.id}}, function(err, numAffected, rawResponse) {
      if (err) return res.send(500);
      console.log('The raw response from Mongo was ', rawResponse);
      res.send(200);
    });
  });
});

app.post('/api/unsubson', ensureAuthenticated, function(req, res, next) {
    console.log(req.body);
    Deadline.findById(req.body.deadId, function(err, deadline) {
      if (err) return res.send("contact create error: " + err);

      console.log(deadline);
      // add the message to the contacts messages
      Deadline.update({_id: deadline.id}, {$pop: {"subsOn": req.user.id}}, function(err, numAffected, rawResponse) {
        if (err) return res.send(500);
        console.log('The raw response from Mongo was ', rawResponse);
        res.send(200);
      });
    });
  });

app.post('/api/subsdone', ensureAuthenticated, function(req, res, next) {
  console.log(req.body);
  Deadline.findById(req.body.deadId, function(err, deadline) {
    if (err) return res.send("contact create error: " + err);

    console.log(deadline);
    // add the message to the contacts messages
    Deadline.update({_id: deadline.id}, {$push: {"subsDone": req.user.id}}, function(err, numAffected, rawResponse) {
      if (err) return res.send(500);
      console.log('The raw response from Mongo was ', rawResponse);
      res.send(200);
    });
  });
});

app.post('/api/unsubsdone', ensureAuthenticated, function(req, res, next) {
  console.log(req.body);
  Deadline.findById(req.body.deadId, function(err, deadline) {
    if (err) return res.send("contact create error: " + err);

    console.log(deadline);
    // add the message to the contacts messages
    Deadline.update({_id: deadline.id}, {$pop: {"subsDone": req.user.id}}, function(err, numAffected, rawResponse) {
      if (err) return res.send(500);
      console.log('The raw response from Mongo was ', rawResponse);
      res.send(200);
    });
  });
});

app.post('/api/alarmon', ensureAuthenticated, function(req, res, next) {
  console.log(req.body);
  Deadline.findById(req.body.deadId, function(err, deadline) {
    if (err) return res.send("contact create error: " + err);

    console.log(deadline);
    // add the message to the contacts messages
    Deadline.update({_id: deadline.id}, {$push: {"alarmOn": req.user.id}}, function(err, numAffected, rawResponse) {
      if (err) return res.send(500);
      console.log('The raw response from Mongo was ', rawResponse);
      res.send(200);
    });
  });
});

app.post('/api/alarmoff', ensureAuthenticated, function(req, res, next) {
  console.log(req.body);
  Deadline.findById(req.body.deadId, function(err, deadline) {
    if (err) return res.send("contact create error: " + err);

    console.log(deadline);
    // add the message to the contacts messages
    Deadline.update({_id: deadline.id}, {$pop: {"alarmOn": req.user.id}}, function(err, numAffected, rawResponse) {
      if (err) return res.send(500);
      console.log('The raw response from Mongo was ', rawResponse);
      res.send(200);
    });
  });
});

  /* var query = Deadline.update(
       {  "assId": req.body.assId, "moocId": req.body.moocId },
       {  $push: { "subsOn": [ req.user.id ] } });
     console.log(req.body.moocId);
         console.log(req.body.assId);
         query.exec(function(err, deadline) {
           if (err) return next(err);
           res.send(deadline);
         });*/
/*
  Deadline
      .where({ "_id: req.body.id })
    .update({ $set: { subsOn: req.user.id }})
  console.log(req.body.id);
  console.log(req.user.id);*/
  /*
    if (err) return next(err);
    mooc.sessions[0].deadlines.subscribers.push(req.user.id);
    mooc.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });*/

app.post('/api/subscribe', ensureAuthenticated, function(req, res, next) {
  Mooc.findById(req.body.moocId, function(err, mooc) {
    if (err) return next(err);
    mooc.sessions[0].subscribers.push(req.user.id);
    mooc.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });
});

app.post('/api/unsubscribe', ensureAuthenticated, function(req, res, next) {
  Mooc.findById(req.body.moocId, function(err, mooc) {
    if (err) return next(err);
    var index = mooc.sessions[0].subscribers.indexOf(req.user.id);
    mooc.sessions[0].subscribers.splice(index, 1);
    mooc.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });
});

// return moocs you are enrolled in
app.get('/api/moocs', ensureAuthenticated, function(req, res, next) {
  var query = Mooc.find({ "sessions.subscribers": req.user.id } );
  if (req.query.utag) {
    query.where({ genre: req.query.utag });
  } else if (req.query.alphabet) {
    query.where({ name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') });
  } else {
    query.limit(12);
  }
  query.exec(function(err, moocs) {
    if (err) return next(err);
    res.send(moocs);
  });
});

// return moocs you are enrolled in
app.get('/api/deads', ensureAuthenticated, function(req, res, next) {
  var query = Deadline.find({ "subscribers": req.user.id } ); // tutte le deadline
  /*if (req.query.utag) {
    query.where({ genre: req.query.utag });
  } else if (req.query.alphabet) {
    query.where({ name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') });
  } else {
    query.limit(12);
  }*/
  query.exec(function(err, deads) {
    if (err) return next(err);
    res.send(deads);
  });
});


app.get('/api/deads/:moocId', function(req, res, next) {
  var query = Deadline.find( {"moocId" :req.params.moocId} , function(err, deadline) {
    console.log(deadline);
    if (err) return next(err);
    res.send(deadline);
  });
});

app.get('/api/moocs/:id', function(req, res, next) {
  Mooc.findById(req.params.id, function(err, mooc) {
    if (err) return next(err);
    res.send(mooc);
  });
});


app.post('/api/moocs', ensureAuthenticated, function(req, res, next) {

  console.log(req.body);

  if (req.body) {
    var mooc = new Mooc(JSON.parse(req.body.generatedMooc)); // TODO: sanitize.
    var moocId = mooc.id;
    var shortName = mooc.sessions[0].sessionName;
    var userId = req.user.id;
    if (mooc && userId) { // temp fix to void userid sent
      mooc.save(function(err) {

        if (err) {

          if (err.code == 11000) {
            console.log(mooc);

            res.status(200).send(); // send anyway ok

            // IN REALTA FA L'UPDATE QUINDI DOVREMMO STARE AL SICURO (NON CRED!) TODO: fixme

            //var query = Mooc.find({ sessions: { id: sessionId } });

            // try just to subscribe userId then
            /*Mooc.findById(moocId, function(err, mooc) {
              if (err) return next(err);

              mooc.subscribers.push(userId); // TODO: handle duplicates.
              mooc.save(function(err, mooc) {
                if (err) {
                  res.status(500).send({message: 'An error occurred.'});
                }
              });
            });*/
          }
        }
        // at this point, being the first time we are adding this course
        // we'll need to fetch deadlines manually and add them

        var path = 'ruby scripts/icallme.rb' + ' ' + shortName + ' ' + moocId + ' ' + userId;
        console.log("Executing " + path + " ...");
        exec(path, function (err, stdout, stderr) {
          if (stdout != null) {
            if (stdout != "true") {
              console.log(stdout + ': false?');
              res.status(500).send({message: 'An error occurred.'});
            } else {
              console.log(stdout + ': true?');
              res.status(200).send();
            }
 /*           var deadlines = JSON.parse(stdout);
            mooc.deadlines.push(deadlines);
            mooc.save(function (err, mooc) {
              if (err) {
                res.status(500).send({message: 'An error occurred.'});
              }
              res.status(200).send();
            });*/
          }
          });
      });
    } else {
      res.status(500).send({message: 'An error occurred.'});
    }
  } else {
    res.status(500).send({message: 'An error occurred.'});
  }
  //res.send(404, {message: req.body.generatedMooc + ' was not found.'});
});
/*
  var seriesName = req.body.moocName
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^\w-]+/g, '');
  
  async.waterfall([
    function(callback) {
      request.get('http://thetvdb.com/api/GetSeries.php?seriesname=' + seriesName, function(error, response, body) {
        if (error) return next(error);
        parser.parseString(body, function(err, result) {
          if (!result.data.series) {
            return res.send(404, { message: req.body.moocName + ' was not found.' });
          }
          var seriesId = result.data.series.seriesid || result.data.series[0].seriesid;
          callback(err, seriesId);
        });
      });
    },
    function(seriesId, callback) {
      request.get('http://thetvdb.com/api/' + apiKey + '/series/' + seriesId + '/all/en.xml', function(error, response, body) {
        if (error) return next(error);
        parser.parseString(body, function(err, result) {
          var series = result.data.series;
          var episodes = result.data.episode;
          var mooc = new Mooc({
            _id: series.id,
            name: series.seriesname,
            airsDayOfWeek: series.airs_dayofweek,
            airsTime: series.airs_time,
            firstAired: series.firstaired,
            genre: series.genre.split('|').filter(Boolean),
            network: series.network,
            overview: series.overview,
            rating: series.rating,
            ratingCount: series.ratingcount,
            runtime: series.runtime,
            status: series.status,
            poster: series.poster,
            episodes: []
          });
          _.each(episodes, function(episode) {
            mooc.episodes.push({
              season: episode.seasonnumber,
              episodeNumber: episode.episodenumber,
              episodeName: episode.episodename,
              firstAired: episode.firstaired,
              overview: episode.overview
            });
          });
          callback(err, mooc);
        });
      });
    },
    function(mooc, callback) {
      var url = 'http://thetvdb.com/banners/' + mooc.poster;
      request({ url: url, encoding: null }, function(error, response, body) {
        mooc.poster = 'data:' + response.headers['content-type'] + ';base64,' + body.toString('base64');
        callback(error, mooc);
      });
    }
  ], function(err, mooc) {
    if (err) return next(err);
    mooc.save(function(err) {
      if (err) {
        if (err.code == 11000) {
          return res.send(409, { message: mooc.name + ' already exists.' });
        }
        return next(err);
      }
      res.send(200);
    });
  });
});*/


// workaround to avoid getting 404s
// when using HTML5 pushState on the client-side
app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});

// stacktrace problems, thanks
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, { message: err.message });
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});