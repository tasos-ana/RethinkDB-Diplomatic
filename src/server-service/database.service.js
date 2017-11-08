"use strict";
var rethinkdb = require('rethinkdb');
var async = require('async');

class DatabaseService {
    setupDb() {
        var self = this;
        async.waterfall([
            function(callback) {
                self.connectToRethinkDbServer(function(err, connection) {
                    if (err) {
                        return callback(true, "Error in connecting RethinkDB");
                    }
                    callback(null, connection);
                });
            },
            function(connection, callback) {
                rethinkdb.dbCreate('pushUP').run(connection, function(err, result) {
                    if (err) {
                        console.log("Database with name'pushUP' already created");
                    } else {
                        console.log("Created new database with name 'pushUP'");
                    }
                    callback(null, connection);
                });
            },
            function(connection, callback) {
                rethinkdb.db('pushUP').tableCreate('accounts', {primaryKey: 'email'}).run(connection, function (err, result) {
                    connection.close();
                    if (err) {
                        console.log("table with name 'accounts' already created");
                    } else {
                        console.log("Created new table with name 'accounts'");
                    }
                    callback(null, "Database is setup successfully");
                });
            }
        ], function(err, data) {
            console.log(data);
        });
    }

  connectToRethinkDbServer(callback) {
    rethinkdb.connect({
      host : 'localhost',
      port : 28015
    }, function(err,connection) {
      callback(err,connection);
    });
  }

  connectToDb(callback) {
    rethinkdb.connect({
      host : 'localhost',
      port : 28015,
      db : 'pushUP'
    }, function(err,connection) {
      callback(err,connection);
    });
  }
}

module.exports = DatabaseService;