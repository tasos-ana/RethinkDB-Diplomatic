"use strict";
var rethinkdb = require('rethinkdb');
var async = require('async');
var config = require('../../config');

const r_clr = '\x1b[41m'; //red bg color
const g_clr = '\x1b[42m'; //green bg color
const b_clr = '\x1b[44m'; //blue bg color
const w_clr = '\x1b[0m'; //white bg color

var debugError = require('debug')(r_clr + 'pushup: server' + w_clr);
var debugCorrect = require('debug')(g_clr + 'pushup: server' + w_clr);
var debugStatus = require('debug')(b_clr + 'pushup: server' + w_clr);

class database {

    initDb(){
        var self = this;
        async.waterfall([
            function(callback) {
                self.connectToRethinkDbServer(function(err, connection) {
                    if (err) {
                        debugError('Database.service@initDb: cant connect to database');
                        return callback(true, "Error in connecting RethinkDB");
                    }
                    callback(null, connection);
                });
            },
            function(connection, callback) {
                rethinkdb.dbCreate(config.db.defaultName).run(connection, function(err, result) {
                    if (err) {
                        debugStatus('Database <' + config.db.defaultName + '> already created');
                    } else {
                        debugCorrect('Database <' + config.db.defaultName + '> created successful');
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
                            debugStatus('Table : key <' + table + ' : ' + key + '> for database <' + config.db.defaultName + '> already created');
                        } else {
                            debugCorrect('Table : key <' + table + ' : ' + key + '> created for database <' + config.db.defaultName + '> successful');
                        }
                        if(table === config.db.lastTable){
                            connection.close();
                            callback(null, "Database is setup successfully");
                        }
                    });
                }
            }
        ], function(err, data) {
            debugCorrect(data);
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