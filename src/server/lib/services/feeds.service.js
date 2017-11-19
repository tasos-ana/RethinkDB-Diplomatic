var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var dbModel = new db();
var debug = require('debug')('pushup-refactoring:server');


module.exports = function(socket) {
    socket.on('feed', function (table) {
        dbModel.validSocket(table,function (err,enabled) {
            if(err){
                debug('Error cant initialize socket on \'' + table + '\'');
                return;
            }
            if(!enabled){
                debug('feeds on socket: ' + table);
                dbModel.connectToDb(function(err,connection) {
                    if (err) {
                        return callback(true, "Error connecting to database");
                    }

                    rethinkdb.table(table).changes().run(connection,function(err,cursor) {
                        if(err) {
                            console.log(err);
                        }
                        cursor.each(function(err,row) {
                            console.log(JSON.stringify(row));
                            if(Object.keys(row).length > 0) {
                                socket.broadcast.emit(table,{
                                    "data"  : row.new_val.data,
                                    "id"    : row.new_val.id,
                                    "time"  : row.new_val.time,
                                    "type"  : row.new_val.type});
                            }
                        });
                    });

                });
            }
        });
    });
};
