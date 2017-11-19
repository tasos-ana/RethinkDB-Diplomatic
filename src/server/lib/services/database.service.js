"use strict";
var rethinkdb = require('rethinkdb');
var async = require('async');
var debug = require('debug')('pushup-refactoring:server');
var config = require('../../config');

class database {

    initDb(){
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
                rethinkdb.dbCreate(config.db.defaultName).run(connection, function(err, result) {
                    if (err) {
                        debug("Database with name \'" + config.db.defaultName + "\' already created");
                    } else {
                        console.log("Created new database with name \'"+ config.db.defaultName + "\'");
                    }
                    callback(null, connection);
                });
            },
            function(connection, callback) {
                for (const i in config.db.defaultTables){
                    const table = config.db.defaultTables[i].table;
                    const key = config.db.defaultTables[i].key;
                    rethinkdb.db(config.db.defaultName).tableCreate(table, {primaryKey: key}).run(connection, function (err, result) {
                        if (err) {
                            debug("table with name '" + table + "' already created");
                        } else {
                            console.log("Created new table '" + table + "' with primary key '" + key +"' ");
                        }
                        if(i === (config.db.defaultTables.length -1) ){
                            connection.close();
                            callback(null, "Database is setup successfully");
                        }
                    });
                }
            }
        ], function(err, data) {
            debug(data);
        });
    }

    initTable(table,key) {
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
                rethinkdb.dbCreate(config.db.defaultName).run(connection, function(err, result) {
                    if (err) {
                        debug("Database with name \'" + config.db.defaultName + "\' already created");
                    } else {
                        console.log("Created new database with name \'"+ config.db.defaultName + "\'");
                    }
                    callback(null, connection);
                });
            },
            function(connection, callback) {
                rethinkdb.db(config.db.defaultName).tableCreate(table, {primaryKey: key}).run(connection, function (err, result) {
                    connection.close();
                    if (err) {
                        debug("table with name '" + table + "' already created");
                    } else {
                        console.log("Created new table '" + table + "' with primary key '" + key +"' ");
                    }
                    callback(null, "Database is setup successfully");
                });
            }
        ], function(err, data) {
            debug(data);
        });
    }

    validSocket(table,callback){
        var self = this;
        async.waterfall([
            function (callback) {
                self.connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'database.service:validSocket\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('sockets').get(table).update({enabled : true})
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debug('Error at \'database.service:validSocket\': cant update socket \'' + table +'\'');
                            return callback(true, 'Error happens while updating socket flag');
                        }
                        var ret = false;
                        if(result.unchanged === 1){
                            ret = true;
                        }
                        callback(null,ret);
                    });
            }
        ], function (err,data) {
            callback(err === null ? false : true, data);
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