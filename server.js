'use strict';
// ================================================================
// get all the tools we need
// ================================================================
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var routes = require('./routes/index.js');
var app = express();
var port = process.env.PORT || 8080;

var passport = require('passport');
var flash = require('connect-flash');

// ===============================================================
// configuration database
// ================================================================
// connect to our database
require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

// ================================================================
// setup our express application
// ================================================================
app.use('/public', express.static(process.cwd() + '/public'));
//process.cwd() returns returns a string value which is 
//the current working directory - same as __dirname
app.set('view engine', 'ejs');
// set the view engine to ejs

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
routes(app, passport);

// ================================================================
// start our server
// ================================================================
app.set('port', port)
var server = app.listen(port, function () {
	console.log('Server listening on port ' + port + '…');
});

// ================================================================
// start chat server
// ================================================================
var io = require('socket.io').listen(server);


// start listen with socket.io
io.sockets.on('connection', function(socket){  
	console.log('a user connected');

	socket.on('chat message', function(msg){
	  console.log(' message: ' + msg);
	  io.emit('chat message', msg);
	});

	socket.on('disconnect', function(){ 
        console.log('user disconnected'); //@debug
    });
  });