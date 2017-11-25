var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');

var connection = mysql.createConnection(dbconfig.connection);

connection.query('CREATE DATABASE ' + dbconfig.database);

connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.admin_table + '` ( \
    `matricula` VARCHAR (7) NOT NULL, \
    `nome` VARCHAR(80) NOT NULL, \
    `sexo` CHAR(1) NOT NULL, \
    `email` VARCHAR(100) NOT NULL, \
    `password` CHAR(60) NOT NULL, \
    `image` VARCHAR(255), \
        PRIMARY KEY (`matricula`), \
    UNIQUE INDEX `matricula_UNIQUE` (`matricula` ASC), \
    UNIQUE INDEX `nome_UNIQUE` (`nome` ASC) \
)');


connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.alunos_table + '` ( \
    `matricula` VARCHAR (7) NOT NULL, \
    `nome` VARCHAR(80) NOT NULL, \
    `sexo` CHAR(1), \
    `email` VARCHAR(100), \
    `password` CHAR(60) NOT NULL, \
    `image` VARCHAR(255), \
        PRIMARY KEY (`matricula`), \
    UNIQUE INDEX `matricula_UNIQUE` (`matricula` ASC), \
    UNIQUE INDEX `nome_UNIQUE` (`nome` ASC) \
)');

connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.professores_table + '` ( \
    `matricula` VARCHAR(7) NOT NULL, \
    `nome` VARCHAR(80) NOT NULL, \
    `sexo` CHAR(1), \
    `email` VARCHAR(100), \
    `password` CHAR(60) NOT NULL, \
    `image` VARCHAR(255), \
        PRIMARY KEY (`matricula`), \
    UNIQUE INDEX `matricula_UNIQUE` (`matricula` ASC), \
    UNIQUE INDEX `nome_UNIQUE` (`nome` ASC) \
)');


connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.disciplinas_table + '` ( \
    `codigo` CHAR(6) NOT NULL, \
    `nomeDisciplina` VARCHAR (60) NOT NULL, \
        PRIMARY KEY (`codigo`), \
    UNIQUE INDEX `codigo_UNIQUE` (`codigo` ASC), \
    UNIQUE INDEX `nomeDisciplina_UNIQUE` (`nomeDisciplina` ASC) \
)');


connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.turmas_table + '` ( \
    `id` INT NOT NULL, \
    `matriculaProfessor` VARCHAR (7) NOT NULL, \
    `codigoDisciplina` CHAR(6) NOT NULL, \
        PRIMARY KEY (`id`, `codigoDisciplina`), \
    CONSTRAINT `matriculaProf` FOREIGN KEY (`matriculaProfessor`) \
        REFERENCES `' + dbconfig.database + '`.`'+ dbconfig.professores_table + '` (`matricula`) \
        ON DELETE CASCADE ON UPDATE CASCADE, \
    CONSTRAINT `codigoDis` FOREIGN KEY (`codigoDisciplina`) \
        REFERENCES `' + dbconfig.database + '`.`'+ dbconfig.disciplinas_table + '` (`codigo`) \
        ON DELETE CASCADE ON UPDATE CASCADE \
)');

connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.turma_aluno_table + '` ( \
    `id` INT NOT NULL, \
    `matriculaAluno` VARCHAR (7) NOT NULL, \
    `codigoDisciplina` CHAR(6) NOT NULL, \
        PRIMARY KEY (`matriculaAluno`, `codigoDisciplina`), \
    CONSTRAINT `IDTurma` FOREIGN KEY (`id`) \
        REFERENCES `' + dbconfig.database + '`.`'+ dbconfig.turmas_table + '` (`id`)\
        ON DELETE CASCADE ON UPDATE CASCADE, \
    CONSTRAINT `codigoDisc` FOREIGN KEY (`codigoDisciplina`) \
        REFERENCES `' + dbconfig.database + '`.`'+ dbconfig.disciplinas_table + '` (`codigo`) \
        ON DELETE CASCADE ON UPDATE CASCADE, \
    CONSTRAINT `MatriculaAluno` FOREIGN KEY (`matriculaAluno`) \
        REFERENCES `' + dbconfig.database + '`.`'+ dbconfig.alunos_table + '` (`matricula`) \
        ON DELETE CASCADE ON UPDATE CASCADE \
)');

connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.arquivos_table + '` ( \
    `id` INT NOT NULL, \
    `caminho` VARCHAR (255) NOT NULL, \
    `codigoDisciplina` CHAR(6) NOT NULL, \
    `titulo` VARCHAR(255) NOT NULL, \
        PRIMARY KEY (`titulo`), \
    CONSTRAINT `idT` FOREIGN KEY (`id`) \
    REFERENCES `' + dbconfig.database + '`.`'+ dbconfig.turmas_table + '` (`id`)\
    ON DELETE CASCADE ON UPDATE CASCADE, \
    CONSTRAINT `codigoDisciFile` FOREIGN KEY (`codigoDisciplina`) \
        REFERENCES `' + dbconfig.database + '`.`'+ dbconfig.disciplinas_table + '` (`codigo`) \
        ON DELETE CASCADE ON UPDATE CASCADE \
)');


console.log('Success: Database Created!')
connection.query('USE ' + dbconfig.database); 

var newUserMysql = {
                        matricula: "es00001",
                        username: "root",
                        sex: "m",
                        email: "test@ufv.br",
                        password: bcrypt.hashSync("123", null, null), 
                        image : "avatar_m.png"
                        // use the generateHash function in our user model                        
                    };

var insertQuery = "INSERT INTO administrador (matricula, nome, sexo, email, password, image )" +
                  " VALUES (?,?,?,?,?,?) ";

connection.query(insertQuery,[newUserMysql.matricula, 
    newUserMysql.username, newUserMysql.sex, 
    newUserMysql.email, newUserMysql.password, newUserMysql.image],
    function (err, result) {
        if (err) throw err;
        console.log("Administrador es00001 inserted");
    });

connection.end();
