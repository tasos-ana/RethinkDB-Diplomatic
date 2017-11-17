'use strict';

var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var async = require('async');
var debug = require('debug')('pushup-refactoring:server');

class SynchronizeService {

    add(data, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debug('Error at \'synchronize.service:add\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            function(connection,callback) {
                rethinkdb.table(data.table).insert({
                    'data' : data.data,
                    'type' : data.type,
                    'time' : data.time,
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        debug('Error at \'synchronize.service:add\': while adding new data at table{' + data.table + '}');
                        return callback(true, 'Error happens while adding new data');
                    }
                    debug('Add data: ' + data.data + 'on table:' + data.table);
                    debug('DB results' + result);
                    callback(null, result);
                });
            }
        ],function (err,data) {
            callback(err === null ? false : true, data);
        });
    }

    get(table, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debug('Error at \'synchronize.service:get\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            function(connection,callback) {
                rethinkdb.table(table).orderBy(rethinkdb.desc("time"))
                    .run(connection,function (err,cursor) {
                    connection.close();
                    if(err){
                        debug('Error at \'synchronize.service:get\': cant get data from table \'' + table +'\'');
                        return callback(true, 'Error happens while getting user details');
                    }
                    cursor.toArray(function(err, results) {
                        if (err){
                            debug('Error at \'synchronize.service:get\': cant convert data to array');
                            return callback(true, 'Error happens while converting data to array');
                        }
                        callback(null,results);
                    });
                });
            }
        ],function (err,data) {
            callback(err === null ? false : true, data);
        });
    }
}

module.exports = SynchronizeService;