'use strict';
const fs = require('fs'); //File System module

module.exports = function (express, passport) {

  var dbconfig = require('../config/database'); //load database model
  var queryFile = require('../config/querys.js'); //load methods for sql querys  
  var router = express.Router(); //Create router instance
  var listaTurmasSessao = {}; //store list of turmas from session
  
  // =================================================
  // SIGNUP ==========================================
  // =================================================
  // show the signup form
  router.get('/signup', isLoggedIn, function (req, res) {
    if (req.session.typeuser == "administrador") {
      // render the page and pass in any flash data if it exists
      res.render('pages/signup', {
        user: req.user,
        title: "WebSmartCamera - Cadastro de Usuário",
        message: req.flash('signupMessage'),      
        tipoUsuario : req.session.typeuser  
      });
    } else res.redirect('/home');
  });

  // process the signup form
  router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: 'signup',
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

  router.get('/home', isLoggedIn, function (req, res) {   
    // se o usuário for professor, a página mostrará todas as turmas que este 
    // está cadastrado, caso seja aluno, todas as turmas que está matriculado.
    // a query será feita em tabelas diferentes para cada caso
    var table, tipoMatricula;
    if (req.session.typeuser == "aluno"){
      table = dbconfig.turma_aluno_table; tipoMatricula = "matriculaAluno";
    } else if (req.session.typeuser == "professor"){
      table = dbconfig.turmas_table; tipoMatricula = "matriculaProfessor";
    } else if (req.session.typeuser == "administrador") {
      res.render('pages/home', {
        user: req.user,
        title: "WebSmartCamera - Home",
        message: req.flash('signupMessage'),      
        tipoUsuario : req.session.typeuser  
      });
    }    
    
    var query =  "SELECT codigoDisciplina, id, nomeDisciplina FROM " + 
    table + ", " + dbconfig.disciplinas_table + 
    " WHERE codigo=codigoDisciplina AND " + tipoMatricula 
    + "='" + req.user.matricula + "' ORDER BY codigoDisciplina";   

    queryFile.data.selectSQLquery(query, function (result) {
      listaTurmasSessao = result;
      res.render('pages/home', {
        user: req.user,
        title: "WebSmartCamera - Home",
        lista : result,
        tipoUsuario : req.session.typeuser,
        turmasSessao : listaTurmasSessao
      }); 
    });

  });

  router.post('/lista_alunos', isLoggedIn, function (req, res){
    var query =  "SELECT DISTINCT matricula, nome FROM " + dbconfig.turma_aluno_table +
    ", " + dbconfig.alunos_table + " WHERE " + 
    " codigoDisciplina='" + req.body.codDisciplina + "'" +
    " AND id='" + req.body.idTurma + "'" + 
    " AND matriculaAluno=matricula";
    
    queryFile.data.selectSQLquery(query, function (result) {
      res.render('pages/lista_alunos_turma', {
        user: req.user,
        title: "WebSmartCamera - Lista Alunos",
        disciplina : req.body.codDisciplina,
        turma : req.body.idTurma,
        listaAlunos : result,
        tipoUsuario : req.session.typeuser,
        turmasSessao : listaTurmasSessao
      }); 
    });
  });

  //=================================================
  // LISTA DE TODAS AS DISCIPLINAS ==================
  // ================================================
  router.get('/lista_disciplinas', isLoggedIn, function (req, res) { 
    if (req.session.typeuser == "administrador") {
      var query =  "SELECT * FROM " + dbconfig.disciplinas_table; 
      queryFile.data.selectSQLquery(query, function (result) {
        res.render('pages/lista_disciplinas', {
         user: req.user,
         title: "WebSmartCamera - Lista Disciplinas",
         lista : result,
         message: req.flash('info'),
         tipoUsuario : req.session.typeuser
       }); 
      }); 
    } else res.redirect('/home');  
  });

  // processa o formulário de cadastro de disciplina
  router.post('/lista_disciplinas', function (req, res) {

    // cria diretório para upload de material da disciplina
    const fileFolder = './public/uploaded_files/';
    fs.stat(fileFolder + req.body.codDisciplina + "/", function (err, stats) {
      if (err) {
        // Directory doesn't exist or something.
        fs.mkdir(fileFolder + req.body.codDisciplina); 
        console.log('Folder doesn\'t exist, so I made the folder ' + req.body.codDisciplina);
      } else  console.log('Does exist'); 
    });

    var query =  "INSERT INTO " + dbconfig.disciplinas_table + 
    " (codigo, nomeDisciplina) VALUES (?,?)"; 
    var params = [req.body.codDisciplina,req.body.nomeDisciplina];

    queryFile.data.insertSQLquery(query, params, function (result){     
      req.flash('info', result);      
      res.redirect('/lista_disciplinas');
    });        
  });

  // formulario para deletar uma disciplina (e todos os registros com essa disciplina!!)
  router.post('/update_Disciplinas', function (req, res){
    var query = "DELETE FROM " + dbconfig.disciplinas_table + 
      " WHERE codigo = ?";   
    var params = [req.body.codigoDis]; 
    queryFile.data.deleteSQLquery(query, params, function (result) {
      req.flash('info', result);      
      res.redirect('/lista_disciplinas');
    }); 
  });

  //=================================================
  // LISTA DE TODAS AS TURMAS =======================
  // ================================================
  router.get('/lista_turmas', isLoggedIn, function (req, res) {
    if (req.session.typeuser == "administrador") { 
      var query = "SELECT * FROM " + dbconfig.turmas_table + " ORDER BY codigoDisciplina"; 
      var query2 = "SELECT matricula, nome FROM " + dbconfig.professores_table;  
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
          message: req.flash('info'),
          tipoUsuario : req.session.typeuser
        }); 
      });   
    } else res.redirect('/home');
  });

  // processa o formulário de cadastro de turmas
  router.post('/lista_turmas', function (req, res) {
    // Seleciona o id máximo das turmas da disciplina
    var queryId = "SELECT MAX(id) FROM " + dbconfig.turmas_table + 
    " WHERE codigoDisciplina='" + req.body.codDisciplina + "'";
    var novoId = 1;
    
    // Se alguma turma dessa disciplina já estiver cadastrada, 
    //o id será + 1, caso contrário é setado como 1
    queryFile.data.selectSQLquery(queryId, function (result){
      if (result.length > 0){
        novoId = result[0]['MAX(id)'] + 1;
        console.log("novoID " + novoId);
      }
      var query =  "INSERT INTO " + dbconfig.turmas_table + 
      " (id, matriculaProfessor, codigoDisciplina) VALUES (?,?,?)"; 
      var params = [novoId, req.body.matriculaProf, req.body.codDisciplina];

      queryFile.data.insertSQLquery(query, params, function (result){     
        req.flash('info', result);      
        res.redirect('/lista_turmas');
      });        
    });
  });

  // ================================================
  // LISTA TODOS OS PROFESSORES =====================
  // ================================================
  router.get('/lista_professores', isLoggedIn, function (req, res) { 
    if (req.session.typeuser == "administrador") { 
      var query =  "SELECT * FROM " + dbconfig.professores_table + " ORDER BY nome"; 
      queryFile.data.selectSQLquery(query, function (result) {
        res.render('pages/lista_professores', {
          user: req.user,
          title: "WebSmartCamera - Listar de Professores",
          lista : result,
          message: req.flash('info'),
          tipoUsuario : req.session.typeuser
        }); 
      }); 
    } else res.redirect('/home');  
  });

  // ================================================
  // MATRICULAR ALUNO NAS DISCIPLINAS CADASTRADAS ===
  // ================================================
  router.get('/matricular', isLoggedIn, function (req, res) {
    if (req.session.typeuser == "administrador") { 
      var query = "SELECT matricula, nome FROM " + dbconfig.alunos_table;
      var query2 = "SELECT codigoDisciplina, id FROM " + dbconfig.turmas_table; 
      var query3 = "SELECT id, matriculaAluno, codigoDisciplina FROM " + dbconfig.turma_aluno_table;
      var listaTurmas, listaAlunos;

      queryFile.data.selectSQLquery(query, function (result){
        listaAlunos = result;
      });
      queryFile.data.selectSQLquery(query2, function (result){
        listaTurmas = result;
      });
      queryFile.data.selectSQLquery(query3, function (result) {
        res.render('pages/matricular', {
          user: req.user,
          title: "WebSmartCamera - Matricular",
          listaDeMatriculados : result,
          listaDeAlunos : listaAlunos,
          listaDeTurmas : listaTurmas,
          message: req.flash('info'),
          tipoUsuario : req.session.typeuser
        }); 
      });   
    } else res.redirect('/home');
  });

  router.post('/matricular', function (req, res) {
    var query =  "INSERT INTO " + dbconfig.turma_aluno_table + 
    " (id, matriculaAluno, codigoDisciplina) VALUES (?,?,?)"; 
    var separado = req.body.codDisciplina.split("-");
    //CodigoDisciplina - ID Turma
    var params = [separado[1], req.body.matriculaAluno, separado[0]];
    queryFile.data.insertSQLquery(query, params, function (result){     
      req.flash('info', result);      
      res.redirect('/matricular');
    });        
  });

  // =================================================
  // PAGINA PARA ASSISTIR AULA EM TRANSMISSAO ========
  // =================================================
 /* router.get('/video', isLoggedIn, function (req, res) {
      var query =  "SELECT codigoDisciplina, id FROM " + dbconfig.turmas_table +
        " WHERE matriculaProfessor = '" + req.user.matricula + "';"; 
      queryFile.data.selectSQLquery(query, function (result) {
        res.render('pages/video', {
          user: req.user,
          title: "WebSmartCamera - Aula ao Vivo",
          tipoUsuario : req.session.typeuser,
          listaTurmas : result,
          turmasSessao : listaTurmasSessao
        });
      });

      
    
      /*var childProcess = require('child_process');

        var spawn = childProcess.spawn;

    //function spawnFfmpeg(exitCallback) {
      var args = ['-f', 'v4l2', '-framerate', '25', '-video_size', '640x480', '-i', '/dev/video0', 
      '-f', 'alsa', '-ar', '44100', '-ac', '1', '-i', 'hw:1,0', '-f', 'mpegts','-codec:v',
      'mpeg1video', '-s', '640x480', '-b:v', '1000k', '-bf', '0', '-codec:a', 'mp2', '-b:a', '128k',
      '-muxdelay', '0.001', 'http://localhost:8081'];

      var ffmpeg = spawn('ffmpeg', args);

      console.log('Spawning ffmpeg ' + args.join(' '));*/



    /*}else{
      res.render('pages/video', {
        user: req.user,
        title: "WebSmartCamera - Aula ao Vivo",
        tipoUsuario : req.session.typeuser
      });
    }*/

  //});

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
      res.redirect('/home');
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
    successRedirect: 'home', 
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
  // we will use route middleware to verify this (the isLoggedIn function)
  router.get('/profile', isLoggedIn, function (req, res) {
    res.render('pages/profile', {
      user: req.user, // get the user out of session and pass to template
      title: "WebSmartCamera - Perfil Usuário",
      tipoUsuario : req.session.typeuser,
      turmasSessao : listaTurmasSessao
    });
  });

  router.post('/add_user_image', function (req, res) {
    if (!req.files) res.redirect('/profile');
    var file = req.files.uploaded_image;
    var img_name = file.name;
    console.log("tipo: "+ file.mimetype + " nome: " + file.name);
   
    var tableSelected;
    if (req.session.typeuser== "administrador") 
      tableSelected = dbconfig.admin_table;
    else if (req.session.typeuser == "professor") 
      tableSelected = dbconfig.professores_table; 
    else if (req.session.typeuser == "aluno") 
      tableSelected = dbconfig.alunos_table; 

    // Se a imagem for de formato aceitável
    if (file.mimetype == "image/jpeg" || 
      file.mimetype == "image/png" || file.mimetype == "image/gif" ){
        file.mv('public/img/user_upload_images/'+ file.name, function(err) {
          if (err) return res.status(500).send(err);
          var query =  "UPDATE " + tableSelected + " SET " +
          " image = ? WHERE matricula = ? "; 
          var params = [img_name, req.user.matricula];
          queryFile.data.updateSQLquery(query, params, function (result){  
            res.redirect('/profile');
          });        
       });
    } else {
      console.log("This format is not allowed , please upload file with '.png','.gif','.jpg'");
      //console.log("tipo: "+ file.mimetype + " nome: " + file.name + " tamanho: " + req.files.uploaded_image.size);
      res.redirect('/profile');
    } 
  });
  
  router.post('/upload_file', function (req, res) {
    var file = req.files.uploaded_file;
    var file_name = file.name;
    var codDis = req.body.codDisciplina;     

    if (file.mimetype == 'application/pdf') {
      file.mv('public/uploaded_files/' + codDis + '/'+ file.name, function(err) {
        if (err) return res.status(500).send(err);
        var query =  "INSERT INTO " + dbconfig.arquivos_table + 
        " (id,caminho,codigoDisciplina, titulo) VALUES (?,?,?,?)"; 
        var params = [req.body.idTurma ,file.name, codDis,req.body.nomeArquivo];
        queryFile.data.insertSQLquery(query, params, function (result){     
          res.redirect('/'+ codDis + '?turma=' + req.body.idTurma);
        });       
     });
    } else res.redirect('/'+ codDis + '?turma=' + req.body.idTurma);
  });
  
  router.get('/turma' + ':courseId', isLoggedIn, function (req, res){
	  
	  var separado = req.params.courseId.split("_");
	  console.log("courseId= " + separado[1]);
      var filesList=0, disciplinaPagina;
      var matriculaType, table;
      
      if (req.session.typeuser == 'professor') {
        matriculaType = 'matriculaProfessor';
        table = dbconfig.turmas_table;
      }
      else if(req.session.typeuser == 'aluno') {
        matriculaType = 'matriculaAluno';
        table = dbconfig.turma_aluno_table;
      }
      var query =  "SELECT codigoDisciplina, id, nomeDisciplina FROM " + table + ", " + 
        dbconfig.disciplinas_table + " WHERE codigo = codigoDisciplina AND " + 
        matriculaType + " = '" + req.user.matricula + "' AND codigoDisciplina='" + separado[1] + "';"; 

      queryFile.data.selectSQLquery(query, function (result) {
        //console.log("tentou fazer a select query uma vez");  
        console.log('disciplina: ' + result[0].nomeDisciplina);
        console.log('id da turma: ' + result[0].id); 
    	  disciplinaPagina = result[0];

        // Seleciona os arquivos cadastrados dessa disciplina (PDFs)
        var query2 =  "SELECT * FROM " + dbconfig.arquivos_table + 
        " WHERE id ='"+ separado[0] + "'  AND codigoDisciplina='" + separado[1] + "';";
  
        queryFile.data.selectSQLquery(query2, function (result2) {
          filesList = result2;
          console.log("fez a query dos arquivos");
          res.render('pages/disciplina', {
            user: req.user,
            title: "WebSmartCamera - " + separado[1],
            turma : separado[0],
            disciplina: disciplinaPagina,
            tipoUsuario : req.session.typeuser,
            listaArquivos : filesList,
            turmasSessao : listaTurmasSessao
          });
        });    
      });
    } );
  
  router.get('/video' + ':courseId' ,isLoggedIn, function (req, res){
	  var separado = req.params.courseId.split("_");
	  console.log("courseId= " + separado[1]);
	  
	  //console.log("lala2");
  	//console.log("Pediu pra assistir video " + req.query.video + " da matéria "); 
  	var query =  "SELECT codigoDisciplina, id FROM " + dbconfig.turmas_table +
      " WHERE matriculaProfessor = '" + req.user.matricula + "';"; 
    
  	queryFile.data.selectSQLquery(query, function (result) {
      res.render('pages/video', {
        user: req.user,
        title: "WebSmartCamera - Aula ao Vivo",
        //video: req.query.video,
        tipoUsuario : req.session.typeuser,
        listaTurmas : result,
        turmasSessao : listaTurmasSessao
      });
      
      if(req.session.typeuser == "professor"){

          var childProcess = require('child_process');

          var spawn = childProcess.spawn;

      //function spawnFfmpeg(exitCallback) {
        var args = ['-f', 'v4l2', '-framerate', '25', '-video_size', '640x480', '-i', '/dev/video0', 
        '-f', 'alsa', '-ar', '44100', '-ac', '1', '-i', 'hw:1,0', '-f', 'mpegts','-codec:v',
        'mpeg1video', '-s', '640x480', '-b:v', '1000k', '-bf', '0', '-codec:a', 'mp2', '-b:a', '128k',
        '-muxdelay', '0.001', 'http://localhost:8081'];

        var ffmpeg = spawn('ffmpeg', args);

        console.log('Spawning ffmpeg ' + args.join(' '));

        }
    });
  
  });
  
  router.get('/aula', isLoggedIn, function (req, res) {
    var courseId = req.params.courseId;
    console.log("Página " + courseId + " foi pedida.");
        
    //cria página com o vídeo da disciplina pedida
    //if (req.query.aula != null){
     // console.log("Pediu pra assistir aula " + req.query.aula + " da matéria "); 
      res.render('pages/assistir', {
        user: req.user,
        title: "WebSmartCamera - AULA TAL",
        aula: 1,
        tipoUsuario : req.session.typeuser,
        turmasSessao : listaTurmasSessao
      });
   // } 
  

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