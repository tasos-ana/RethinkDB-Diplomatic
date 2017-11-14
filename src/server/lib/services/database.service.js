"use strict";
var rethinkdb = require('rethinkdb');
var async = require('async');
var debug = require('debug')('pushup-refactoring:server');
var config = require('../../config');

class database {
    setupDb(table,key) {
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
                        debug("Database with name'pushUP' already created");
                    } else {
                        console.log("Created new database with name 'pushUP'");
                    }
                    callback(null, connection);
                });
            },
            function(connection, callback) {
                rethinkdb.db('pushUP').tableCreate(table, {primaryKey: key}).run(connection, function (err, result) {
                    connection.close();
                    if (err) {
                        debug("table with name '" + table + "' already created");
                    } else {
                        console.log("Created new table with name '" + table + "' and primary key '" + key +"' ");
                    }
                    callback(null, "Database is setup successfully");
                });
            }
        ], function(err, data) {
            debug(data);
        });
    }

    connectToRethinkDbServer(callback) {
        rethinkdb.connect({
            host : config.db.host,
            port : config.db.listenPort
        }, function(err,connection) {
            callback(err,connection);
        });
    }

    connectToDb(callback) {
        rethinkdb.connect({
            host : config.db.host,
            port : config.db.listenPort,
            db   : config.db.defaultName
        }, function(err,connection) {
            callback(err,connection);
        });
    }
}

module.exports = database;