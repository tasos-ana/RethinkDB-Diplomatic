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
                    'time' : Date.now()
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
}

module.exports = SynchronizeService;