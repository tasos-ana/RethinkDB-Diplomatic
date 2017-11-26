'use strict';

const rethinkdb  = require('rethinkdb');
const async      = require('async');
const db         = require('./database.service');
const debug      = require('./debug.service');
const encryption = require('./encryption.service');


const accountService = function () {
    return {
        create          : _create,
        authenticate    : _authenticate,
        accountInfo     : _accountInfo
    };

    function _create(details, callback){
        async.waterfall([
            function (callback) {
                db.connectToDb(function(err,connection) {
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

    function _authenticate(uEmail, uPassword, callback) {
        async.waterfall([
            function (callback) {
                db.connectToDb(function (err,connection) {
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
                                const cookie = encryption.encrypt(JSON.stringify({uEmail: uEmail, uPassword:uPassword}));
                                callback(null, {
                                    cookie      : cookie ,
                                    response    : {
                                        email       : result.email,
                                        nickname    : result.nickname,
                                        groups      : result.groups
                                }});
                            }
                        }
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    function _accountInfo(uEmail,cookie, callback) {
        async.waterfall([
            function (callback) {
                db.connectToDb(function (err,connection) {
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

                        /**
                         * Validate that the details that we retrieve it's valid for the user that login
                         */
                        try{
                            const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                            if(cookieDetails.uEmail !== uEmail || cookieDetails.uPassword !== result.password){
                                debug.error('Account.service@accountInfo: user details and cookie isnt match');
                                return callback(true,'Invalid cookie');
                            }else{
                                debug.correct('Account info for <' + uEmail + '> retrieved');
                                callback(null,{"email": result.email, "nickname":result.nickname, "groups":result.groups});
                            }
                        }catch (e){
                            debug.error('Account.service@accountInfo (catch): user details and cookie isnt match');
                            return callback(true,'Invalid cookie');
                        }
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

}();

module.exports = accountService;