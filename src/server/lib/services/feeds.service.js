var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var dbModel = new db();
var debug = require('debug')('pushup-refactoring:server');
var async = require('async');

module.exports = function(socket) {
    socket.on('feed', function (table) {
        async.waterfall([
            function(callback) {
                dbModel.connectToDb(function(err, connection) {
                    if (err) {
                        return callback(true, "Error in connecting RethinkDB");
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table(table).get('socket').update({connected: true})
                    .run(connection,function (err,result) {
                       if(err){
                           return callback(true,'Error happens while retrieved socket from table',connection);
                       }
                       if(result.replaced === 1){
                           callback(null,connection);
                       }else{
                           return callback(true,'Error already listen socket',connection);
                       }
                    });
            },
            function (connection, callback) {
                rethinkdb.table(table).changes().run(connection,function(err,cursor) {
                    if(err) {
                        return callback(true,'Error happens while waiting for changes',connection);
                    }
                    cursor.each(function(err,row) {
                        if(row !== undefined){
                            console.log(JSON.stringify(row));
                            if(Object.keys(row).length > 0) {
                                if(row.new_val.id === 'socket'){
                                    // cursor.close(function (err) {
                                    //     if(err){
                                    //         debug('Error happens on cursor close');
                                    //     }
                                    // });
                                    return callback(true,'Socket stop listen on ' + table,connection);
                                }else{
                                    socket.broadcast.emit(table,{
                                        "data"  : row.new_val.data,
                                        "id"    : row.new_val.id,
                                        "time"  : row.new_val.time,
                                        "type"  : row.new_val.type
                                    });
                                }
                            }
                        }
                    });
                });
            }
        ], function(err, msg, connection) {
            connection.close();
            debug(msg);
        });
    });
};
