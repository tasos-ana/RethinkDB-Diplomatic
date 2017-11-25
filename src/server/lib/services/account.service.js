'use strict';

var rethinkdb = require('rethinkdb');
var async = require('async');
var db = require('./database.service');

var debug = require('./debug.service');

class AccountService {

    create(details, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Account.service: create error: connecting on database');
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
                        debug.error('Account.service: create error: cant create user <' + details.uEmail + '> account')
                        return callback(true, 'Error happens while creating new account');
                    }
                    debug.correct('New user <' + details.uEmail + '> added successfully');
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
                        debug.error('Account.service@authenticate: connecting to database');
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
                            debug.error('Account.service@authenticate: cant found on database the user <' + uEmail + '>');
                            return callback(true, 'Error happens while getting user details');
                        }

                        if(result === null){
                            debug.status('User <' + uEmail + '> not found on database');
                            return callback(true, 'User not found');
                        }else{
                            if(result.password !== uPassword){
                                debug.status('User <' + uEmail + '> and password not matching');
                                return callback(true, 'Email or password its wrong');
                            }else{
                                debug.correct('User <' + uEmail + '> authenticated');
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
                        debug.error('Account.service@logout: connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(uEmail).getField('groups')
                    .run(connection,function (err,groups) {
                        if(err){
                            debug.error('Account.service@logout: cant get groups for user <' + uEmail + '>');
                            return callback(true, 'Error happens while getting user details');
                        }
                        for(var i=0; i<groups.length; ++i){
                            self.disableSocket(groups[i].id,function (err,response) {});
                        }
                        debug.status('User <' + uEmail + '> log out');
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
                        debug.error('Account.service@disableSocket: cant connect to database');
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
                            debug.error('Account.service@disableSocket: cant update socket flag');
                            return callback(true, 'Error on updating socket flag');
                        }
                        debug.correct('Socket for table <' + table + '> change to false');
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
                        debug.error('Account.service@accountInfo: cant connect to database');
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
                            debug.error('Account.service@accountInfo: cant get user <' + uEmail + '> info');
                            return callback(true, 'Error happens while getting user details');
                        }
                        if(result === null){
                            debug.status('User <' + uEmail + '> do not exists');
                            return callback(true,'Email do not exists');
                        }
                        debug.correct('Account info for <' + uEmail + '> retrieved');
                        callback(null,{"email": result.email, "nickname":result.nickname, "groups":result.groups});
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }
}

module.exports = AccountService;