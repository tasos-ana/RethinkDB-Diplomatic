'use strict';

var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var async = require('async');

class AccountService {

    //TODO na ginei encrypt o kwdikos
    create(details, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            function(connection,callback) {
                rethinkdb.table('accounts').insert({
                    'deviceID' : [details.deviceID],
                    'nickname' : details.nickname,
                    'email'    : details.email,
                    'password' : details.password,
                    'groupsID' : []
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        return callback(true, 'Error happens while creating new account');
                    }
                    callback(null, result);
                });
            }
        ],function (err,data) {
            callback(err === null ? false : true, data);
        });
    }

    authenticate(username, password , callback) {

    }
}

module.exports = AccountService;