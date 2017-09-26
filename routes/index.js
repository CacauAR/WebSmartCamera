'use strict';

//res.render() will look in a views folder for the view
module.exports = function (app, passport) {

  app.get('/admintools', isLoggedIn, function (req, res) {
    res.render('pages/admintools', {
      user: req.user, // get the user out of session and pass to template
      title: "WebSmartCamera - Ferramentas do Administrador"
    });
  });

  app.get('/calendar', isLoggedIn, function (req, res) {
    res.render('pages/calendar', {
      user: req.user,
      title: "WebSmartCamera - Calendário de Aulas"
    });
  });

  app.get('/index', isLoggedIn, function (req, res) {
    res.render('pages/index', {
      user: req.user,
      title: "WebSmartCamera - Disciplinas" 
    });
  });

  app.get('/listadisciplinas', isLoggedIn, function (req, res) {
    res.render('pages/listadisciplinas', {
      user: req.user,
      title: "WebSmartCamera - Lista -Mexer!!!" 
    });
  });
  app.get('/messages', isLoggedIn, function (req, res) {
    res.render('pages/messages', {
      user: req.user,
      title: "WebSmartCamera - Mensagens" 
    });
  });
  app.get('/register', isLoggedIn, function (req, res) {
    res.render('pages/register', {
      user: req.user,
      title: "WebSmartCamera - Cadastro" 
    });
  });
  app.get('/submenu', isLoggedIn, function (req, res) {
    res.render('pages/submenu', {
      user: req.user,
      title: "WebSmartCamera - NOME DISCIPLINA!!" 
    });
  });
  app.get('/video', isLoggedIn, function (req, res) {
    res.render('pages/video', {
      user: req.user,
      title: "WebSmartCamera - ARRUMAR COM VIDEO TRANSMISSAO" 
    });
  });

  // =================================================
  // LOGIN - HOME PAGE ===============================
  // =================================================
  // show the login form
  app.get('/', function (req, res) {
    if (req.user) {
      //if user is logged he will be redirected to index page
      res.redirect('/index');
    }
    else {
      // render the page and pass in any flash data if it exists
      res.render('pages/login', { 
        message: req.flash('loginMessage'),
        title: "WebSmartCamera - Login"
      });
    }
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: 'index', // redirect to the secure profile index section
    failureRedirect: '/', // redirect back to the login page if there is an error
    failureFlash: true // allow flash messages
    }),
    function (req, res) {
      console.log("hello");

      if (req.body.remember) {
        req.session.cookie.maxAge = 1000 * 60 * 3;
      } else {
        req.session.cookie.expires = false;
      }
      res.redirect('/');
  });

  // ============================================
  // SIGNUP =====================================
  // ============================================
  // show the signup form
  app.get('/signup', function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('pages/signup', { 
      message: req.flash('signupMessage'),
      title: "WebSmartCamera - Cadastro de Usuário"
    });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: 'index', // redirect to the secure profile section
    failureRedirect: 'signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // ==========================================
  // PROFILE SECTION ==========================
  // ==========================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function (req, res) {
    res.render('pages/profile', {
      user: req.user, // get the user out of session and pass to template
      title: "WebSmartCamera - Perfil Usuário"
    });
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

};

// route middleware to make sure user is logged
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();
  // if they aren't redirect them to the home page
  res.redirect('/');
}
