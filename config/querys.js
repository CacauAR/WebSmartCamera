// config/querytest.js

var mysql = require('mysql');
var dbconfig = require('../config/database'); // load up the user model
const connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database); 

var methods = {};    

  // selectSQLquery recebe a query e retorna por callback o resultado pedido 
  methods.selectSQLquery  = function (sqlQuery, callback) {     
    console.log ('Chamou query de select');  
    connection.query(sqlQuery, function (error, rows, fields) {
      if (error) return console.log(error);
      callback (rows);
    });   
  }

  // insertSQLquery recebe a query e um array com os parâmetros a serem
  // inseridos e retorna por callback a confirmação ou erro
  methods.insertSQLquery = function (sqlQuery, params, callback) {
    console.log ('Chamou query de insert');  
    var message;
    connection.query(sqlQuery, params, function (error, rows, fields) {
        if (error) {message = 1; console.log(error);} 
        // mostra a mensagem de erro na página
        else message = 2;  // mostra a mensagem de sucesso na página
        callback(message);        
    });
  }

  methods.deleteSQLquery = function (sqlQuery, params, callback) {
    var message;
    console.log('Chamou query de deletar');
    connection.query(sqlQuery, params, function (error, rows, fields){
      if (error) {message = 3; console.log(error);} 
      // mostra a mensagem de erro na página
      else message = 4; // mostra a mensagem de sucesso na página
      callback (message);
    });
  }

  methods.updateSQLquery  = function (sqlQuery, params, callback) {     
    console.log ('Chamou query de alterar');
    connection.query(sqlQuery, params, function (error, rows, fields) {
      if (error) {message = 3; console.log(error);} 
      // mostra a mensagem de erro na página
      else message = 4; // mostra a mensagem de sucesso na página
      callback (message);
    });   
  } 

exports.data = methods;  