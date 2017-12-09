'use strict';
const fs = require('fs'); // File System module
var live = false;

module.exports = function (express, passport) {

	var dbconfig = require('../config/database'); // load database model
	var queryFile = require('../config/querys.js'); // load methods for sql
	// querys
	var router = express.Router(); // Create router instance
	var listaTurmasSessao = {}; // store list of turmas from session
	var listaNotificacoesSessao = {}; // store list of notifications from newest
	// files
	var discVideo, turmaVideo, ffmpeg;

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

		if (req.session.typeuser == "aluno" || req.session.typeuser == "professor"){

			var query =  "SELECT codigoDisciplina, id, nomeDisciplina FROM " + 
			table + ", " + dbconfig.disciplinas_table + 
			" WHERE codigo=codigoDisciplina AND " + tipoMatricula 
			+ "='" + req.user.matricula + "' ORDER BY codigoDisciplina";  

			// Seleciona os ultimos arquivos cadastrados nas disciplinas
			// matriculadas
			var query2 =  "SELECT DISTINCT arquivo.id, arquivo.codigoDisciplina, titulo, timestamp " + 
			" FROM " + dbconfig.arquivos_table + "," + table +
			" WHERE " + tipoMatricula + "='" + req.user.matricula +
			"' AND arquivo.id = " + table + ".id  AND " +
			" arquivo.codigoDisciplina = " + table + ".codigoDisciplina " +
			"ORDER BY timestamp DESC LIMIT 5" + ";"; 

			queryFile.data.selectSQLquery(query, function (result) {
				listaTurmasSessao = result;

				queryFile.data.selectSQLquery(query2, function(result2) {
					listaNotificacoesSessao = result2;

					res.render('pages/home', {
						user: req.user,
						title: "WebSmartCamera - Home",
						lista : result,
						tipoUsuario : req.session.typeuser,
						turmasSessao : listaTurmasSessao,            
						notificacoesSessao : listaNotificacoesSessao
					}); 
				});
			});
		} 
	});

	router.get('/homeSim', isLoggedIn, function (req, res) { 

		ffmpeg.kill();

		const fileFolder = 'public/movies/';
		fs.stat(fileFolder + discVideo +  "_" + turmaVideo + "/", function (err, stats) {
			if (err) {
				// Directory doesn't exist or something.
				fs.mkdir(fileFolder + discVideo + "_" + turmaVideo); 
				console.log('Folder doesn\'t exist, so I made the folder ');
			} 
			else  console.log('Does exist'); 
		});

		var newFile = fileFolder + discVideo +"_" + turmaVideo;

		var query = "SELECT titulo FROM " + dbconfig.arquivos_table + " WHERE caminho='" 
		+ newFile + "' ORDER BY titulo DESC";


		queryFile.data.selectSQLquery(query, function (result) { 
			var novoId = 1;
			if (result.length > 0){
				var separado = (result[0]['titulo']).split("_");
				novoId = parseInt(separado[1]) + 1;
				console.log("novoID " + novoId);
			}

			var query2 =  "INSERT INTO " + dbconfig.arquivos_table + 
			" (id, caminho, codigoDisciplina, titulo) VALUES (?,?,?,?)"; 
			var nome = ("aula_" + novoId);
			var params = [turmaVideo, newFile, discVideo, nome];

			queryFile.data.insertSQLquery(query2, params, function (result){     
				fs.rename('./recordings/novoVideo.ts', (newFile + "/aula_" + novoId + ".ts"), (err) => {
					if (err) throw err;
					fs.stat(newFile, (err, stats) => {
						if (err) throw err;
						console.log(`stats: ${JSON.stringify(stats)}`);
					});
				});

				res.redirect('/home');
			});   
		});	  

	});

	router.get('/homeNao', isLoggedIn, function (req, res) {   

		ffmpeg.kill();
		live = false;

		fs.stat('/home/pi/Desktop/WebSmartCamera/recordings/novoVideo.ts', function (err, stats) {
			console.log(stats);// here we got all information of file in stats
			// variable

			if (err) {
				return console.error(err);
			}

			fs.unlinkSync('/home/pi/Desktop/WebSmartCamera/recordings/novoVideo.ts' ,function(err){
				if(err) return console.log(err);
				console.log('file deleted successfully');
			});  
		});
		res.redirect('/home');

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
				turmasSessao : listaTurmasSessao,
				notificacoesSessao : listaNotificacoesSessao
			}); 
		});
	});

	// =================================================
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

		var query =  "INSERT INTO " + dbconfig.disciplinas_table + 
		" (codigo, nomeDisciplina) VALUES (?,?)"; 
		var params = [req.body.codDisciplina,req.body.nomeDisciplina];

		queryFile.data.insertSQLquery(query, params, function (result){     
			req.flash('info', result);      
			res.redirect('/lista_disciplinas');
		});        
	});

	// formulario para deletar uma disciplina (e todos os registros com essa
	// disciplina!!)
	router.post('/update_Disciplinas', function (req, res){
		var query = "DELETE FROM " + dbconfig.disciplinas_table + 
		" WHERE codigo = ?";   
		var params = [req.body.codigoDis]; 
		queryFile.data.deleteSQLquery(query, params, function (result) {
			req.flash('info', result);      
			res.redirect('/lista_disciplinas');
		}); 
	});

	// =================================================
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
		// o id será + 1, caso contrário é setado como 1
		queryFile.data.selectSQLquery(queryId, function (result){
			if (result.length > 0){
				novoId = result[0]['MAX(id)'] + 1;
				console.log("novoID " + novoId);
			}

			// cria diretório para upload de material da disciplina
			const fileFolder = './public/uploaded_files/';
			fs.stat(fileFolder + req.body.codDisciplina +"_" + novoId + "/", function (err, stats) {
				if (err) {
					// Directory doesn't exist or something.
					fs.mkdir(fileFolder + req.body.codDisciplina +"_" + novoId); 
					console.log('Folder doesn\'t exist, so I made the folder ' + req.body.codDisciplina);
				} else  console.log('Does exist'); 
			});

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
		// CodigoDisciplina - ID Turma
		var params = [separado[1], req.body.matriculaAluno, separado[0]];
		queryFile.data.insertSQLquery(query, params, function (result){     
			req.flash('info', result);      
			res.redirect('/matricular');
		});        
	});

	// =================================================
	// LOGIN - HOME PAGE ===============================
	// =================================================
	// show the login form
	router.get('/', function (req, res) {
		if (req.user) {
			// if user is logged he will be redirected to index page
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
			turmasSessao : listaTurmasSessao,
			notificacoesSessao : listaNotificacoesSessao
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
			// console.log("tipo: "+ file.mimetype + " nome: " + file.name + "
			// tamanho: " + req.files.uploaded_image.size);
			res.redirect('/profile');
		} 
	});

	router.post('/upload_file', function (req, res) {
		var file = req.files.uploaded_file;
		var file_name = file.name;
		var codDis = req.body.codDisciplina;  
		var idTurma = req.body.idTurma.trim();

		if (file.mimetype == 'application/pdf') {
			file.mv('public/uploaded_files/' + codDis + "_" + idTurma +'/'+ req.body.nomeArquivo, function(err) {
				if (err) return res.status(500).send(err);
				var query =  "INSERT INTO " + dbconfig.arquivos_table + 
				" (id,caminho,codigoDisciplina, titulo) VALUES (?,?,?,?)"; 
				var params = [req.body.idTurma ,('public/uploaded_files/' + codDis + "_" + idTurma), codDis,req.body.nomeArquivo];
				queryFile.data.insertSQLquery(query, params, function (result){     
					res.redirect('/turma'+ idTurma + '_' + codDis);
				});       
			});
		} else res.redirect('/turma'+ idTurma + '_' + codDis);
	});

	router.get('/turma' + ':courseId', isLoggedIn, function (req, res){

		var separado = req.params.courseId.split("_");
		console.log("courseId= " + separado[1]);
		var filesList=0, disciplinaPagina, videosLista = 0;
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
			// console.log("tentou fazer a select query uma vez");
			console.log('disciplina: ' + result[0].nomeDisciplina);
			console.log('id da turma: ' + result[0].id); 
			disciplinaPagina = result[0];


			var path = "public/uploaded_files/" + separado[1] + "_" + separado[0].trim();

			// console.log(path);

			discVideo = separado[1];
			turmaVideo = separado[0].trim();

			// Seleciona os arquivos cadastrados dessa disciplina (PDFs)
			var query2 =  "SELECT titulo, DATE_FORMAT( `timestamp` , '%d/%c/%Y %H:%i:%s' ) AS `timestamp` FROM "
				+ dbconfig.arquivos_table + " WHERE caminho='" + path + "' ORDER BY timestamp DESC";


			var caminho = "public/movies/" + separado[1] + "_" + separado[0];
			var queryVideos = "SELECT titulo, DATE_FORMAT( `timestamp` , '%d/%c/%Y %H:%i:%s' ) AS `timestamp` FROM " 
				+ dbconfig.arquivos_table + " WHERE caminho='" + caminho + "' ORDER BY timestamp DESC";


			queryFile.data.selectSQLquery(queryVideos, function (result3) {
				videosLista = result3;

				queryFile.data.selectSQLquery(query2, function (result2) {
					filesList = result2;

					console.log("arquivos: " + result2[0]);
					console.log("fez a query dos arquivos");
					res.render('pages/disciplina', {
						user: req.user,
						title: "WebSmartCamera - " + separado[1],
						turma : separado[0],
						disciplina: disciplinaPagina,
						tipoUsuario : req.session.typeuser,
						listaArquivos : filesList,
						aovivo : live,
						listaVideos : videosLista,
						turmasSessao : listaTurmasSessao,
						notificacoesSessao : listaNotificacoesSessao            
					});
				});    
			});
		});
	} );

	router.get('/video' + ':courseId' ,isLoggedIn, function (req, res){
		var separado = req.params.courseId.split("_");
		console.log("courseId= " + separado[1]);
		discVideo = separado[1];
		turmaVideo = separado[0];

		// console.log("Pediu pra assistir video " + req.query.video + " da
		// matéria ");
		var query =  "SELECT codigoDisciplina, id FROM " + dbconfig.turmas_table +
		" WHERE matriculaProfessor = '" + req.user.matricula + "';"; 

		queryFile.data.selectSQLquery(query, function (result) {
			res.render('pages/video', {
				user: req.user,
				title: "WebSmartCamera - Aula ao Vivo",
				tipoUsuario : req.session.typeuser,
				listaTurmas : result,
				turmasSessao : listaTurmasSessao,
				notificacoesSessao : listaNotificacoesSessao
			});

			if(req.session.typeuser == "professor"){

				var childProcess = require('child_process');
				var spawn = childProcess.spawn;

				var args = ['-f', 'v4l2', '-framerate', '25', '-video_size', '640x480', '-i', '/dev/video0', 
					'-f', 'alsa', '-ar', '44100', '-ac', '1', '-i', 'hw:1,0', '-f', 'mpegts','-codec:v',
					'mpeg1video', '-s', '640x480', '-b:v', '1000k', '-bf', '0', '-codec:a', 'mp2', '-b:a', '128k',
					'-muxdelay', '0.001', 'http://localhost:8081'];

				ffmpeg = spawn('ffmpeg', args);
				live = true;

				console.log('Spawning ffmpeg ' + args.join(' '));
			}
		});

	});

	return router;
};

//route middleware to make sure user is logged
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();
	// if they aren't redirect them to the home page
	res.redirect('/');
}