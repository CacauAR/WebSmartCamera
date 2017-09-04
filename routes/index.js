'use strict';
module.exports = function(app) {
 app.get('/', function(req, res) {
   res.render('pages/index');
 });
 app.get('/login', function(req, res) {
   res.render('pages/login');
 });
};