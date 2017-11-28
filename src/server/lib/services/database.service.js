"use strict";

const rethinkdb = require('rethinkdb');
const async     = require('async');

const config    = require('../../config');
const debug     = require('./debug.service');

/**
 * API for database initialize and connection
 * @type {{initDB, connectToRethinkDbServer, connectToDb}}
 */
const databaseService = function () {
    return {
        initDB                      : _initDB,
        connectToRethinkDbServer    : _connectToRethinkDbServer,
        connectToDb                 : _connectToDb
    };

    /**
     * Initialize database and the defaults tables on database
     * @private
     */
    function _initDB() {
        const self = this;
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function(callback) {
                self.connectToRethinkDbServer(function(err, connection) {
                    if (err) {
                        debug.error('Database.service@initDb: cant connect to database');
                        return callback(true, "Error in connecting RethinkDB");
                    }
                    callback(null, connection);
                });
            },
            /**
             * Create new database if does not exists with name from config
             * @param connection
             * @param callback
             */
            function(connection, callback) {
                rethinkdb.dbCreate(config.db.defaultName).run(connection, function(err, result) {
                    if (err) {
                        debug.status('Database <' + config.db.defaultName + '> already created');
                    } else {
                        debug.correct('Database <' + config.db.defaultName + '> created successful');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Create tables if does not exists with names from config
             * @param connection
             * @param callback
             */
            function(connection, callback) {
                for (const i in config.db.defaultTables){
                    const table = config.db.defaultTables[i].table;
                    const key = config.db.defaultTables[i].key;
                    rethinkdb.db(config.db.defaultName).tableCreate(table, {primaryKey: key}).run(connection, function (err, result) {
                        if (err) {
                            debug.status('Table:key <' + table + ' : ' + key + '> for database <' + config.db.defaultName + '> already created');
                        } else {
                            debug.correct('Table:key <' + table + ' : ' + key + '> created for database <' + config.db.defaultName + '> successful');
                        }
                        if(table === config.db.lastTable){
                            connection.close();
                            callback(null, "Database is setup successfully");
                        }
                    });
                }
            }
        ], function(err, data) {
            if(err){
                debug.error(data);
            }else{
                debug.correct(data);
            }
        });
    }

    /**
     * Connect on database server
     * @param callback
     * @private
     */
    function _connectToRethinkDbServer(callback) {
        rethinkdb.connect({
            host : config.db.host,
            port : config.db.listenPort
        }, function(err,connection) {
            callback(err,connection);
        });
    }

    /**
     * Connect on database
     * @param callback
     * @private
     */
    function _connectToDb(callback) {
        rethinkdb.connect({
            host : config.db.host,
            port : config.db.listenPort,
            db   : config.db.defaultName
        }, function(err,connection) {
            callback(err,connection);
        });
    }

}();

module.exports = databaseService;