'use strict';
// ================================================================
// get all the modules we need
// ================================================================
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
//var routes = require('./routes/index.js');
var app = express();
var port = process.env.PORT || 8080;

var passport = require('passport');
var flash = require('connect-flash');

var fileUpload = require('express-fileupload');
// ================================================================
// configuration database
// ================================================================
// connect to our database
// pass passport module
require('./config/passport')(passport); 

// ================================================================
// setup our express application
// ================================================================
// set up our express application
app.use('/public', express.static(process.cwd() + '/public'));
// need to be before logger('dev') - or will log all files from public dir!!!
// process.cwd() returns returns a string value which is 
// the current working directory - same as __dirname
app.use(logger('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use(fileUpload());

app.set('view engine', 'ejs');
// set the view engine to ejs (Embedded JS)

// ================================================================
// setup session configuration
// ================================================================
// required for passport
app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
	saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// ================================================================
// setup routes
// ================================================================
// pass passport module as middleware to router
var routes = require('./routes/index.js')(express,passport);
app.use('/', routes);

//routes(app, passport);

// ================================================================
// error handlers
// ================================================================
// catch 404 and forward to error handler
// this will throw a new error and pass it on the the app using next().
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
	// don't print a "stack trace" error when we're in production
	res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('pages/error', {
		erro: err.message,
		codigo: err.status
	});
});

// ================================================================
// start our server
// ================================================================
app.set('port', port)
var server = app.listen(port, '0.0.0.0', function () {
	console.log('Server listening on port ' + port + '…');
});

// ================================================================
// start chat server
// ================================================================
var io = require('socket.io').listen(server);
// start listen with socket.io
io.sockets.on('connection', function (socket) {
	var addedUser = false;
	//console.log('a user connected'); //@debug

	// when the client emits 'new message', this listens and executes
	socket.on('chat message', function (data) {
		console.log(' message: -  ' + data.message + " - from " + socket.username);
		// we tell the client to execute 'new message'
		io.emit('chat message', {
			username: socket.username,
			message: data.message
		});	
	});

	socket.on('adduser',function (username) {		
		if (addedUser) return;
		// we store the username in the socket session for this client
		socket.username = username;
		addedUser = true;
		console.log("Usuário " + username + " conectou ao chat.");
	});
	
	socket.on('disconnect', function () {
		console.log('user disconnected'); //@debug
		addedUser = false;
	});
});