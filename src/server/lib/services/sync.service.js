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
                if(tryPush(gID, connection, socket)){
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
                                    debug.status('Broadcast new data for group <' + gID + '>');
                                    socket.emit(gID, {
                                        "data"  : row.new_val.data,
                                        "id"    : row.new_val.id,
                                        "time"  : row.new_val.time,
                                        "type"  : row.new_val.type
                                    });
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
        if(socket.request.cookies['userCredentials'] !== undefined){
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
    }

    /**
     * If user disconnect or logout we must stop live feed
     * @param socket
     * @private
     */
    function _disconnect(socket) {
        if(socket.groupsList !== undefined) {
            for(const gID in socket.groupsList){
                socket.groupsList[gID].close();
                debug.correct('Feed on group <' + gID + '> closed successful');
                delete socket.groupsList[gID];
            }
        }
    }

    /**
     * If gID do not exists on list push them else return false
     * @param gID           the id of table
     * @param connection
     * @param socket
     * @returns {boolean}
     * @private
     */
    function tryPush(gID, connection, socket) {
        if(socket.groupsList === undefined){
            socket.groupsList = { };
        }
        let status = false;

        if(socket.groupsList[gID] === undefined){
            status = true;
            socket.groupsList[gID] = connection;
        }

        return status;
    }

}();

module.exports = syncService;