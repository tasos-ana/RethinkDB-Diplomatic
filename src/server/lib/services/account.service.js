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
        create                  : _create,
        authenticate            : _authenticate,
        info                    : _info,
        participateInfo         : _participateInfo,
        updateAccountDetails    : _updateAccountDetails
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
                    'nickname'          : details.uNickname,
                    'email'             : details.uEmail,
                    'password'          : details.uPassword,
                    'avatar'            : details.uEmail,
                    'groups'            : [],
                    'participateGroups' : [],
                    'openedGroups'      : []
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        debug.error('Account.service@create: cant create user <' + details.uEmail + '> account')
                        return callback(true, 'Error happens while creating new account');
                    }
                    debug.correct('New user <' + details.uEmail + '> added successfully');
                    callback(null, {});
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Authenticate user details providing with database user details
     * @param details    contains uEmail and uPassword
     * @param callback
     * @private
     */
    function _authenticate(details, callback) {
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
                rethinkdb.table('accounts').get(details.uEmail)
                    .pluck('password')
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debug.error('Account.service@authenticate: cant found on database the user <' + details.uEmail + '>');
                            return callback(true, 'Error happens while getting user details');
                        }

                        if(result === null){
                            debug.status('User <' + details.uEmail + '> not found on database');
                            return callback(true, 'User not found');
                        }else{
                            if(result.password !== details.uPassword){
                                debug.status('User <' + details.uEmail + '> and password not matching');
                                return callback(true, 'Email or password its wrong');
                            }else{
                                debug.correct('User <' + details.uEmail + '> authenticated');
                                callback(null, {});
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
                                    "email"                 : result.email,
                                    "nickname"              : result.nickname,
                                    "avatar"                : result.avatar,
                                    "tmpGroupsList"         : result.groups,
                                    "groupsList"            : [ ],
                                    "participateGroupsList" : result.participateGroups,
                                    "groupsNames"           : { },
                                    "openedGroupsData"      : { },
                                    "unreadMessages"        : {groups:0, participate:0},
                                    "openedGroupsList"      : result.openedGroups
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
                rethinkdb.table('groups').orderBy({index : 'userAndName'})
                    .without('lastTimeRead')
                    .filter(
                        function (group) {
                            return group('participateUsers')
                                .contains(data.email)
                                .or(group("user").eq(data.email));
                        })
                    .pluck('id','name')
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
                                }else if(data.participateGroupsList.indexOf(gID) !== -1){
                                    data.groupsNames[gID] = arr[i].name;
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
     * Retrieve participate user info
     *
     * @param uEmail
     * @param cookie
     * @param callback
     * @private
     */
    function _participateInfo(uEmail, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Account.service@_participateInfo: cant connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Get details
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(uEmail).pluck('email','nickname', 'avatar')
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debug.error('Account.service@_participateInfo: cant get user <' + uEmail + '> info');
                            return callback(true, 'Error happens while getting user details');
                        }
                        if(result === null){
                            debug.status('User <' + uEmail + '> do not exists');
                            return callback(true,'Email do not exists');
                        }
                        debug.status('Retrieved info for participate user <' + result.email +'>');
                        callback(null, {
                            "email"                 : result.email,
                            "nickname"              : result.nickname,
                            "avatar"                : result.avatar
                        });
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Update account fields if are not undefined
     *
     * @param details   contains {curPassword, newNickname, newPassword, newAvatar}
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _updateAccountDetails(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Account.service@_updateAccountDetails: cant connect to database');
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'nickname', 'avatar')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_updateAccountDetails: cant get user <' + cookieDetails.uEmail + '> info');
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
                                debug.error('Account.service@_updateAccountDetails: user details and cookie isnt match');
                                connection.close();
                                return callback(true, {wrongPassword : false, msg : 'Invalid cookie'});
                            }else if(result.password!==details.curPassword){
                                debug.error('Account.service@_updateAccountDetails: user curPassword isn\'t matched');
                                connection.close();
                                return callback(true, {wrongPassword : true, msg : 'Current password it\'s wrong'});
                            }else {
                                if (details.newNickname === undefined){
                                    details.newNickname = result.nickname;
                                }
                                if (details.newPassword === undefined){
                                    details.newPassword = result.password;
                                }
                                if (details.newAvatar === undefined){
                                    details.newAvatar = result.avatar;
                                }
                                callback(null, connection, cookieDetails.uEmail);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_updateAccountDetails (catch): user details and cookie isnt match');
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
            function (connection, uEmail, callback) {
                rethinkdb.table('accounts').get(uEmail).update({
                    nickname    : details.newNickname,
                    password    : details.newPassword,
                    avatar      : details.newAvatar
                }).run(connection, function (err,result) {
                    connection.close();
                    if(err){
                        debug.error('Account.service@_updateAccountDetails: cant update user <' + uEmail + '> account details');
                        connection.close();
                        return callback(true, 'Error happens while updating user account details');
                    }
                    const retVal = {
                        cookie    : {uEmail : uEmail, uPassword : details.newPassword},
                        data      : {nickname : details.newNickname, avatar : details.newAvatar}
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