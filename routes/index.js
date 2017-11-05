'use strict';
const fs = require('fs');


module.exports = function (express, passport) {
  
  var dbconfig = require('../config/database'); //load database model
  var queryFile = require('../config/querys.js'); //load methods for sql querys  
  var router = express.Router(); //Create router instance

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
  // LOGOUT ==========================================
  // =================================================
  router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  // =================================================
  // HOME PAGE =======================================
  // =================================================
  router.get('/listadisciplinas', isLoggedIn, function (req, res) {
    //MUDAR PARA EXIBIR LISTA DE DISCIPLINAS DO ALUNO - PEGAR DA TABELA ESTUDA   
    
    var query =  "SELECT * FROM " + dbconfig.disciplinas_table; 
    queryFile.data.selectSQLquery(query, function (result) {
      res.render('pages/listadisciplinas', {
        user: req.user,
        title: "WebSmartCamera - Lista Disciplinas Aluno",
        lista : result
      }); 
    });
  });

  //=================================================
  // LISTA DE TODAS AS DISCIPLINAS ==================
  // ================================================
  router.get('/lista_disciplinas', isLoggedIn, function (req, res) { 
    var query =  "SELECT * FROM " + dbconfig.disciplinas_table; 
    queryFile.data.selectSQLquery(query, function (result) {
      res.render('pages/lista_disciplinas', {
        user: req.user,
        title: "WebSmartCamera - Lista Disciplinas",
        lista : result,
        message: req.flash('info')
      }); 
    });   
  });

  // processa o formulário de cadastro de disciplina
  router.post('/lista_disciplinas', function (req, res) {
    var query =  "INSERT INTO " + dbconfig.disciplinas_table + 
      " (codigo, nomeDisciplina) VALUES (?,?)"; 
    var params = [req.body.codDisciplina,req.body.nomeDisciplina];

    queryFile.data.insertSQLquery(query, params, function (result){     
      req.flash('info', result);      
      res.redirect('/lista_disciplinas');
    });        
  });

  //=================================================
  // LISTA DE TODAS AS TURMAS =======================
  // ================================================
  router.get('/lista_turmas', isLoggedIn, function (req, res) { 
    var query = "SELECT * FROM " + dbconfig.turmas_table; 
    var query2 = "SELECT matricula, username FROM " + dbconfig.professores_table;  
    var query3 = "SELECT * FROM " + dbconfig.disciplinas_table;

    var listaProfessores, listaDisciplinas;
    
    queryFile.data.selectSQLquery(query2, function (result){
      listaProfessores = result;
    });
    
    queryFile.data.selectSQLquery(query3, function (result){
      listaDisciplinas = result;
    });

    queryFile.data.selectSQLquery(query, function (result) {
      res.render('pages/lista_turmas', {
        user: req.user,
        title: "WebSmartCamera - Lista Turmas",
        lista : result,
        listaDeProfessores : listaProfessores,
        listaDeDisciplinas : listaDisciplinas,
        message: req.flash('info')
      }); 
    });   
  });

  // processa o formulário de cadastro de turmas
  router.post('/lista_turmas', function (req, res) {
    var query =  "INSERT INTO " + dbconfig.turmas_table + 
      " (matriculaProfessor, codigoDisciplina) VALUES (?,?)"; 
    var params = [req.body.matriculaProf, req.body.codDisciplina];
    queryFile.data.insertSQLquery(query, params, function (result){     
      req.flash('info', result);      
      res.redirect('/lista_turmas');
    });        
  });

  // ================================================
  // LISTA TODOS OS PROFESSORES =====================
  // ================================================
  router.get('/lista_professores', isLoggedIn, function (req, res) { 
    var query =  "SELECT * FROM " + dbconfig.professores_table; 
    queryFile.data.selectSQLquery(query, function (result) {
      res.render('pages/lista_professores', {
        user: req.user,
        title: "WebSmartCamera - Listar de Professores",
        lista : result,
        message: req.flash('info')
      }); 
    });   
  });

  // ================================================
  // CADASTRO DE PROFESSOR
  // ================================================
  router.get('/cadastro_professor', isLoggedIn, function (req, res) {     
      res.render('pages/cadastro_professor', {
        user: req.user,
        title: "WebSmartCamera - Cadastro de Professor",
        message: req.flash('info')      
    });   
  });

  // processa o formulário de cadastro de professor
  router.post('/cadastro_professor', function (req, res) {
    var query =  "INSERT INTO " + dbconfig.professores_table + 
      " (matricula, username, sexo, password, email) VALUES (?,?,?,?,?)"; 
    var params = [req.body.matricula,req.body.username,req.body.sexo,
      req.body.password,req.body.email];

    queryFile.data.insertSQLquery(query, params, function (result){ 
      req.flash('info', result);    
      if (result == 1) res.redirect('/cadastro_professor');
      else res.redirect('/lista_professores');      
    });        
  });



  router.get('/calendar', isLoggedIn, function (req, res) {
    res.render('pages/calendar', {
      user: req.user,
      title: "WebSmartCamera - Calendário de Aulas"
    });
  });

  router.get('/messages', isLoggedIn, function (req, res) {
    res.render('pages/messages', {
      user: req.user,
      title: "WebSmartCamera - Mensagens"
    });
  }); 
  
  router.get('/video', isLoggedIn, function (req, res) {
    res.render('pages/video', {
      user: req.user,
      title: "WebSmartCamera - Aula ao Vivo"
    });

    var fs = require('fs'),
      http = require('http'),
      WebSocket = require('ws');


    var STREAM_PORT = process.argv[3] || 8081,
      WEBSOCKET_PORT = process.argv[4] || 8082,
      RECORD_STREAM = false;

    // Websocket Server
    var socketServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});
    socketServer.connectionCount = 0;
    socketServer.on('connection', function(socket, upgradeReq) {
      socketServer.connectionCount++;
      console.log(
        'New WebSocket Connection: ', 
        (upgradeReq || socket.upgradeReq).socket.remoteAddress,
        (upgradeReq || socket.upgradeReq).headers['user-agent'],
        '('+socketServer.connectionCount+' total)'
      );
      socket.on('close', function(code, message){
        socketServer.connectionCount--;
        console.log(
          'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
        );
      });
    });
    socketServer.broadcast = function(data) {
      socketServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
          console.log(data);
        }
      });
    };

    // HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
    var streamServer = http.createServer( function(request, response) {

      response.connection.setTimeout(0);
      console.log(
        'Stream Connected: ' + 
        request.socket.remoteAddress + ':' +
        request.socket.remotePort
      );
      request.on('data', function(data){
        socketServer.broadcast(data);
        if (request.socket.recording) {
          request.socket.recording.write(data);
        }
      });
      request.on('end',function(){
        console.log('close');
        if (request.socket.recording) {
          request.socket.recording.close();
        }
      });

      // Record the stream to a local file?
      if (RECORD_STREAM) {
        var path = 'recordings/' + Date.now() + '.ts';
        request.socket.recording = fs.createWriteStream(path);
      }
    }).listen(STREAM_PORT);

    console.log('Listening for incomming MPEG-TS Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>');
    console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');

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


  router.get('/:courseId', isLoggedIn, function (req, res) {
    var courseId = req.params.courseId;
    console.log("Página " + courseId + " foi pedida.");
    //if(req.query.aula != null) console.log("aula " + req.query.aula);
    
    if (req.query.aula != null){
      
      console.log("Pediu pra assistir aula " + req.query.aula
      + " da matéria "); 
        res.render('pages/assistir', {
        user: req.user,
        title: "WebSmartCamera - AULA TAL",
        aula: req.query.aula
        });
    }
    //verifica no banco de dados se existe tal página
    else {
      //console.log("Foi para a página: " + courseId);
      res.render('pages/' + courseId, {
        user: req.user,
        title: "WebSmartCamera - " + courseId,
      });
    }

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
