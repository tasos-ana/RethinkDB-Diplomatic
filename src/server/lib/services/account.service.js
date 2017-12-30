'use strict';

const rethinkdb  = require('rethinkdb');
const async      = require('async');

const db         = require('./database.service');
const debug      = require('./debug.service');
const encryption = require('./security/encryption.security');

/**
 * API for managing user account
 * @type {{create, authenticate, accountInfo}}
 */
const accountService = function () {

    return {
        create          : _create,
        authenticate    : _authenticate,
        info            : _info,
        updateNickname  : _updateNickname,
        updatePassword  : _updatePassword,
        updateAll       : _updateAll
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
                    'nickname'      : details.uNickname,
                    'email'         : details.uEmail,
                    'password'      : details.uPassword,
                    'groups'        : [],
                    'openedGroups'  : []
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
                                callback(null, {
                                        email       : result.email,
                                        nickname    : result.nickname,
                                        groupsList  : result.groups,
                                        openedGroupsData  : { }
                                });
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
    function _info(uEmail, cookie, callback) {
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
                try{
                    let validate = true;
                    let cookieDetails;

                    if(uEmail === undefined){
                        cookieDetails = JSON.parse(encryption.decrypt(cookie));
                        uEmail = cookieDetails.uEmail;
                    }else{
                        validate = false;
                    }

                    rethinkdb.table('accounts').get(uEmail)
                        .run(connection,function (err,result) {
                            if(err){
                                connection.close();
                                debug.error('Account.service@accountInfo: cant get user <' + uEmail + '> info');
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                connection.close();
                                debug.status('User <' + uEmail + '> do not exists');
                                return callback(true,'Email do not exists');
                            }
                            if(validate && cookieDetails.uPassword !== result.password){
                                connection.close();
                                debug.error('Account.service@accountInfo: user details and cookie do not matched');
                                return callback(true,'Invalid cookie');
                            }else{
                                debug.status('Retrieved info for user <' + result.email +'>');
                                callback(null, connection, {
                                    "email"             : result.email,
                                    "nickname"          : result.nickname,
                                    "tmpGroupsList"     : result.groups,
                                    "groupsList"        : [ ],
                                    "groupsNames"       : { },
                                    "openedGroupsData"  : { },
                                    "unreadMessages"    : { },
                                    "openedGroupsList"  : result.openedGroups
                                });
                            }
                        });
                }catch (e){
                    connection.close();
                    debug.error('Account.service@accountInfo (catch): user details and cookie isnt match');
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Retrieve data from groups
             * @param connection
             * @param data
             * @param callback
             */
            function (connection, data, callback) {
                rethinkdb.table('groups').orderBy({index : 'userAndName'}).filter({user : data.email})
                    .run(connection,function (err, result) {
                        connection.close();
                        if(err){
                            debug.error('Account.service@accountInfo: cant get for user <' + uEmail + '> the groups details');
                            return callback(true, 'Error happens while getting user details');
                        }

                        result.toArray(function (err,arr) {
                            if(err){
                                debug.error('Account.service@accountInfo: cant convert result to array');
                                return callback(true, 'Error happens while getting user details');
                            }

                            for(let i=0; i<arr.length; ++i){
                                const gID = convertGroupID(arr[i].id,'_');
                                if(data.tmpGroupsList.indexOf(gID) !== -1){
                                    data.groupsList.push(gID);
                                    data.groupsNames[gID] = arr[i].name;
                                    data.unreadMessages[gID] = arr[i].unreadMessages;
                                }else{
                                    debug.error('Account.service@accountInfo: group with id <' + gID + '> not belong to user');
                                    return callback(true, 'Error happens while getting user details');
                                }
                            }

                            delete data.tmpGroupsList;
                            debug.correct('Data for user <' + uEmail + '> retrieved successful');
                            callback(null,data);
                        });
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     *
     * @param details   contains {curPassword, nickname:newNickname}
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _updateNickname(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Account.service@_updateNickname: cant connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Validate req cookie with details on database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                try{
                    const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_updateNickname: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            //PASSWORD CHECKINGS
                            if(cookieDetails.uPassword !== result.password){
                                debug.error('Account.service@_updateNickname: user details and cookie isnt match');
                                connection.close();
                                return callback(true, 'Invalid cookie');
                            }else if(result.password!==details.curPassword){
                                debug.error('Account.service@_updateNickname: user curPassword isn\'t matched');
                                connection.close();
                                return callback(true, {wrongPassword : true, msg : 'Current password it\'s wrong'});
                            }else {
                                callback(null, connection, cookieDetails.uEmail);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_updateNickname (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Update the nickname of the user
             * @param connection
             * @param uEmail
             * @param callback
             */
            function (connection,uEmail, callback) {
                rethinkdb.table('accounts').get(uEmail).update({
                    nickname : details.nickname
                }).run(connection, function (err,result) {
                    connection.close();
                   if(err){
                       debug.error('Account.service@_updateNickname: cant update user <' + uEmail + '> nickname');
                       connection.close();
                       return callback(true, 'Error happens while updating user nickname');
                   }
                    callback(null, {nickname : details.nickname});
                });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     *
     * @param details   contains {curPassword, password : newPassword}
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _updatePassword(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Account.service@_updatePassword: cant connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Validate req cookie with details on database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                try{
                    const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_updatePassword: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            //PASSWORD CHECKINGS
                            if(cookieDetails.uPassword !== result.password){
                                debug.error('Account.service@_updatePassword: user details and cookie isnt match');
                                connection.close();
                                return callback(true, {wrongPassword : false, msg : 'Invalid cookie'});
                            }else if(result.password!==details.curPassword){
                                debug.error('Account.service@_updatePassword: user curPassword isn\'t matched');
                                connection.close();
                                return callback(true, {wrongPassword : true, msg : 'Current password it\'s wrong'});
                            }else {
                                callback(null, connection, cookieDetails.uEmail);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_updatePassword (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Update the password of the user
             * @param connection
             * @param uEmail
             * @param callback
             */
            function (connection,uEmail, callback) {
                rethinkdb.table('accounts').get(uEmail).update({
                    password : details.password
                }).run(connection, function (err,result) {
                    connection.close();
                    if(err){
                        debug.error('Account.service@_updatePassword: cant update user <' + uEmail + '> password');
                        connection.close();
                        return callback(true, 'Error happens while updating user password');
                    }
                    const retVal = {
                      cookie    : {uEmail : uEmail, uPassword : details.password},
                      data      : ''
                    };
                    callback(null, retVal);
                });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     *
     * @param details   contains {curPassword, nickname : newNickname, password : newPassword}
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _updateAll(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Account.service@_updateAll: cant connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Validate req cookie with details on database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                try{
                    const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_updateAll: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            //PASSWORD CHECKINGS
                            if(cookieDetails.uPassword !== result.password){
                                debug.error('Account.service@_updateAll: user details and cookie isnt match');
                                connection.close();
                                return callback(true, {wrongPassword : false, msg : 'Invalid cookie'});
                            }else if(result.password!==details.curPassword){
                                debug.error('Account.service@_updateAll: user curPassword isn\'t matched');
                                connection.close();
                                return callback(true, {wrongPassword : true, msg : 'Current password it\'s wrong'});
                            }else {
                                callback(null, connection, cookieDetails.uEmail);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_updateAll (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Update the nickname & password of the user
             * @param connection
             * @param uEmail
             * @param callback
             */
            function (connection,uEmail, callback) {
                rethinkdb.table('accounts').get(uEmail).update({
                    nickname : details.nickname,
                    password : details.password
                }).run(connection, function (err,result) {
                    connection.close();
                    if(err){
                        debug.error('Account.service@_updateAll: cant update user <' + uEmail + '> nickname & password');
                        connection.close();
                        return callback(true, 'Error happens while updating user nickname & password');
                    }
                    const retVal = {
                        cookie    : {uEmail : uEmail, uPassword : details.password},
                        data      : {nickname : details.nickname}
                    };
                    callback(null, retVal);
                });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Convert on group id the _ to - and reverse,
     * depends on to variable
     *
     * @param id
     * @param to
     * @returns {*}
     */
    function convertGroupID(id, to){
        let retID;
        if(to === '-'){
            retID = id.replace(/_/g, '-');
        }else{
            retID = id.replace(/-/g, '_');
        }
        return retID;
    }
}();

module.exports = accountService;