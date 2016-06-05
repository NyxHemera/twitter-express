var express = require('express');
var path = require('path');
var port = process.env.PORT || 3000;
var server = require('http').createServer(app);
var Twit = require('twit');
var mongoose = require('mongoose');

var apiRouter = require('./routes/api');

var app = express();

var uristring =
process.env.MONGOLAB_URI ||
process.env.MONGOHQ_URL ||
process.env.MONGODB_URI ||
'mongodb://localhost/twitexp';

// Connect to DB
mongoose.connect(uristring, function(err, res) {
  if(err) {
    console.log('ERROR connecting to: '+uristring+'. '+err);
  }else {
    console.log('Cargo loaded: '+uristring);
  }
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
