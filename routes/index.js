'use strict';

//res.render() will look in a views folder for the view
module.exports = function(app) {

  app.get('/admintools', function(req, res) {
    res.render('pages/admintools');
  });
  app.get('/calendar', function(req, res) {
    res.render('pages/calendar');
  });
  app.get('/', function(req, res) {
    res.render('pages/index');
  });
  app.get('/listadisciplinas', function(req, res) {
    res.render('pages/listadisciplinas');
  });
  app.get('/login', function(req, res) {
    res.render('pages/login');
  });
  app.get('/messages', function(req, res) {
    res.render('pages/messages');
  });
  app.get('/profile', function(req, res) {
    res.render('pages/profile');
  });
  app.get('/register', function(req, res) {
    res.render('pages/register');
  });
  app.get('/signup', function(req, res) {
    res.render('pages/signup');
  });
  app.get('/submenu', function(req, res) {
    res.render('pages/submenu');
  });
  app.get('/video', function(req, res) {
    res.render('pages/video');
  });  
  
};