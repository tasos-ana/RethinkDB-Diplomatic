'use strict';

var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var async = require('async');

const r_clr = '\x1b[41m'; //red bg color
const g_clr = '\x1b[42m'; //green bg color
const b_clr = '\x1b[44m'; //blue bg color
const w_clr = '\x1b[0m'; //white bg color

var debugError = require('debug')(r_clr + 'pushup: server' + w_clr);
var debugCorrect = require('debug')(g_clr + 'pushup: server' + w_clr);
var debugStatus = require('debug')(b_clr + 'pushup: server' + w_clr);

class SyncService {

    private gStatus = {};

    feed(socket, gID){
        const self = this;
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err, connection) {
                   if (err){
                       return callback(true, 'Sync.service@feed: cant connect on database');
                   }
                   callback(null, connection);
                });
            },
            //TODO otan ginete disconnect tha prepei na ginetai mono apo 1 device kai oxi apo ola
            function (connection, callback) {
                self.gStatus[gID] = {connected : true};
                debugStatus('Start feeding on group <' + gID + '>');
                rethinkdb.table(gID).changes().run(connection,function (err, cursor) {
                    if(err){
                        self.gStatus[gID].connected = false;
                        connection.close();
                        return callback(true,'Sync.service@feed: something goes wrong with changes on group <' + gID + '>');
                    }
                    cursor.each(function (err, row) {
                       if(row !== undefined){
                           debugStatus('Feed <' + debugCorrect(JSON.stringify(row)) +'> received for group <' + gID + '>');
                           if(Object.keys(row).length>0){
                               if(self.gStatus[gID].connected){
                                   if(row.new_val.id !== 'socket'){
                                       socket.broadcast.emit(gID,{
                                           "data"  : row.new_val.data,
                                           "id"    : row.new_val.id,
                                           "time"  : row.new_val.time,
                                           "type"  : row.new_val.type
                                       });
                                   }
                               }else{
                                    cursor.close(function (err) {
                                       if(err){
                                           debugError('Sync.service@feed: cant close cursor');
                                       }
                                    });
                                    debugCorrect('Feed for group <' + gID + '> closed successful');
                                    connection.close();
                                    return callback(null, '');
                               }
                           }
                       }
                    });
                });
            }
        ], function (err, msg) {
            debugError(msg);
        });
    }

    disconnect(){
        const self = this;

        for (var gID in self.gStatus){
            self.disconnectGroup(gID);
        }
    }

    private disconnectGroup(gID){
        var self = this;
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err, connection) {
                    if(err){
                        return callback(true, 'Sync.service@disconnect: cant connect on database')
                    }
                    callback(null,connection);
                });
            },
            function (connection, callback) {
                self.gStatus[gID].connected = false;
                rethinkdb.table(gID).get('socket').update({lastLogin : Date.now()})
                    .run(connection, function (err, result) {
                        connection.close();
                        if(err){
                            return callback(true, 'Sync.service@disconnect: cant update group lastLogin field');
                        }
                        callback(null, '');
                    });
            }
        ],function (err, msg) {
            if(err){
                debugError(msg);
            }
        });
    }

}

module.exports = SyncService;