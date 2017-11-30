'use strict';

const rethinkdb         = require('rethinkdb');
const async             = require('async');

const db                = require('./database.service');
const debug             = require('./debug.service');
const accountService    = require('./account.service');

/**
 * API for sync data between devices
 * @returns {{feed: _feed, disconnect: _disconnect}}
 */
const syncService = function () {

    return{
        feed        : _feed,
        connect     : _connect,
        disconnect  : _disconnect
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
                if(tryPush(gID, socket)){
                    debug.status('Start feeding on group <' + gID + '>');
                    rethinkdb.table(gID).changes().run(connection,function (err, cursor) {
                        if(err){
                            removeGroup(gID, socket);
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
                                        if(!exists(gID,socket)){
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


    function _connect(socket) {
        accountService.info(null, socket.request.cookies['userCredentials'], function (err,responseData) {
            if(!err){
                const groupsList = responseData.groupsList;
                while (groupsList.length > 0){
                    const gID = groupsList.pop();
                    _feed(socket, gID);
                }
            }
        });
    }

    /**
     * If user disconnect or logout we must stop live feed
     * @param socket
     * @private
     */
    function _disconnect(socket) {
        if(socket.groupsList !== undefined) {
            while (socket.groupsList.length > 0) {
                const gID = socket.groupsList.pop();
                closeGroupFeed(gID);
            }
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
                rethinkdb.table(gID).get('settings').update({lastLogin : Date.now()})
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
     * Remove gID from socket.groupsList
     * @param gID       the id of table
     * @param socket
     * @private
     */
    function removeGroup(gID, socket){
        if(socket.groupsList !== undefined){
            const index = socket.groupsList.indexOf(gID);
            if (index >= 0) {
                socket.groupsList.splice(index, 1);
            }
        }
    }

    /**
     * If gID do not exists on list push them else return false
     * @param gID           the id of table
     * @param socket
     * @returns {boolean}
     * @private
     */
    function tryPush(gID, socket) {
        if(socket.groupsList === undefined){
            socket.groupsList = [];
        }
        const index = socket.groupsList.indexOf(gID);
        let status = false;
        if(index < 0){
            socket.groupsList.push(gID);
            status = true;
        }

        return status;
    }

    /**
     * Check if gid exists on list
     * @param gID
     * @param socket
     * @returns {boolean}
     */
    function exists(gID, socket) {
        if(socket.groupsList !== undefined){
            return socket.groupsList.indexOf(gID) >= 0;
        }
    }

}();

module.exports = syncService;