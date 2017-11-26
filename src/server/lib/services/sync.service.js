'use strict';

const rethinkdb = require('rethinkdb');
const db        = require('./database.service');
const async     = require('async');
const debug     = require('./debug.service');

var syncService = function () {
    var groups = [];

    return{
      feed          : _feed,
      disconnect    : _disconnect  
    };
    
    function _feed(socket, gID) {
        async.waterfall([
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@feed: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            //TODO otan ginete disconnect tha prepei na ginetai mono apo 1 device kai oxi apo ola
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
                                    if(row.new_val.id !== 'socket'){
                                        debug.status('Broadcast new data for group <' + gID + '>');
                                        socket.emit(gID, {
                                            "data"  : row.new_val.data,
                                            "id"    : row.new_val.id,
                                            "time"  : row.new_val.time,
                                            "type"  : row.new_val.type
                                        });
                                        // socket.emit(listenOn);
                                    }else{
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
    
    function _disconnect() {
        while(groups.length > 0){
            const gID = groups.pop();
            closeGroupFeed(gID);
        }
    }

    function removeGroup(gID){
        const index = groups.indexOf(gID);
        if (index >= 0) {
            groups.splice( index, 1 );
        }
    }

    function tryPush(gID) {
        const index = groups.indexOf(gID);
        var status = false;
        if(index < 0){
            groups.push(gID);
            status = true;
        }

        return status;
    }

    function closeGroupFeed(gID){
        async.waterfall([
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if(err){
                        debug.error('Sync.service@closeGroupFeed: cant connect on database');
                        return callback(true, 'Sync.service@closeGroupFeed: cant connect on database')
                    }
                    callback(null,connection);
                });
            },
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

};

module.exports = syncService;