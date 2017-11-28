'use strict';

const rethinkdb = require('rethinkdb');
const async     = require('async');

const db        = require('./database.service');
const debug     = require('./debug.service');
const encryption = require('./encryption.service');

/**
 * API for managing groups on database
 * @type {{createGroup, retrieveGroup, addData, deleteGroup, updateGroupName}}
 */
const groupService = function () {

    return {
        createGroup     : _createGroup,
        retrieveGroup   : _retrieveGroup,
        addData         : _addData,
        deleteGroup     : _deleteGroup,
        updateGroupName : _updateGroupName
    };

    /**
     * Create new group on database
     *
     * @param details   contains gName and uEmail
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     * @todo prepei otan ginetai kapoio fail na uparxei kati san transaction kai na anerei ola ta prohgoumena
     */
    function _createGroup(details, cookie, callback) {
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
                rethinkdb.table('accounts').get(details.uEmail)
                    .run(connection,function (err,result) {
                        if(err){
                            debug.error('Group.service@create: cant get user <' + details.uEmail + '> info');
                            connection.close();
                            return callback(true, 'Error happens while getting user details');
                        }
                        if(result === null){
                            debug.status('User <' + details.uEmail + '> do not exists');
                            connection.close();
                            return callback(true,'Email do not exists');
                        }
                        try{
                            const cookieDetails = JSON.parse(encryption.decrypt(cookie));
                            if(cookieDetails.uEmail !== details.uEmail || cookieDetails.uPassword !== result.password){
                                debug.error('Group.service@create:: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        }catch (e){
                            debug.error('Group.service@create: user details and cookie isnt match');
                            connection.close();
                            return callback(true,'Invalid cookie');
                        }
                    });
            },
            /**
             * Stage 1:
             * Add gID on groups tables and get the generated ID
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').insert({
                    'name': details.gName,
                    'user': details.uEmail
                }).run(connection, function (err, result) {
                    if (err) {
                        debug.error('Group.service@create: can\'t insert <' + details.gName + '> on table \'groups\'');
                        connection.close();
                        return callback(true, 'Error happens while adding new group');
                    }
                    debug.status('New group <' + details.gName + '> added successful');

                    const tmpID = result.generated_keys[0];
                    const gID = tmpID.replace(/-/g, '_');

                    callback(null, gID, connection);
                });
            },
            /**
             * Stage 2:
             * Initialize new table with the generated ID from stage 1
             * @param gID           group ID generated on stage 1
             * @param connection
             * @param callback
             */
            function(gID, connection, callback) {
                rethinkdb.tableCreate(gID)
                    .run(connection, function (err, result) {
                        if (err) {
                            debug.error('Group.service@create: cant create new table <' + gID + '>');
                            connection.close();
                            return callback(true, 'Error happens while creating table');
                        }

                        debug.status('Created new table <' + gID + '> with primary key \'id\' ');

                        callback(null, gID, connection);
                    });
            },
            /**
             * Stage 3.1:
             * Retrieve user groups list
             * @param gID           group ID generated on stage 1
             * @param connection
             * @param callback
             */
            function(gID, connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).getField('groups')
                    .run(connection,function (err,result) {
                        if (err) {
                            debug.error('Group.service@create: cant retrieve groups for user <' + details.uEmail + '>');
                            connection.close();
                            return callback(true, 'Error happens while retrieving user group');
                        }
                        result[gID] = {id : gID, name : details.gName};

                        callback(null,result, gID, connection);
                    });
            },
            /**
             * Stage 3.2:
             * Update user groups list with the new
             * @param newGroup      new groups list for user
             * @param gID           group ID generated on stage 1
             * @param connection
             * @param callback
             */
            function(newGroup, gID, connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update({
                    groups: newGroup
                }).run(connection, function (err, result) {
                    if (err) {
                        debug.error('Group.service@create: cant update user <' + details.uEmail + '> groups');
                        connection.close();
                        return callback(true, 'Error happens while update user groups');
                    }
                    debug.status('New group <' + details.gName + '> inserted on user <' + details.uEmail + '> groups successful');
                    callback(null, gID, connection);
                });
            },
            /**
             * Stage 4:
             * Add socket field on group table
             * @param gID           group ID generated on stage 1
             * @param connection
             * @param callback
             * @todo na allaksw to socket se info || settings || details gia to group
             */
            function (gID, connection, callback) {
                rethinkdb.table(gID).insert({
                    id              : 'socket',
                    data            : 'Group created by ' + details.uEmail,
                    type            : 'text',
                    lastLogin       : Date.now(),
                    time            : Date.now()
                }).run(connection,function (err,result) {
                    if (err) {
                        debug.error('Group.service@create: cant insert socket on group <' + gID + '>');
                        connection.close();
                        return callback(true, 'Error happens while adding socket on group');
                    }
                    debug.correct('New group <' + gID + '> added successful on user <' + details.uEmail + '>');
                    callback(null, {gID : gID, gName : details.gName});
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
    function _retrieveGroup(gID, cookie, callback) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@retrieve: cant connect on database');
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
                                debug.error('Account.service@retrieve: cant get user <' + cookieDetails.uEmail + '> info');
                                connection.close();
                                return callback(true, 'Error happens while getting user details');
                            }
                            if(result === null){
                                debug.status('User <' + cookieDetails.uEmail + '> do not exists');
                                connection.close();
                                return callback(true,'Email do not exists');
                            }

                            if(cookieDetails.uPassword !== result.password || result.groups[gID] === undefined){
                                debug.error('Account.service@retrieve: user details and cookie isnt match');
                                connection.close();
                                return callback(true,'Invalid cookie');
                            }else{
                                callback(null,connection);
                            }
                        });
                }catch (e){
                    debug.error('Account.service@retrieve (catch): user details and cookie isnt match');
                    connection.close();
                    return callback(true,'Invalid cookie');
                }
            },
            /**
             * Retrieve data from table
             * @param connection
             * @param callback
             */
            function (connection,callback) {
                rethinkdb.table(gID).orderBy("time")
                    .run(connection,function (err,cursor) {
                        connection.close();
                        if(err){
                            debug.error('Group.service@retrieve: cant retrieve group <' + gID + '> data');
                            return callback(true, 'Error happens while getting group data');
                        }
                        cursor.toArray(function(err, results) {
                            if (err){
                                debug.error('Group.service@retrieve: cant convert group <' + gID + '> data to array');
                                return callback(true, 'Error happens while converting data to array');
                            }
                            debug.correct('Retrieve data from group <' + gID + '> successful');
                            callback(null,{id : gID, value: results});
                        });
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

                            if(cookieDetails.uPassword !== result.password || result.groups[details.gID] === undefined){
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
     * @param details
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     * @todo implement
     */
    function _updateGroupName(details, cookie, callback) {

    }

    /**
     * Delete the group table from database
     * @param gID       id of the group
     * @param cookie    Authorization field from request, required for validation
     * @param callback
     * @private
     */
    function _deleteGroup(gID, cookie, callback) {
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

                            if(cookieDetails.uPassword !== result.password || result.groups[gID] === undefined){
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
                rethinkdb.table(gID).get('socket').update({lastLogin : Date.now()})
                    .run(connection, function (err, result) {
                        if(err){
                            debug.error('Group.service@delete: cant update group <' + gID + '> lastLogin field');
                            connection.close();
                            return callback(true, 'Cant update group lastLogin field');
                        }
                        callback(null, connection, uEmail);
                    });
            },
            /**
             * Get user details and pass on next function the groups list
             * @param connection
             * @param uEmail        user email
             * @param callback
             */
            function (connection, uEmail, callback) {
                rethinkdb.table('accounts').get(uEmail).getField('groups')
                    .run(connection,function (err, results) {
                        if(err){
                            debug.error('Group.service@delete: cant get user <' + uEmail + '> details');
                            connection.close();
                            return callback(true, 'Cant retrieve user details');
                        }
                        callback(null, connection, results, uEmail);
                    });
            },
            /**
             * Delete from user the gID that we will delete
             * @param connection
             * @param groupsResult  user current groups
             * @param uEmail        user email
             * @param callback
             */
            function (connection, groupsResult, uEmail, callback) {
                delete groupsResult[gID];
                rethinkdb.table('accounts').get(uEmail).update({
                  groups : groupsResult
                }).run(connection,function (err,results) {
                        if(err){
                            debug.error('Group.service@delete: cant delete group <' + gID + '> from user <' + uEmail + '>');
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
                const _gID = gID.replace(/_/g, '-');
                rethinkdb.table('groups').get(_gID).delete()
                    .run(connection, function (err, result) {
                        if(err){
                            debug.error('Group.service@delete: cant delete group <' + gID + '> from groups table');
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
                rethinkdb.tableDrop(gID)
                    .run(connection,function (err, results) {
                        connection.close();
                        if(err){
                            debug.error('Group.service@delete: cant delete group <' + gID + '> ');
                            return callback(true, 'Error happens while deleting group');
                        }
                        debug.correct('Table <' + gID + '> dropped successful');
                        callback(null, results);
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

}();

module.exports = groupService;