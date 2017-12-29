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
        createGroup         : _createGroup,
        retrieveGroupData   : _retrieveGroupData,
        retrieveGroupName   : _retrieveGroupName,
        addData             : _addData,
        deleteGroup         : _deleteGroup,
        updateGroupName     : _updateGroupName,
        insertOpenedGroup   : _insertOpenedGroup,
        removeOpenedGroup   : _removeOpenedGroup
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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
                    'name': gName,
                    'user': details.uEmail
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
                    data            : 'Group created by ' + details.uNickname + " (" + details.uEmail + ')',
                    type            : 'text',
                    time            : Date.now()
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
                    debug.correct('New group <' + details.gID + '> added successful on user <' + details.uEmail + '>');
                    callback(null, {gID : details.gID, gName : gName});
                });
            }
        ], function (err, data) {
            callback(err !== null, data);
        });
    }

    /**
     * Retrieve group data from database
     *
     * @param gID       id of group
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _retrieveGroupData(gID, cookie, callback) {
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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
                            if(cookieDetails.uPassword !== result.password || result.groups.indexOf(gID) === -1){
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
                rethinkdb.table('groups').get(convertGroupID(gID, '-'))('name')
                    .run(connection, function (err, gName) {
                        if(err){
                            debug.error('Account.service@_retrieveGroupData: cant retrieve group <' + gID + '> name');
                            connection.close();
                            return callback(true, 'Error happens while retrieving group name');
                        }
                        callback(null, connection, gName);
                    });
            },
            /**
             * Retrieve data from table
             * @param connection
             * @param gName         the name of the group
             * @param callback
             */
            function (connection, gName, callback) {
                rethinkdb.table(gID).orderBy("time")
                    .run(connection,function (err,cursor) {
                        connection.close();
                        if(err){
                            debug.error('Group.service@_retrieveGroupData: cant retrieve group <' + gID + '> data');
                            return callback(true, 'Error happens while getting group data');
                        }
                        cursor.toArray(function(err, results) {
                            if (err){
                                debug.error('Group.service@_retrieveGroupData: cant convert group <' + gID + '> data to array');
                                return callback(true, 'Error happens while converting data to array');
                            }
                            debug.correct('Retrieve data from group <' + gID + '> successful');
                            callback(null,{id : gID, name : gName, value: results});
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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
                            if(cookieDetails.uPassword !== result.password || result.groups.indexOf(gID) === -1){
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
                rethinkdb.table('groups').get(convertGroupID(gID, '-'))('name')
                    .run(connection, function (err, gName) {
                        connection.close();
                        if(err){
                            debug.error('Account.service@_retrieveGroupName: cant retrieve group <' + gID + '> name');
                            return callback(true, 'Error happens while retrieving group name');
                        }
                        callback(null,{id : gID, name : gName});
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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

                            if(cookieDetails.uPassword !== result.password || result.groups.indexOf(details.gID) === -1){
                                debug.error('Account.service@add: user details and cookie isnt match');
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
                rethinkdb.table(details.gID).insert({
                    'data' : details.data,
                    'type' : details.type,
                    'time' : details.time,
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        debug.error('Group.service@add: cant insert new data on group <' + details.gID + '>');
                        return callback(true, 'Error happens while adding new data');
                    }
                    debug.correct('New data added on group <' + details.gID + '> successful');
                    callback(null, result);
                });
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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
                                debug.error('Account.service@UpdateName: user details and cookie isnt match');
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
     * @param details   contains gID,gName
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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
                                debug.error('Account.service@delete: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection, cookieDetails.uEmail);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@delete (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Update lastlogin field on table, that fire change and after that feed on group close
             * @param connection
             * @param uEmail
             * @param callback
             */
            function (connection, uEmail, callback) {
                rethinkdb.table(details.gID).get('settings').update({lastLogin : Date.now()})
                    .run(connection, function (err, result) {
                        if(err){
                            debug.error('Group.service@delete: cant update group <' + details.gID + '> lastLogin field');
                            connection.close();
                            return callback(true, 'Cant update group lastLogin field');
                        }
                        callback(null, connection, uEmail);
                    });
            },
            /**
             * Delete from user the gID
             * @param connection
             * @param uEmail        user email
             * @param callback
             */
            function (connection, uEmail, callback) {
                rethinkdb.table('accounts').get(uEmail).update({
                  groups : rethinkdb.row('groups').deleteAt(rethinkdb.row('groups').offsetsOf(details.gID)(0))
                }).run(connection,function (err,results) {
                        if(err){
                            debug.error('Group.service@delete: cant delete group <' + details.gID + '> from user <' + uEmail + '>');
                            connection.close();
                            return callback(true, 'Error happens while deleting group from user');
                        }
                        callback(null, connection, uEmail);
                    });
            },
            /**
             * Delete from user the gID at field openedGRoups
             * @param connection
             * @param uEmail        user email
             * @param callback
             */
            function (connection, uEmail, callback) {
                rethinkdb.table('accounts').get(uEmail).update({
                    openedGroups : rethinkdb.row('openedGroups').deleteAt(rethinkdb.row('openedGroups').offsetsOf(details.gID)(0))
                }).run(connection,function (err,results) {
                    if(err){
                        debug.error('Group.service@delete: cant delete openedGroups <' + details.gID + '> from user <' + uEmail + '>');
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
                        callback(null, details);
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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
                                debug.error('Group.service@insertOpenedGroup:: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                details.uEmail    = cookieDetails.uEmail;
                                details.uNickname = result.nickname;

                                callback(null, details, connection);
                            }
                        });

                }catch (e){
                    debug.error('Group.service@insertOpenedGroup: user details and cookie isnt match');
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
                    openedGroups: rethinkdb.row('openedGroups').append(details.gID)
                }).run(connection, function (err, result) {
                    connection.close();
                    if (err) {
                        debug.error('Group.service@insertOpenedGroup: cant update user <' + details.uEmail + '> groups');
                        return callback(true, 'Error happens while update user groups');
                    }
                    debug.correct('Group <' + details.gID + '> opened successful on user <' + details.uEmail + '>');
                    callback(null, {});
                });
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
                    rethinkdb.table('accounts').get(cookieDetails.uEmail)
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
                        debug.error('Group.service@insertOpenedGroup: cant update user <' + details.uEmail + '> groups');
                        return callback(true, 'Error happens while update user groups');
                    }
                    debug.correct('Group <' + details.gID + '> opened successful on user <' + details.uEmail + '>');
                    callback(null, {});
                });
            }
        ], function (err, data) {
            callback(err !== null, data);
        });
    }

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