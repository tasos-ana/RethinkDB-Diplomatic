'use strict';

const rethinkdb  = require('rethinkdb');
const async      = require('async');

const db         = require('./database.service');
const debug      = require('./debug.service');

/**
 * API for sync data between devices
 * @returns {{feed: _feed, disconnect: _disconnect}}
 */
const syncService = function () {
    var groups = [];

    return{
      feed          : _feed,
      disconnect    : _disconnect  
    };

    /**
     * Live feed changes on table and emit it on user
     * @param socket    communication socket between server,client
     * @param gID       group id that we feed
     * @private
     */
    function _feed(socket, gID) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@feed: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Start live feeding on group
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                if(tryPush(gID)){
                    debug.status('Start feeding on group <' + gID + '>');
                    rethinkdb.table(gID).changes().run(connection,function (err, cursor) {
                        if(err){
                            removeGroup(gID);
                            connection.close();
                            return callback(true,'Sync.service@feed: something goes wrong with changes on group <' + gID + '>');
                        }
                        cursor.each(function (err, row) {
                            if(row !== undefined){
                                if(Object.keys(row).length>0){
                                    if(row.new_val.id !== 'settings'){
                                        debug.status('Broadcast new data for group <' + gID + '>');
                                        socket.emit(gID, {
                                            "data"  : row.new_val.data,
                                            "id"    : row.new_val.id,
                                            "time"  : row.new_val.time,
                                            "type"  : row.new_val.type
                                        });
                                    }else{
                                        removeGroup(gID);
                                        cursor.close(function (err) {
                                            if(err){
                                                debug.error('Sync.service@feed: cant close cursor');
                                            }
                                        });
                                        debug.correct('Feed for group <' + gID + '> closed successful');
                                        connection.close();
                                        return callback(null, '');
                                    }
                                }
                            }
                        });
                    });
                }else{
                    connection.close();
                    callback(null,'');
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * if user disconnect or logout we must stop live feed
     * @private
     */
    function _disconnect() {
        while(groups.length > 0){
            const gID = groups.pop();
            closeGroupFeed(gID);
        }
    }

    /**
     * Make change on group so we cant close live feed
     * @param gID
     * @private
     */
    function closeGroupFeed(gID){
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if(err){
                        debug.error('Sync.service@closeGroupFeed: cant connect on database');
                        return callback(true, 'Sync.service@closeGroupFeed: cant connect on database')
                    }
                    callback(null,connection);
                });
            },
            /**
             * Update lastlogin field on group
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table(gID).get('socket').update({lastLogin : Date.now()})
                    .run(connection, function (err, result) {
                        connection.close();
                        if(err){
                            debug.error('Sync.service@closeGroupFeeddisconnectGroup: cant update group <' + gID + '> lastLogin field');
                            return callback(true, 'Sync.service@closeGroupFeed: cant update group lastLogin field');
                        }
                        callback(null, '');
                    });
            }
        ],function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Remove gID from group list
     * @param gID
     * @private
     */
    function removeGroup(gID){
        const index = groups.indexOf(gID);
        if (index >= 0) {
            groups.splice(index, 1);
        }
    }

    /**
     * If gID do not exists on list push them else return false
     * @param gID
     * @returns {boolean}
     * @private
     */
    function tryPush(gID) {
        const index = groups.indexOf(gID);
        var status = false;
        if(index < 0){
            groups.push(gID);
            status = true;
        }

        return status;
    }

};

module.exports = syncService;