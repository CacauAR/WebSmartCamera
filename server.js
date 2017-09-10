'use strict';
// ================================================================
// get all the tools we need
// ================================================================
var express = require('express');
var routes = require('./routes/index.js');
var port = process.env.PORT || 8080;
var app = express();

// ================================================================
// setup our express application
// ================================================================
app.use('/public', express.static(process.cwd() + '/public'));
//process.cwd() returns returns a string value which is 
//the current working directory - same as __dirname
app.set('view engine', 'ejs');
// set the view engine to ejs

// ================================================================
// setup routes
// ================================================================
routes(app);

// ================================================================
// start our server
// ================================================================
app.listen(port, function() {
 console.log('Server listening on port ' + port + '…');
});