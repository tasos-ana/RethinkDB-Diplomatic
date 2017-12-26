'use strict';

const rethinkdb         = require('rethinkdb');
const async             = require('async');

const db                = require('./database.service');
const debug             = require('./debug.service');
const accountService    = require('./account.service');

/**
 * API for sync data between devices
 * @type {{connectAll, disconnectAll, connectSingleGroup, disconnectSingleGroup}}
 */
const syncService = function () {

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    return{
        connectAll              : _connectAll,
        disconnectAll           : _disconnectAll,

        connectSingleGroup      : _connectSingleGroup,
        disconnectSingleGroup   : _disconnectSingleGroup,

        deleteSingleGroup       : _deleteSingleGroup
    };

    /**
     * Retrieve user details from database and
     * then feed on basic components
     *
     * @param socket    communication socket between server,client
     * @private
     */
    function _connectAll(socket) {
        socket.state = 'connecting';
        debug.status('START SOCKET CONNECTION');
        if(socket.request.cookies['userCredentials'] !== undefined){
            accountService.info(undefined, socket.request.cookies['userCredentials'], function (err,responseData) {
                if(!err){
                    //INITIALIAZE STRUCTURE ON socket THAT WE WILL KEEP CONNECTION
                    socket.feeds = {
                        account : {
                            password    : undefined,
                            name        : undefined,
                            insertGroup : undefined,
                            deleteGroup : undefined
                        },
                        groupForBadgeNotification : {
                            //gID : connection
                        },
                        groupOnDataChange : {
                            //gID : connection
                        },
                        groupOnNameChange : {
                            //gID : connection
                        },
                        groupOnDelete : {
                            //gID : connection
                        }
                    };

                    //FEED ON ACCOUNT FOR CHANGES
                    const uEmail = responseData.email;
                    _feedAccountOnNameChange(socket, uEmail);
                    _feedAccountOnPasswordChange(socket, uEmail);
                    _feedAccountOnGroupCreate(socket, uEmail);
                    _feedAccountOnGroupDelete(socket, uEmail);

                    //FEED ON ALL groupsList for badge notification,name change and delete perform
                    //FEED ON ALL openedGroup for data
                    const groupsList = responseData.groupsList;
                    const openedList = responseData.openedGroupsList;
                    while (groupsList.length > 0){
                        const gID = groupsList.pop();
                        if(_tryPop(openedList, gID) !== undefined ){
                            _feedGroupOnDataChange(socket, gID);
                        }
                        _feedGroupOnNameChange(socket, gID);
                        _feedGroupForBadgeNotification(socket, gID);
                    }
                    socket.state = 'ready';
                    debug.status('SOCKET CONNECTION ESTABLISHED');
                }
            });
        }
    }

    /**
     * On socket disconnect or logout we close all opened cursor
     *
     * @param socket    communication socket between server,client
     * @private
     */
    function _disconnectAll(socket) {
        socket.state = 'disconnecting';
        debug.status('START SOCKET DISCONNECT');
        if(socket.feeds !== undefined){
            for(const group in socket.feeds){
                for(const id in socket.feeds[group]){
                    if(socket.feeds[group][id] !== undefined){
                        socket.feeds[group][id].close();
                        debug.correct('Feed on ' + group + ' for <' + id + '> closed successful');
                    }
                }
            }
        }
    }

    /**
     * Connect single group on data and name change
     * @param socket
     * @param gID
     * @private
     */
    function _connectSingleGroup(socket, gID) {
        _feedGroupOnDataChange(socket, gID);
        _feedGroupOnNameChange(socket, gID);
        _feedGroupForBadgeNotification(socket, gID);
    }

    /**
     * After a group deleted we must close all the sockets of group
     * @param socket
     * @param gID
     * @private
     */
    function _disconnectSingleGroup(socket, gID) {
        const groupOnDataChange = socket.feeds.groupOnDataChange[gID];

        if(groupOnDataChange !== undefined){
            groupOnDataChange.close();
            debug.correct('Feed on groupOnDataChange for <' + gID + '> closed successful');
            delete socket.feeds.groupOnDataChange[gID];
        }
    }

    /**
     * Close all the connection that we have for group gID
     *
     * @param socket
     * @param gID
     * @private
     */
    function _deleteSingleGroup(socket, gID) {
        _disconnectSingleGroup(socket, gID);
        const groupForBadgeNotification = socket.feeds.groupForBadgeNotification[gID];
        const groupOnNameChange         = socket.feeds.groupOnNameChange[gID];
        const groupOnDelete             = socket.feeds.groupOnDelete[gID];

        if(groupForBadgeNotification !== undefined){
            groupForBadgeNotification.close();
            debug.correct('Feed on groupForBadgeNotification for <' + gID + '> closed successful');
            delete socket.feeds.groupForBadgeNotification[gID];
        }

        if(groupOnNameChange !== undefined){
            groupOnNameChange.close();
            debug.correct('Feed on groupOnNameChange for <' + gID + '> closed successful');
            delete socket.feeds.groupOnNameChange[gID];
        }

        if(groupOnDelete !== undefined){
            groupOnDelete.close();
            debug.correct('Feed on groupOnDelete for <' + gID + '> closed successful');
            delete socket.feeds.groupOnDelete[gID];
        }
    }

    /**
     * Live feed on group and emit notification if we take new data
     *TODO
     * @param socket
     * @param gID
     * @private
     */
    function _feedGroupForBadgeNotification(socket, gID) {

    }

    /**
     * Live feed on group with id gID for data change
     * And then emit on client the changes
     *
     * @param socket    communication socket between server,client
     * @param gID       group id that we feed
     * @private
     */
    function _feedGroupOnDataChange(socket, gID) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedGroupOnDataChange: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Start live feeding on group for new data
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                debug.status('Start _feedGroupOnDataChange on group <' + gID + '>');
                rethinkdb.table(gID).changes({includeTypes:true})
                    .run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedGroupOnDataChange: something goes wrong with _feedGroupOnDataChange on group <' + gID + '>');
                        }
                        if(socket.feeds.groupOnDataChange[gID] === undefined){
                            socket.feeds.groupOnDataChange[gID] = connection;
                        }
                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.groupOnDataChange[gID];
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.type === 'add'){
                                    debug.status('Broadcast groupDataChange for group <' + gID + '>');
                                    socket.emit('groupDataChange', {
                                        "gID"   : gID,
                                        "data"  : row.new_val.data,
                                        "id"    : row.new_val.id,
                                        "time"  : row.new_val.time,
                                        "type"  : row.new_val.type
                                    });
                                }
                            }
                        });
                });
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on gID for name change
     *
     * @param socket
     * @param gID   groupID
     * @private
     */
    function _feedGroupOnNameChange(socket, gID) {
        const groupID = convertGroupID(gID, '-');
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedGroupOnNameChange: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Start live feeding on group
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                debug.status('Start _feedGroupOnDataChange on  group <' + gID + '>');
                rethinkdb.table('groups').get(groupID).changes().run(connection,function (err, cursor) {
                    if(err){
                        connection.close();
                        return callback(true,'Sync.service@_feedGroupOnDataChange : something goes wrong with changes on group <' + gID + '>');
                    }
                    if(socket.feeds.groupOnNameChange[gID] === undefined){
                        socket.feeds.groupOnNameChange[gID] = connection;
                    }
                    cursor.each(function (err, row) {
                        if(socket.state === 'disconnecting'){
                            delete socket.feeds.groupOnNameChange[gID];
                            connection.close();
                        }
                        if(row !== undefined){
                            if(Object.keys(row).length>0 && row.new_val !== null){
                                debug.status('Broadcast groupNameChange for group <' + gID + '>');
                                socket.emit('groupNameChange',{
                                 id     : gID,
                                 name   : row.new_val.name
                                });
                            }
                        }
                    });
                });
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on user for name change
     *
     * @param socket
     * @param uEmail
     * @private
     */
    function _feedAccountOnNameChange(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedAccountOnNameChange: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Start live feeding on account
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                debug.status('Start _feedAccountOnNameChange on account <' + uEmail + '>');
                rethinkdb.table('accounts').get(uEmail).changes()
                    .filter(
                     rethinkdb.row('old_val')('nickname').ne(rethinkdb.row('new_val')('nickname'))
                    ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnNameChange : something goes wrong with changes on <' + uEmail + '>');
                        }
                        if(socket.feeds.account.name === undefined){
                            socket.feeds.account.name = connection;
                        }
                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.account.name;
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){
                                    debug.status('Broadcast accountNameChange for user <' + uEmail + '>');
                                    socket.emit('accountNameChange',{
                                        email       : uEmail,
                                        nickname    : row.new_val.nickname
                                    });
                                }
                            }
                        });
                });
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on user for password change
     *
     * @param socket
     * @param uEmail
     * @private
     */
    function _feedAccountOnPasswordChange(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedAccountOnPasswordChange: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Start live feeding on account
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                debug.status('Start _feedAccountOnPasswordChange on account <' + uEmail + '>');
                rethinkdb.table('accounts').get(uEmail).changes()
                    .filter(
                        rethinkdb.row('old_val')('password').ne(rethinkdb.row('new_val')('password'))
                    ).run(connection,function (err, cursor) {
                    if(err){
                        connection.close();
                        return callback(true,'Sync.service@_feedAccountOnPasswordChange : something goes wrong with changes on <' + uEmail + '>');
                    }
                    if(socket.feeds.account.password === undefined){
                        socket.feeds.account.password = connection;
                    }
                    cursor.each(function (err, row) {
                        if(socket.state === 'disconnecting'){
                            delete socket.feeds.account.password;
                            connection.close();
                        }
                        if(row !== undefined){
                            if(Object.keys(row).length>0 && row.new_val !== null){
                                debug.status('Broadcast accountPasswordChange for user <' + uEmail + '>');
                                socket.emit('accountPasswordChange');
                            }
                        }
                    });
                });
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on user for group insert
     *
     * @param socket
     * @param uEmail
     * @private
     */
    function _feedAccountOnGroupCreate(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedAccountOnGroupCreate: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Start live feeding on account
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                debug.status('Start _feedAccountOnPasswordChange on account <' + uEmail + '>');
                rethinkdb.table('accounts').get(uEmail).changes()
                    .filter(
                        rethinkdb.row('new_val')('groups').count().gt(rethinkdb.row('old_val')('groups').count())
                    ).run(connection,function (err, cursor) {
                    if(err){
                        connection.close();
                        return callback(true,'Sync.service@_feedAccountOnGroupCreate : something goes wrong with changes on <' + uEmail + '>');
                    }
                    if(socket.feeds.account.insertGroup === undefined){
                        socket.feeds.account.insertGroup = connection;
                    }
                    cursor.each(function (err, row) {
                        if(socket.state === 'disconnecting'){
                            delete socket.feeds.account.insertGroup;
                            connection.close();
                        }
                        if(row !== undefined){
                            if(Object.keys(row).length>0 && row.new_val !== null){
                                debug.status('Broadcast groupCreate for user <' + uEmail + '>');
                                const gID = convertGroupID((row.new_val.groups.diff(row.old_val.groups))[0], '_');
                                socket.emit('groupCreate',{
                                    uEmail  : uEmail,
                                    gID     : gID
                                });
                            }
                        }
                    });
                });
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on user for group delete
     *
     * @param socket
     * @param uEmail
     * @private
     */
    function _feedAccountOnGroupDelete(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedAccountOnGroupDelete: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Start live feeding on account
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                debug.status('Start _feedAccountOnGroupDelete on account <' + uEmail + '>');
                rethinkdb.table('accounts').get(uEmail).changes()
                    .filter(
                        rethinkdb.row('old_val')('groups').count().gt(rethinkdb.row('new_val')('groups').count())
                    ).run(connection,function (err, cursor) {
                    if(err){
                        connection.close();
                        return callback(true,'Sync.service@_feedAccountOnGroupDelete : something goes wrong with changes on <' + uEmail + '>');
                    }
                    if(socket.feeds.account.deleteGroup === undefined){
                        socket.feeds.account.deleteGroup = connection;
                    }
                    cursor.each(function (err, row) {
                        if(socket.state === 'disconnecting'){
                            delete socket.feeds.account.deleteGroup;
                            connection.close();
                        }
                        if(row !== undefined){
                            if(Object.keys(row).length>0 && row.new_val !== null){
                                debug.status('Broadcast groupDelete for user <' + uEmail + '>');
                                const gID = convertGroupID((row.old_val.groups.diff(row.new_val.groups))[0], '_');
                                socket.emit('groupDelete',{
                                    uEmail  : uEmail,
                                    gID     : gID
                                });
                            }
                        }
                    });
                });
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * If the gID contained in the list it's popped else return undefined
     *
     * @param gID
     * @param list
     * @returns {*}
     * @private
     */
    function _tryPop(list, gID) {
        let elem;
        if(list === undefined || list.length === 0){
            elem = undefined;
        }else{
            const index = list.indexOf(gID);
            if (index >= 0) {
                elem = list[index];
                list.splice(index, 1);
            }
        }
        return elem;
    }

    /**
     * If the gID contained in the list we return undefined else we push it
     *
     * @param gID
     * @param list
     * @returns {*}
     * @private
     */
    function _tryPush(list, gID) {
        let elem;
        if(list === undefined){
            elem = undefined;
        }else{
            if(list.length === 0){
                list.push(gID);
                elem = gID;
            }else{
                const index = list.indexOf(gID);
                if (index >= 0) {
                    elem = undefined
                }else{
                    list.push(gID);
                    elem = gID;
                }
            }
        }
        return elem;
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

module.exports = syncService;