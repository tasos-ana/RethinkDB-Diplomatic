'use strict';

const rethinkdb  = require('rethinkdb');
const async      = require('async');

const db         = require('./database.service');
const debug      = require('./debug.service');
const encryption = require('./encryption.service');

/**
 * API for managing user account
 * @type {{create, authenticate, accountInfo}}
 */
const accountService = function () {


    return {
        create          : _create,
        authenticate    : _authenticate,
        info            : _info
    };

    /**
     * Create new account for user
     * @param details   contains uNickname, uEmail, uPassword
     * @param callback
     * @private
     */
    function _create(details, callback){
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Account.service@create: connecting on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            /**
             * Insert new user at accounts table on database
             * @param connection
             * @param callback
             */
            function(connection,callback) {
                rethinkdb.table('accounts').insert({
                    'nickname'  : details.uNickname,
                    'email'     : details.uEmail,
                    'password'  : details.uPassword,
                    'groups'    : []
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        debug.error('Account.service@create: cant create user <' + details.uEmail + '> account')
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

    /**
     * Authenticate user details providing with database user details
     * @param uEmail     user email
     * @param uPassword  user password
     * @param callback
     * @private
     */
    function _authenticate(uEmail, uPassword, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Account.service@authenticate: connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Retrieve details for user based on uEmail
             * @param connection
             * @param callback
             */
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
                                /**
                                 * Initialize cookie for user and encrypt it
                                 */
                                const cookie = encryption.encrypt(JSON.stringify({uEmail: uEmail, uPassword:uPassword}));
                                callback(null, {
                                    cookie      : cookie ,
                                    response    : {
                                        email       : result.email,
                                        nickname    : result.nickname,
                                        groupsList  : result.groups,
                                        groupsData  : { }
                                }});
                            }
                        }
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Retrieve account info based on uEmail
     * @param uEmail    user email
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _info(uEmail,cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Account.service@accountInfo: cant connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Get details for uEmail and perform validation check
             * @param connection
             * @param callback
             */
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

                        try{
                            const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                            if(cookieDetails.uEmail !== uEmail || cookieDetails.uPassword !== result.password){
                                debug.error('Account.service@accountInfo: user details and cookie do not matched');
                                return callback(true,'Invalid cookie');
                            }else{
                                debug.correct('Account info for <' + uEmail + '> retrieved');
                                callback(null,{
                                    "email"         : result.email,
                                    "nickname"      : result.nickname,
                                    "groupsList"    : result.groups,
                                    "groupsData"    : { }
                                });
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