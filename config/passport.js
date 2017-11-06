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
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(req,id, done) {
		var tableSelected;
		if (req.session.typeuser == "aluno") 
			tableSelected = dbconfig.alunos_table;
		else if (req.session.typeuser == "administrador")
			tableSelected = dbconfig.admin_table;
		else if (req.session.typeuser == "professor")
			tableSelected = dbconfig.professores_table;

		connection.query("SELECT * FROM " + tableSelected  + " WHERE id = ? ",[id], 
			function(err, rows){
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
			usernameField : 'username',
			passwordField : 'password',
			passReqToCallback : true 
			// allows us to pass back the entire request to the callback
		},
		function(req, username, password, done) {
			
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
				" WHERE username = ?", [username], function(err, rows) {
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
						username: username,
						sex: req.body.sexo,
						email: req.body.email,
						password: bcrypt.hashSync(password, null, null),  
						// use the generateHash function in our user model                        
					};

					var insertQuery = "INSERT INTO " +  tableSelected  + 
						" ( matricula, username, sexo, email, password )" +
						" values (?,?,?,?,?) ";

					connection.query(insertQuery,[newUserMysql.matricula, 
						newUserMysql.username, newUserMysql.sex, 
						newUserMysql.email, newUserMysql.password],
						function(err, rows) {
							//pass to the session the user type to unlock rights
							//req.session.typeuser = req.body.tipoUsuario;

							newUserMysql.id = rows.insertId;
							return done(null, false, req.flash('signupMessage', 
							'Usuário cadastrado com sucesso.'),newUserMysql);
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
			usernameField : 'username',
			passwordField : 'password',
			passReqToCallback : true 
			// allows us to pass back the entire request to the callback
		},
		function(req, username, password, done) { 

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
			connection.query("SELECT * FROM " + tableSelected  + " WHERE username = ?",
				[username], function(err, rows){
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
				// all is well, return successful user
				return done(null, rows[0]);
			});
		})
	);

};