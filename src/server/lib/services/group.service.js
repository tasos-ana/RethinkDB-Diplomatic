'use strict';

const rethinkdb = require('rethinkdb');
const async     = require('async');

const db        = require('./database.service');
const debug     = require('./debug.service');
const encryption = require('./security/encryption.security');

/**
 * API for managing groups on database
 * @type {{createGroup, retrieveGroup, addData, deleteGroup, updateGroupName}}
 */
const groupService = function () {

    return {
        createGroup                 : _createGroup,
        shareGroup                  : _shareGroup,
        retrieveGroupData           : _retrieveGroupData,
        retrieveGroupParticipants   : _retrieveGroupParticipants,
        retrieveFile                : _retrieveFile,
        retrieveGroupName           : _retrieveGroupName,
        addData                     : _addData,
        deleteGroup                 : _deleteGroup,
        leaveParticipateGroup       : _leaveParticipateGroup,
        removeParticipateUser       : _removeParticipateUser,
        updateGroupName             : _updateGroupName,
        insertOpenedGroup           : _insertOpenedGroup,
        removeOpenedGroup           : _removeOpenedGroup,
        messageNotification         : _messageNotification,
        deleteMessage               : _deleteMessage,
        modifyMessage               : _modifyMessage
    };

    /**
     * Create new group on database
     *
     * @param gName     the group name
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     * @todo prepei otan ginetai kapoio fail na uparxei kati san transaction kai na anerei ola ta prohgoumena
     */
    function _createGroup(gName, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Group.service@create: can\'t connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Stage 0:
             * Validate req cookie with details on database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                try{
                    const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('email', 'nickname')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Group.service@create: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password){
                                debug.error('Group.service@create:: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                const details = {
                                    uEmail    : cookieDetails.uEmail,
                                    uNickname : result.nickname
                                };
                                callback(null, details, connection);
                            }
                        });

                }catch (e){
                    debug.error('Group.service@create: user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Stage 1:
             * Add gID on groups tables and get the generated ID
             * @param connection
             * @param details       contains uEmail, uNickname
             * @param callback
             */
            function (details, connection, callback) {
                rethinkdb.table('groups').insert({
                    'name'              : gName,
                    'user'              : details.uEmail,
                    "participateUsers"  : [],
                    'unreadMessages'    : 0
                }).run(connection, function (err, result) {
                    if (err) {
                        debug.error('Group.service@create: can\'t insert <' + gName + '> on table \'groups\'');
                        connection.close();
                        return callback(true, 'Error happens while adding new group');
                    }
                    debug.status('New group <' + gName + '> added successful');
                    details.gID = convertGroupID(result.generated_keys[0] , '_');

                    callback(null, details, connection);
                });
            },
            /**
             * Stage 2:
             * Initialize new table with the generated ID from stage 1
             * @param details       contains gID, uEmail, uNickname
             * @param connection
             * @param callback
             */
            function(details, connection, callback) {
                rethinkdb.tableCreate(details.gID)
                    .run(connection, function (err, result) {
                        if (err) {
                            debug.error('Group.service@create: cant create new table <' + details.gID + '>');
                            connection.close();
                            return callback(true, 'Error happens while creating table');
                        }

                        debug.status('Created new table <' + details.gID + '> with primary key \'id\' ');

                        callback(null, details, connection);
                    });
            },
            /**
             * Stage 3:
             * Add created field on group table
             * @param details       contains gID, uEmail, uNickname
             * @param connection
             * @param callback
             */
            function (details, connection, callback) {
                rethinkdb.table(details.gID).insert({
                    id              : 'created',
                    data            : 'Group created by (' + details.uEmail + ')',
                    type            : 'text',
                    time            : Date.now(),
                    user            : details.uEmail
                }).run(connection,function (err,result) {
                    if (err) {
                        debug.error('Group.service@create: cant insert created data on group <' + details.gID + '>');
                        return callback(true, 'Error happens while adding created field on group');
                    }
                    callback(null, details, connection);
                });
            },
            /**
             * Stage 4:
             * Update the groups list with the new gID
             * @param details       contains gID, uEmail, uNickname
             * @param connection
             * @param callback
             */
            function(details, connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update({
                    groups: rethinkdb.row('groups').append(details.gID)
                }).run(connection, function (err, result) {
                    if (err) {
                        debug.error('Group.service@create: cant update user <' + details.uEmail + '> groups');
                        connection.close();
                        return callback(true, 'Error happens while update user groups');
                    }
                    callback(null, details, connection);
                });
            },
            /**
             * Stage 5:
             * Create index for group on field time
             * @param details
             * @param connection
             * @param callback
             */
            function (details, connection, callback) {
                rethinkdb.table(details.gID).indexCreate('time')
                    .run(connection, function (err,result) {
                        connection.close();
                        debug.correct('New group <' + details.gID + '> added successful on user <' + details.uEmail + '>');
                        callback(null, {gID : details.gID, gName : gName});
                    });
            }
        ], function (err, data) {
            callback(err !== null, data);
        });
    }

    /**
     * Share a group to another user
     *
     * @param details   contains email: of the user that we share group, gID: the id of the group
     * @param cookie
     * @param callback
     * @private
     */
    function _shareGroup(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_shareGroup: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_shareGroup: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password ){
                                debug.error('Account.service@_shareGroup: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else if(result.groups.indexOf(details.gID) === -1){
                                debug.error('Account.service@_shareGroup: group with id <' + details.gID +'> isn\'t on user groups');
                                connection.close();
                                return callback(true,'Group that trying to share isn\'t on user groups list');
                            }
                            else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_shareGroup (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Check if the group already shared to that user
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.email).pluck('participateGroups')
                    .run(connection, function (err, result) {
                        if(err){
                            debug.error('Account.service@_shareGroup: cant retrieve participateGroup from user <' + details.email + '>');
                            connection.close();
                            return callback(true, 'Error happens while retrieving group name');
                        }
                        if(result['participateGroups'].indexOf(details.gID) === -1){
                            callback(null, connection, false);
                        }else{
                            debug.status('Account.service@_shareGroup: group already exists on user');
                            return callback(null, connection, true);
                        }
                    });
            },
            /**
             * Add the gID on user participate
             *
             * @param connection
             * @param exist if group already exist
             * @param callback
             */
            function (connection,exist, callback) {
                if(!exist){
                    rethinkdb.table('accounts').get(details.email).update({
                        participateGroups: rethinkdb.row('participateGroups').append(details.gID)
                    }).run(connection, function (err, result) {
                        if(err){
                            debug.error('Account.service@_shareGroup: cant append shared group on user <' + details.email + '>');
                            connection.close();
                            return callback(true, 'Error happens while retrieving group name');
                        }
                        callback(null, connection, false);
                    });
                }else{
                    callback(null,connection,true);
                }

            },
            /**
             * Add the gID on group participate
             *
             * @param connection
             * @param exist
             * @param callback
             */
            function (connection, exist, callback) {
                if(!exist){
                    rethinkdb.table('groups').get(convertGroupID(details.gID,'-')).update({
                        participateUsers: rethinkdb.row('participateUsers').append(details.email)
                    }).run(connection, function (err, result) {
                        if(err){
                            debug.error('Account.service@_shareGroup: cant append user on shared group <' + details.gID + '>');
                            connection.close();
                            return callback(true, 'Error happens while retrieving group name');
                        }
                        callback(null, {gID: details.gID, email: details.email, exist : false});
                    });
                }else{
                    callback(null, {exist : true});
                }

            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Retrieve group data from database
     *
     * @param details   contains gID, afterFrom, limitVal
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _retrieveGroupData(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_retrieveGroupData: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups', 'participateGroups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_retrieveGroupData: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password ||
                                (result.groups.indexOf(details.gID) === -1 && result.participateGroups.indexOf(details.gID) === -1)){
                                debug.error('Account.service@_retrieveGroupData: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_retrieveGroupData (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Retrieve group name from table groups
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(details.gID, '-')).pluck('name')
                    .run(connection, function (err, result) {
                        if(err){
                            debug.error('Account.service@_retrieveGroupData: cant retrieve group <' + details.gID + '> name');
                            connection.close();
                            return callback(true, 'Error happens while retrieving group name');
                        }
                        callback(null, connection, result.name);
                    });
            },
            /**
             * Retrieve data from table
             * @param connection
             * @param gName         the name of the group
             * @param callback
             */
            function (connection, gName, callback) {
                rethinkdb.table(details.gID).orderBy(rethinkdb.desc('time')).pluck('data','type','time','id','modify','user')
                    .filter(rethinkdb.row('time').lt(Number(details.afterFrom))).limit(Number(details.limitVal))
                    .run(connection,function (err,cursor) {
                        connection.close();
                        if(err){
                            debug.error('Group.service@_retrieveGroupData: cant retrieve group <' + details.gID + '> data');
                            return callback(true, 'Error happens while getting group data');
                        }
                        cursor.toArray(function(err, results) {
                            if (err){
                                debug.error('Group.service@_retrieveGroupData: cant convert group <' + details.gID + '> data to array');
                                return callback(true, 'Error happens while converting data to array');
                            }
                            debug.correct('Retrieve data from group <' + details.gID + '> successful');
                            callback(null,{id : details.gID, name : gName, value: results});
                        });
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    function _retrieveGroupParticipants(gID, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_retrieveGroupParticipants: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_retrieveGroupParticipants: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password || result.groups.indexOf(gID) === -1 ){
                                debug.error('Account.service@_retrieveGroupParticipants: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_retrieveGroupParticipants (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Retrieve group participants  from table groups
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(gID, '-')).pluck('participateUsers')
                    .run(connection, function (err, results) {
                        connection.close();
                        if(err){
                            debug.error('Account.service@_retrieveGroupParticipants: cant retrieve group <' + gID + '> participants');
                            return callback(true, 'Error happens while retrieving group participants');
                        }
                        callback(null,{gID: gID, participants : results.participateUsers});
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Retrieve file details
     * @param details
     * @param cookie
     * @param callback
     * @private
     */
    function _retrieveFile(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_retrieveFile: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_retrieveFile: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password || result.groups.indexOf(details.gID) === -1){
                                debug.error('Account.service@_retrieveFile: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_retrieveFile (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Retrieve file from table
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table(details.gID).get(details.mID).pluck('data','type','file')
                    .run(connection,function (err,results) {
                        connection.close();
                        if(err){
                            debug.error('Group.service@_retrieveFile: cant retrieve group <' + details.gID + '> data');
                            return callback(true, 'Error happens while getting group data');
                        }
                        debug.correct('Retrieve data from group <' + details.gID + '> successful');
                        callback(null,{
                            gID     : details.gID,
                            mID     : details.mID,
                            name    : results.data,
                            type    : results.type,
                            file    : results.file
                        });
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Retrieve group name from database
     * @param gID
     * @param cookie
     * @param callback
     * @private
     */
    function _retrieveGroupName(gID, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_retrieveGroupName: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups', 'participateGroups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_retrieveGroupName: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password ||
                                (result.groups.indexOf(gID) === -1 && result.participateGroups.indexOf(gID) === -1))
                            {
                                debug.error('Account.service@_retrieveGroupName: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_retrieveGroupName (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Retrieve group name from table groups
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(gID, '-')).pluck('name')
                    .run(connection, function (err, result) {
                        connection.close();
                        if(err){
                            debug.error('Account.service@_retrieveGroupName: cant retrieve group <' + gID + '> name');
                            return callback(true, 'Error happens while retrieving group name');
                        }
                        callback(null,{id : gID, name : result.name});
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Add new data on group
     *
     * @param details   contains data,type,time and gID
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _addData(details,cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@add: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups', 'participateGroups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@add: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details for cookie validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            if(cookieDetails.uPassword !== result.password ||
                                (result.groups.indexOf(details.gID) === -1 && result.participateGroups.indexOf(details.gID) === -1)){
                                debug.error('Account.service@add: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@accountInfo (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Insert the data on database table
             * @param connection
             * @param callback
             */
            function(connection,callback) {
                if(details.type === 'text'){
                    rethinkdb.table(details.gID).insert({
                        'data' : details.data,
                        'type' : details.type,
                        'time' : details.time,
                        'user' : details.user
                    }).run(connection,function(err,result){
                        connection.close();
                        if(err){
                            debug.error('Group.service@add: cant insert new data (text) on group <' + details.gID + '>');
                            return callback(true, 'Error happens while adding new data');
                        }
                        debug.correct('New data (text) added on group <' + details.gID + '> successful');
                        callback(null, {gID : details.gID, value : result});
                    });
                }else{
                    rethinkdb.table(details.gID).insert({
                        'data' : details.data,
                        'type' : details.type,
                        'time' : details.time,
                        'file' : details.file,
                        'user' : details.user
                    }).run(connection,function(err,result){
                        connection.close();
                        if(err){
                            debug.error('Group.service@add: cant insert new data (file) on group <' + details.gID + '>');
                            return callback(true, 'Error happens while adding new data');
                        }
                        debug.correct('New data (file) added on group <' + details.gID + '> successful');
                        callback(null, {gID : details.gID, value : result});
                    });
                }
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Update the group name
     *
     * @param details   contains gID,gName
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _updateGroupName(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@UpdateName: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@UpdateName: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            if(cookieDetails.uPassword !== result.password || result.groups.indexOf(details.gID) === -1){
                                debug.error('Account.service@UpdateName: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@UpdateName (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Delete the group(gID) from groups table
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(details.gID,'-')).update({
                    name : details.gName
                }).run(connection, function (err, result) {
                    connection.close();
                    if(err){
                        debug.error('Group.service@UpdateName: cant update group <' + gID + '> name');
                        return callback(true, 'Error happens while updating group name');
                    }
                    callback(null, result);
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Delete the group table from database
     *
     * @param details   contains gID
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _deleteGroup(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@delete: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@delete: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            if(cookieDetails.uPassword !== result.password || result.groups.indexOf(details.gID) === -1){
                                debug.error('Account.service@delete: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                details.uEmail = cookieDetails.uEmail;
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@delete (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Retrieve participateUsers and remove user
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(details.gID,'-')).pluck('participateUsers')
                    .run(connection, function (err, results) {
                        if(err){
                            debug.error('Group.service@delete: cant retrieve participateUsers from group <' + details.gID + '>');
                            connection.close();
                            return callback(true, 'Error happens while retrieving participateUsers from group');
                        }
                        for(let i=0; i<results.participateUsers.length; ++i){
                            const uEmail = results.participateUsers[i];
                            _removeParticipateUser({'uEmail': uEmail,'gID': details.gID}, function (err, responseData) {
                                if(err){
                                    debug.error('Group.service@delete: cant delete a participate user from group <' + responseData.gID + '>');
                                    connection.close();
                                    return callback(true, 'Error happens while deleting participate user from group');
                                }
                                debug.status('Group.service@delete: participate user deleted from group <' + responseData.gID + '>');
                            });
                        }

                        callback(null,connection);
                    });
            },
            /**
             * Delete from user groups the gID
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update(function(user) {
                    return rethinkdb.branch(
                        user("groups").contains(details.gID),
                        {groups : user('groups').deleteAt(user('groups').offsetsOf(details.gID)(0))},{}
                    )
                }).run(connection,function (err,results) {
                    if(err){
                        debug.error('Group.service@delete: cant delete group <' + details.gID + '> from user <' + details.uEmail + '> from groups');
                        connection.close();
                        return callback(true, 'Error happens while deleting group from user');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Delete from user openedGroups the gID
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update(function(user) {
                    return rethinkdb.branch(
                        user("openedGroups").contains(details.gID),
                        {openedGroups : user('openedGroups').deleteAt(user('openedGroups').offsetsOf(details.gID)(0))},{}
                    )
                }).run(connection,function (err,results) {
                    if(err){
                        debug.error('Group.service@delete: cant delete group <' + details.gID + '> from user <' + details.uEmail + '> from openedGroups');
                        connection.close();
                        return callback(true, 'Error happens while deleting group from user');
                    }
                    callback(null, connection);
                });

            },
            /**
             * Delete the group(gID) from groups table
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(details.gID,'-')).delete()
                    .run(connection, function (err, result) {
                        if(err){
                            debug.error('Group.service@delete: cant delete group <' + details.gID + '> from groups table');
                            connection.close();
                            return callback(true, 'Error happens while deleting group from groups table');
                        }
                        callback(null, connection);
                    });
            },
            /**
             * Delete the group table from database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.tableDrop(details.gID)
                    .run(connection,function (err, results) {
                        connection.close();
                        if(err){
                            debug.error('Group.service@delete: cant delete group <' + details.gID + '> ');
                            return callback(true, 'Error happens while deleting group');
                        }
                        debug.correct('Table <' + details.gID + '> dropped successful');
                        callback(null, {gID : details.gID});
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Remove the group from user
     *
     * @param details contains uEmail, gID
     * @param callback
     * @private
     */
    function _removeParticipateUser(details, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_removeParticipateUser: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            /**
             * Delete from user participateGroups the gID
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update(
                    function(user) {
                        return rethinkdb.branch(
                            user("participateGroups").contains(details.gID),
                            {participateGroups : user('participateGroups').deleteAt(user('participateGroups').offsetsOf(details.gID)(0))},{}
                        )
                    }).run(connection,function (err,results) {
                    if(err){
                        debug.error('Group.service@_removeParticipateUser: cant delete group <' + details.gID + '> from user <' + details.uEmail + '> from participateGroups');
                        connection.close();
                        return callback(true, 'Error happens while deleting group from user');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Delete from user openedGroups the gID
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update(
                    function(user) {
                        return rethinkdb.branch(
                                user("openedGroups").contains(details.gID),
                                {openedGroups : user('openedGroups').deleteAt(user('openedGroups').offsetsOf(details.gID)(0))},{}
                        )
                    }).run(connection,function (err,results) {
                    if(err){
                        debug.error('Group.service@_removeParticipateUser: cant delete group <' + details.gID + '> from user <' + details.uEmail + '> from openedGroups');
                        connection.close();
                        return callback(true, 'Error happens while deleting group from user');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Delete the user from participateUsers
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(details.gID,'-')).update({
                    participateUsers : rethinkdb.row('participateUsers').deleteAt(rethinkdb.row('participateUsers').offsetsOf(details.uEmail)(0))
                }).run(connection, function (err, result) {
                    connection.close();
                    if(err){
                        debug.error('Group.service@_leaveParticipateGroup: cant delete participate user <' + details.uEmail + '> from group <' + details.gID);
                        return callback(true, 'Error happens while delete participate user from group');
                    }
                    callback(null, {gID : details.gID, uEmail: details.uEmail});
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Leave from participate group
     *
     * @param details   contains gID
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _leaveParticipateGroup(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_leaveParticipateGroup: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'participateGroups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_leaveParticipateGroup: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            if(cookieDetails.uPassword !== result.password || result.participateGroups.indexOf(details.gID) === -1){
                                debug.error('Account.service@_leaveParticipateGroup: user details and cookie isn\'t match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                details.uEmail = cookieDetails.uEmail;
                                callback(null, connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_leaveParticipateGroup (catch): user details and cookie isn\'t match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Delete from user in openedGroups the gID
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update(
                    function(user) {
                        return rethinkdb.branch(
                            user("openedGroups").contains(details.gID),
                            {openedGroups : user('openedGroups').deleteAt(user('openedGroups').offsetsOf(details.gID)(0))},{}
                        )

                    }).run(connection,function (err,results) {
                    if(err){
                        debug.error('Group.service@_leaveParticipateGroup: cant delete group <' + details.gID + '> from user <' + details.uEmail + '>');
                        connection.close();
                        return callback(true, 'Error happens while deleting group from user');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Delete from user in participateGroups the gID
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update(
                    function(user) {
                        return rethinkdb.branch(
                            user("participateGroups").contains(details.gID),
                            {participateGroups : user('participateGroups').deleteAt(user('participateGroups').offsetsOf(details.gID)(0))},{}
                        )
                    }).run(connection,function (err,results) {
                    if(err){
                        debug.error('Group.service@_leaveParticipateGroup: cant delete group <' + details.gID + '> from user <' + details.uEmail + '>');
                        connection.close();
                        return callback(true, 'Error happens while deleting group from user');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Delete the user from participateUsers
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(details.gID,'-')).update({
                    participateUsers : rethinkdb.row('participateUsers').deleteAt(rethinkdb.row('participateUsers').offsetsOf(details.uEmail)(0))
                }).run(connection, function (err, result) {
                    connection.close();
                    if(err){
                        debug.error('Group.service@_leaveParticipateGroup: cant delete participate user <' + details.uEmail + '> from group <' + details.gID);
                        return callback(true, 'Error happens while delete participate user from group');
                    }
                    callback(null, {gID : details.gID});
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Insert a group at opened group
     * @param details   contains the id of the group
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _insertOpenedGroup(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Group.service@insertOpenedGroup: can\'t connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Stage 0:
             * Validate req cookie with details on database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                try{
                    const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'nickname')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Group.service@insertOpenedGroup: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password){
                                debug.error('Group.service@insertOpenedGroup:: user details and cookie isnt match (pw dont matched) ');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                details.uEmail    = cookieDetails.uEmail;
                                details.uNickname = result.nickname;

                                callback(null, details, connection);
                            }
                        });

                }catch (e){
                    debug.error('Group.service@insertOpenedGroup: user details and cookie isnt match (catch)');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Checking if group already exist on the openedGroupsList
             * @param details
             * @param connection
             * @param callback
             */
            function (details, connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail)('openedGroups').offsetsOf(details.gID)
                    .run(connection, function (err, result) {
                        details.insertGroup = true;
                        if(err){
                            connection.close();
                            debug.error('Group.service@insertOpenedGroup: cant update user <' + details.uEmail + '> groups');
                            return callback(true, 'Error happens while update user groups');
                        }
                        if(result.length!==0){
                            details.insertGroup = false;
                            debug.correct('Group <' + details.gID + '> already opened for user <' + details.uEmail + '>');
                        }
                        callback(null, details, connection);
                    });
            },
            /**
             * Update the opened groups list with the gID
             * @param details       contains gID, uEmail, uNickname
             * @param connection
             * @param callback
             */
            function(details, connection, callback) {
                if(details.insertGroup) {
                    rethinkdb.table('accounts').get(details.uEmail).update({
                        openedGroups: rethinkdb.row('openedGroups').append(details.gID)
                    }).run(connection, function (err, result) {
                        connection.close();
                        if (err) {
                            debug.error('Group.service@insertOpenedGroup: cant update user <' + details.uEmail + '> groups');
                            return callback(true, 'Error happens while update user groups');
                        }
                        debug.correct('Group <' + details.gID + '> opened successful on user <' + details.uEmail + '>');
                        callback(null, {gID: details.gID});
                    });
                }else{
                    callback(null, {gID: details.gID});
                }
            }
        ], function (err, data) {
            callback(err !== null, data);
        });
    }

    /**
     * Remove a group at opened group
     * @param details   contains gID
     * @param cookie
     * @param callback
     * @private
     */
    function _removeOpenedGroup(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Group.service@removeOpenedGroup: can\'t connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Stage 0:
             * Validate req cookie with details on database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                try{
                    const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'nickname')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Group.service@removeOpenedGroup: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password){
                                debug.error('Group.service@removeOpenedGroup:: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                details.uEmail    = cookieDetails.uEmail;
                                details.uNickname = result.nickname;
                                callback(null, details, connection);
                            }
                        });

                }catch (e){
                    debug.error('Group.service@removeOpenedGroup: user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Update the opened groups list with the gID
             * @param details       contains gID, uEmail, uNickname
             * @param connection
             * @param callback
             */
            function(details, connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update({
                    openedGroups : rethinkdb.row('openedGroups').deleteAt(rethinkdb.row('openedGroups').offsetsOf(details.gID)(0))
                }).run(connection, function (err, result) {
                    connection.close();
                    if (err) {
                        debug.correct('Group <' + details.gID + '> already closed for user <' + details.uEmail + '>');
                    }else {
                        debug.correct('Group <' + details.gID + '> closed successful on user <' + details.uEmail + '>');
                    }
                    callback(null, {});
                });
            }
        ], function (err, data) {
            callback(err !== null, data);
        });
    }

    /**
     * Update how much message user received and he didnt read it yet
     * @param details
     * @param cookie
     * @param callback
     * @private
     */
    function _messageNotification(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err,connection) {
                    if(err){
                        debug.error('Group.service@_messageNotification: can\'t connect to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Stage 0:
             * Validate req cookie with details on database
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                try{
                    const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Group.service@_messageNotification: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }
                            if(cookieDetails.uPassword !== result.password){
                                debug.error('Group.service@_messageNotification:: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }
                            callback(null, connection);
                        });

                }catch (e){
                    debug.error('Group.service@_messageNotification: user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Update the group unreadMessages with new value
             * @param connection
             * @param callback
             */
            function(connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(details.gID, '-')).update({
                    unreadMessages : details.unread
                }).run(connection, function (err, result) {
                    connection.close();
                    if (err) {
                        debug.error('Group.service@_messageNotification: cant update group <' + details.gID + '> unread messages');
                        return callback(true, 'Error happens while update user groups');
                    }
                    debug.correct('Unread messages for group <' + details.gID + '> updated successful');
                    callback(null, {});
                });
            }
        ], function (err, data) {
            callback(err !== null, data);
        });
    }

    /**
     * Delete a message from a group
     * @param details   contains gID, mID
     * @param cookie
     * @param callback
     */
    function _deleteMessage(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_deleteMessage: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups', 'participateGroups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_deleteMessage: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            if(cookieDetails.uPassword !== result.password ||
                                (result.groups.indexOf(details.gID) === -1 && result.participateGroups.indexOf(details.gID) === -1)){
                                debug.error('Account.service@_deleteMessage: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_deleteMessage (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Delete the message from group
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table(details.gID).get(details.mID).delete()
                    .run(connection, function (err, result) {
                        if(err){
                            debug.error('Group.service@delete: cant delete group <' + details.gID + '> from groups table');
                            connection.close();
                            return callback(true, 'Error happens while deleting group from groups table');
                        }
                        callback(null, {});
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Modify message
     *
     * @param details contains gID,mID,data,modify
     * @param cookie
     * @param callback
     * @private
     */
    function _modifyMessage(details, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@_modifyMessage: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail).pluck('password', 'groups', 'participateGroups')
                        .run(connection,function (err,result) {
                            if(err){
                                debug.error('Account.service@_modifyMessage: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details that required for validation');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            if(cookieDetails.uPassword !== result.password ||
                                (result.groups.indexOf(details.gID) === -1 && result.participateGroups.indexOf(details.gID) === -1)){
                                debug.error('Account.service@_modifyMessage: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@_modifyMessage (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Delete the message from group
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table(details.gID).get(details.mID).update({
                    'data'    : details.data,
                    'modify'  : details.modify
                }).run(connection, function (err, result) {
                    if(err){
                        debug.error('Group.service@_modifyMessage: cant modify a message from group <' + details.gID + '>');
                        connection.close();
                        return callback(true, 'Error happens while deleting group from groups table');
                    }
                    callback(null, {});
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    /**
     * Converting in a give ID the - with _ and reverse
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

module.exports = groupService;