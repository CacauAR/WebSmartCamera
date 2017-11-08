// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	/* 
		OBS: serializeUser determines, which data of the user object should be 
		stored in the session. The result of the serializeUser method is attached to
		the session as req.session.passport.user = {}.
	*/

	passport.serializeUser(function(user, done) {
		//console.log("Serializou o usuario de matricula: " + user.matricula);
		done(null, user.matricula);
	});

	/* 
		OBS: The first argument of deserializeUser corresponds to the key of the user 
		object that was given to the done function (serialize). So your whole object is
		retrieved with help of that key. That key here is the user id (key can be 
		any key of the user object i.e. name,email etc). In deserializeUser that key
		is matched with the in memory array / database or any data resource.
		The fetched object is attached to the request object as req.user
	*/

	// used to deserialize the user
	passport.deserializeUser(function(req,key, done) {
		var tableSelected;
		if (req.session.typeuser == "aluno") 
			tableSelected = dbconfig.alunos_table;
		else if (req.session.typeuser == "administrador")
			tableSelected = dbconfig.admin_table;
		else if (req.session.typeuser == "professor")
			tableSelected = dbconfig.professores_table;

		connection.query("SELECT * FROM " + tableSelected  + " WHERE matricula = '" + key + "'", 
			function(err, rows){
			//console.log("deserializou o usuario de matricula: " + key);
			done(err, rows[0]);
		});
	});

	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for 
	// signup by default, if there was no name, it would just be called 'local'

	passport.use(
		'local-signup',
		new LocalStrategy({
			// by default, local strategy uses username and password, 
			//we will override with email
			usernameField : 'matricula',
			passwordField : 'password',
			passReqToCallback : true 
			// allows us to pass back the entire request to the callback
		},
		function(req, matricula, password, done) {
			
			var tableSelected;

			if (req.body.tipoUsuario == "administrador"){
				console.log("Tentou cadastrar administrador.");
				tableSelected = dbconfig.admin_table;
			}
			else if (req.body.tipoUsuario == "professor"){
				console.log("Tentou cadastrar professor");
				tableSelected = dbconfig.professores_table; 
			}
			else if (req.body.tipoUsuario == "aluno") {
				console.log("Tentou cadastrar  aluno");
				tableSelected = dbconfig.alunos_table; 
			}

			// find a user whose username is the same as the forms username
			// we are checking to see if the user trying to login already exists
			connection.query("SELECT * FROM " +  tableSelected  + 
				" WHERE matricula = ?", [matricula], function(err, rows) {
				if (err)
					return done(err);
				if (rows.length) {
					return done(null, false, req.flash('signupMessage', 
						'That username is already taken.'));
				} else {
					// if there is no user with that username
					// create the user
					var newUserMysql = {
						matricula: req.body.matricula,
						nome: req.body.nome,
						sex: req.body.sexo,
						email: req.body.email,
						password: bcrypt.hashSync(password, null, null),  
						// use the generateHash function in our user model                        
					};

					var insertQuery = "INSERT INTO " +  tableSelected  + 
						" ( matricula, nome, sexo, email, password )" +
						" values (?,?,?,?,?) ";

					connection.query(insertQuery,[newUserMysql.matricula, 
						newUserMysql.nome, newUserMysql.sex, 
						newUserMysql.email, newUserMysql.password],
						function(err, rows) {
							return done(null, false, req.flash('signupMessage', 
							'Usuário cadastrado com sucesso.'));
					});
				}
			});
		})
	);

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for 
	// signup by default, if there was no name, it would just be called 'local'

	passport.use(
		'local-login',
		new LocalStrategy({
			// by default, local strategy uses username and password, 
			//we will override with email
			usernameField : 'matricula',
			passwordField : 'password',
			passReqToCallback : true 
			// allows us to pass back the entire request to the callback
		},
		function(req, matricula, password, done) { 

			var tableSelected;

			if (req.body.tipoUsuario == "administrador"){
				console.log("Tentou logar como administrador.");
				tableSelected = dbconfig.admin_table;
			}
			else if (req.body.tipoUsuario == "professor"){
				console.log("Tentou logar como professor");
				tableSelected = dbconfig.professores_table; 
			}
			else if (req.body.tipoUsuario == "aluno") {
				console.log("Tentou logar como aluno");
				tableSelected = dbconfig.alunos_table; 
			}

			// callback with email and password from our form
			connection.query("SELECT * FROM " + tableSelected  + " WHERE matricula = ?",
				[matricula], function(err, rows){
				if (err)
					return done(err);
				if (!rows.length) {
					return done(null, false, req.flash('loginMessage', 
					'No user found.')); 
					// req.flash is the way to set flashdata using connect-flash
				}

				// if the user is found but the password is wrong
				if (!bcrypt.compareSync(password, rows[0].password))
					return done(null, false, req.flash('loginMessage', 
					'Oops! Wrong password.')); 
				// create the loginMessage and save it to session as flashdata

				//pass to the session the user type to unlock rights
				req.session.typeuser = req.body.tipoUsuario;
				req.session.matricula = matricula;
				console.log("Matricula selecionada para sessão: " + matricula);

				// all is well, return successful user
				return done(null, rows[0]);
			});
		})
	);

};