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
        initDB      : _initDB,
        connectToDb : _connectToDb
    };

    /**
     * Initialize database and the defaults tables on database
     * @private
     */
    function _initDB() {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function(callback) {
                _connectToRethinkDbServer(function(err, connection) {
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
                const tablesList = config.db.defaultTables;
                while(tablesList.length > 0){
                    const table = tablesList.pop();
                    _createTable(table.name, table.key);
                }
            }
        ], function(){});
    }

    function _createTable(name, key) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function(callback) {
                _connectToDb(function(err, connection) {
                    if (err) {
                        debug.error('Database.service@_createTable: cant connect to database');
                        return callback(true, "Error in connecting RethinkDB");
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
                    rethinkdb.db(config.db.defaultName).tableCreate(name, {primaryKey: key}).run(connection, function (err, result) {
                        if (err) {
                            debug.status('Table:key <' + name + ' : ' + key + '> for database <' + config.db.defaultName + '> already created');
                        }else{
                            debug.status('Table:key <' + name + ' : ' + key + '> created for database <' + config.db.defaultName + '> successful');
                            if(name==='groups'){
                                _createGroupsIndex();
                            }
                        }
                        connection.close();
                        callback(null,'');
                    });
            }
        ], function() {});
    }

    function _createGroupsIndex() {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function(callback) {
                _connectToDb(function(err, connection) {
                    if (err) {
                        debug.error('Database.service@_createGroupsIndex: cant connect to database');
                        return callback(true, "Error in connecting RethinkDB");
                    }
                    callback(null, connection);
                });
            },
            /**
             * Create index
             * @param connection
             * @param callback
             */
            function(connection, callback) {
                rethinkdb.db(config.db.defaultName).table('groups').indexCreate(
                    'userAndName', [rethinkdb.row('user'), rethinkdb.row('name')]
                ).run(connection, function (err, result) {
                    if (err) {
                        debug.status('Index "userAndName" for table "groups" already created');
                    }else{
                        debug.status('Index "userAndName" for table "groups" created successful');
                    }
                    connection.close();
                    callback(null,'');
                });
            }
        ], function() {});
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