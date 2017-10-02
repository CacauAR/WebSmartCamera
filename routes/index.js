'use strict';
const fs = require('fs');

module.exports = function (express, passport) {

  //Create router instance
  var router = express.Router();

  router.get('/admintools', isLoggedIn, function (req, res) {    
    res.render('pages/admintools', {
      user: req.user, // get the user out of session and pass to template
      title: "WebSmartCamera - Ferramentas do Administrador"
    });
  });
  router.get('/calendar', isLoggedIn, function (req, res) {
    res.render('pages/calendar', {
      user: req.user,
      title: "WebSmartCamera - Calendário de Aulas"
    });
  });
  
  router.get('/listadisciplinas', isLoggedIn, function (req, res) {
    res.render('pages/listadisciplinas', {
      user: req.user,
      title: "WebSmartCamera - Lista Disciplinas"
    });
  });
  
  router.get('/messages', isLoggedIn, function (req, res) {
    res.render('pages/messages', {
      user: req.user,
      title: "WebSmartCamera - Mensagens"
    });
  });
  router.get('/register', isLoggedIn, function (req, res) {
    res.render('pages/register', {
      user: req.user,
      title: "WebSmartCamera - Cadastro"
    });
  });
  
  router.get('/:courseId', isLoggedIn, function (req, res) {
    var courseId = req.params.courseId;
    console.log("A disciplina " + courseId);
    //if(req.query.aula != null) console.log("aula " + req.query.aula);
    
    if(req.query.aula != null){
      
      console.log("Pediu pra assistir aula " + req.query.aula
      + " da matéria "); 
        res.render('pages/assistir', {
        user: req.user,
        title: "WebSmartCamera - AULA TAL",
        aula: req.query.aula
        });
    }
    //verifica no banco de dados se existe tal disciplina
    else {
      //console.log("Foi para a página da disciplina: " + courseId);
      res.render('pages/' + courseId, {
        user: req.user,
        title: "WebSmartCamera - " + courseId,
      });
    }

  });
  
  router.get('/video', isLoggedIn, function (req, res) {
    res.render('pages/video', {
      user: req.user,
      title: "WebSmartCamera - Aula ao Vivo"
    });
  });

  // =================================================
  // Page to watch classes already recorded ==========
  // =================================================
  router.get('/movies/:movieName', isLoggedIn, function (req, res) {

    const { movieName } = req.params;
    const movieFile = `./movies/${movieName}`;

    fs.stat(movieFile, (err, stats) => {
      if (err) {
        console.log(err);
        return res.status(404).end('<h1>Movie Not found</h1>');
      }
      // Variáveis necessárias para montar o chunk header corretamente
      const { range } = req.headers;
      const { size } = stats;
      const start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
      const end = size - 1;
      const chunkSize = (end - start) + 1;
      // Definindo headers de chunk
      res.set({
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });
      // É importante usar status 206 - Partial Content para o streaming funcionar
      res.status(206);
      // Utilizando ReadStream do Node.js
      // Ele vai ler um arquivo e enviá-lo em partes via stream.pipe()
      const stream = fs.createReadStream(movieFile, { start, end });
      stream.on('open', () => stream.pipe(res));
      stream.on('error', (streamErr) => res.end(streamErr));
    });
  });
  var app = express();
  app.listen(3000, () => console.log('VideoFlix Server!'));
  
  // =================================================
  // LOGIN - HOME PAGE ===============================
  // =================================================
  // show the login form
  router.get('/', function (req, res) {
    if (req.user) {
      //if user is logged he will be redirected to index page
      res.redirect('/listadisciplinas');
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
  router.post('/login', passport.authenticate('local-login', {
    successRedirect: 'listadisciplinas', 
    // redirect to the secure profile index section
    failureRedirect: '/', 
    // redirect back to the login page if there is an error
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

  // =================================================
  // SIGNUP ==========================================
  // =================================================
  // show the signup form
  router.get('/signup', function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('pages/signup', {
      message: req.flash('signupMessage'),
      title: "WebSmartCamera - Cadastro de Usuário"
    });
  });

  // process the signup form
  router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: 'listadisciplinas',
     // redirect to the secure profile section
    failureRedirect: 'signup', 
    // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =================================================
  // PROFILE SECTION =================================
  // =================================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  router.get('/profile', isLoggedIn, function (req, res) {
    res.render('pages/profile', {
      user: req.user, // get the user out of session and pass to template
      title: "WebSmartCamera - Perfil Usuário"
    });
  });

  // =================================================
  // LOGOUT ==========================================
  // =================================================
  router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  return router;

};

// route middleware to make sure user is logged
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();
  // if they aren't redirect them to the home page
  res.redirect('/');
}
