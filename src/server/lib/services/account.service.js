'use strict';

var rethinkdb = require('rethinkdb');
var async = require('async');
var db = require('./database.service');

const r_clr = '\x1b[41m'; //red bg color
const g_clr = '\x1b[42m'; //green bg color
const b_clr = '\x1b[44m'; //blue bg color
const w_clr = '\x1b[0m'; //white bg color

var debugError = require('debug')(r_clr + 'pushup: server' + w_clr);
var debugCorrect = require('debug')(g_clr + 'pushup: server' + w_clr);
var debugStatus = require('debug')(b_clr + 'pushup: server' + w_clr);

class AccountService {

    create(details, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debugError('Account.service: create error: connecting on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            function(connection,callback) {
                rethinkdb.table('accounts').insert({
                    'nickname'  : details.uNickname,
                    'email'     : details.uEmail,
                    'password'  : details.uPassword,
                    'groups'    : {}
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        debugError('Account.service: create error: cant create user <' + details.uEmail + '> account')
                        return callback(true, 'Error happens while creating new account');
                    }
                    debugCorrect('New user <' + details.uEmail + '> added successfully');
                    callback(null, result);
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    authenticate(uEmail, uPassword, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debugError('Account.service@authenticate: connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(uEmail)
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debugError('Account.service@authenticate: cant found on database the user <' + uEmail + '>');
                            return callback(true, 'Error happens while getting user details');
                        }

                        if(result === null){
                            debugStatus('User <' + uEmail + '> not found on database');
                            return callback(true, 'User not found');
                        }else{
                            if(result.password !== uPassword){
                                debugStatus('User <' + uEmail + '> and password not matching');
                                return callback(true, 'Email or password its wrong');
                            }else{
                                debugCorrect('User <' + uEmail + '> authenticated');
                                callback(null, {
                                    email       : result.email,
                                    nickname    : result.nickname,
                                    groups      : result.groups});
                            }
                        }
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    logout(uEmail, callback){
        const self = this;
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debugError('Account.service@logout: connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(uEmail).getField('groups')
                    .run(connection,function (err,groups) {
                        if(err){
                            debugError('Account.service@logout: cant get groups for user <' + uEmail + '>');
                            return callback(true, 'Error happens while getting user details');
                        }
                        for(var i=0; i<groups.length; ++i){
                            self.disableSocket(groups[i].id,function (err,response) {});
                        }
                        debugStatus('User <' + uEmail + '> log out');
                        callback(null,'Logged out');
                        connection.close();
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    disableSocket(table, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,conn) {
                    if(err){
                        debugError('Account.service@disableSocket: cant connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, conn);
                });
            },
            function (conn, callback) {
                rethinkdb.table(table).get('socket').update({connected:false})
                    .run(conn,function (err,results) {
                        conn.close();
                        if(err){
                            debugError('Account.service@disableSocket: cant update socket flag');
                            return callback(true, 'Error on updating socket flag');
                        }
                        debugCorrect('Socket for table <' + table + '> change to false');
                        callback(null,'Socket set connected to false');
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    accountInfo(uEmail, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debugError('Account.service@accountInfo: cant connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(uEmail)
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debugError('Account.service@accountInfo: cant get user <' + uEmail + '> info');
                            return callback(true, 'Error happens while getting user details');
                        }
                        if(result === null){
                            debugStatus('User <' + uEmail + '> do not exists');
                            return callback(true,'Email do not exists');
                        }
                        debugCorrect('Account info for <' + uEmail + '> retrieved');
                        callback(null,{"email": result.email, "nickname":result.nickname, "groups":result.groups});
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }
}

module.exports = AccountService;