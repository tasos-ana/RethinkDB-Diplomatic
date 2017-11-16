'use strict';

var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var async = require('async');
var debug = require('debug')('pushup-refactoring:server');

class AccountService {

    create(details, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debug('Error at \'account.service:create\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            function(connection,callback) {
                rethinkdb.table('accounts').insert({
                    'nickname' : details.nickname,
                    'email'    : details.email,
                    'password' : details.password,
                    'groupsID' : []
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        debug('Error at \'account.service:create\': while creating new account email{' + details.email + '}');
                        return callback(true, 'Error happens while creating new account');
                    }
                    debug('Add user: ' + details.email);
                    debug('DB results' + result);
                    callback(null, result);
                });
            }
        ],function (err,data) {
            callback(err === null ? false : true, data);
        });
    }

    authenticate(details, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'account.service:authenticate\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.email)
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debug('Error at \'account.service:authenticate\': cant get user with email \'' + details.email +'\'');
                            return callback(true, 'Error happens while getting user details');
                        }
                            if(result === null || result.password !== details.password){
                                return callback(true, 'Email or password its wrong');
                            }
                            callback(null,{"email": result.email, "nickname":result.nickname, "groupsID":result.groupsID});
                    });
            }
        ], function (err,data) {
            callback(err === null ? false : true, data);
        });
    }

    getAccount(email, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'account.service:existsEmail\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(email)
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debug('Error at \'account.service:existsEmail\': cant get user with email \'' + details.email +'\'');
                            return callback(true, 'Error happens while getting user details');
                        }
                        if(result === null){
                            return callback(true,'Email do not exists');
                        }
                        callback(null,{"email": result.email, "nickname":result.nickname, "groupsID":result.groupsID});
                    });
            }
        ], function (err,data) {
            callback(err === null ? false : true, data);
        });
    }


}

module.exports = AccountService;