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
        connectAll                  : _connectAll,
        disconnectAll               : _disconnectAll,

        connectSingleGroup          : _connectSingleGroup,
        disconnectSingleGroup       : _disconnectSingleGroup,

        deleteSingleGroup           : _deleteSingleGroup,

        groupUpdateLastTimeRead     : _groupUpdateLastTimeRead
    };

    /**
     * Retrieve user details from database and
     * then feed on basic components
     *
     * @param socket    communication socket between server, client
     * @param fingerprint
     * @private
     */
    function _connectAll(socket, fingerprint) {
        if( socket.state !== 'ready' || socket.state !== 'connecting') {
            socket.state = 'connecting';
            debug.status('START SOCKET CONNECTION');
            if (socket.request.cookies['userCredentials'] !== undefined) {
                accountService.info(undefined, socket.request.cookies['userCredentials'], function (err, responseData) {
                    if (!err) {

                        //FEED ON ACCOUNT FOR CHANGES
                        const uEmail = responseData.email;
                        _feedAccountOnNameChange(socket, uEmail);
                        _feedAccountOnAvatarChange(socket, uEmail);
                        _feedAccountOnPasswordChange(socket, uEmail);

                        _feedAccountOnGroupCreate(socket, uEmail);
                        _feedAccountOnGroupDelete(socket, uEmail);

                        _feedAccountOnParticipateAdd(socket, uEmail);
                        _feedAccountOnParticipateRemove(socket, uEmail);

                        if(responseData.openedGroupsList.length>0){
                            _groupUpdateLastTimeRead(socket, responseData.openedGroupsList[0], Date.now());
                        }

                        //FEED ON ALL groupsList for badge notification,name change and delete perform
                        //FEED ON ALL openedGroup for data
                        const groupsList = responseData.groupsList.concat(responseData.participateGroupsList);
                        const openedList = responseData.openedGroupsList;
                        while (groupsList.length > 0) {
                            const gID = groupsList.pop();
                            if (_tryPop(openedList, gID) !== undefined) {
                                _feedGroupOnDataChange(socket, gID);
                            }
                            _groupUpdateLastTimeRead(socket, gID, undefined);

                            _feedGroupOnNameChange(socket, gID);
                            _feedGroupForBadgeNotification(socket, gID);
                        }

                        socket.state = 'ready';
                        debug.status('SOCKET CONNECTION ESTABLISHED');
                    }
                });
            }
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
     *
     * @param socket
     * @param gID
     * @private
     */
    function _feedGroupForBadgeNotification(socket, gID) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedGroupForBadgeNotification: cant connect on database');
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
                debug.status('Start _feedGroupForBadgeNotification on group <' + gID + '>');
                rethinkdb.table(gID).changes({includeTypes:true}).pluck('type')
                    .run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedGroupForBadgeNotification: something goes wrong with _feedGroupOnDataChange on group <' + gID + '>');
                        }
                        if(socket.feeds.groupForBadgeNotification[gID] === undefined){
                            socket.feeds.groupForBadgeNotification[gID] = connection;
                            cursor.each(function (err, row) {
                                if(socket.state === 'disconnecting'){
                                    delete socket.feeds.groupForBadgeNotification[gID];
                                    connection.close();
                                }
                                if(row !== undefined){
                                    if(Object.keys(row).length>0 && row.type === 'add'){
                                        debug.status('Broadcast groupDataBadge for group <' + gID + '>');
                                        socket.emit('groupDataBadge', {
                                            "gID": gID,
                                        });
                                    }
                                }
                            });
                        }else{
                            connection.close();
                        }
                    });
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
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
                if (socket.feeds.groupOnDataChange[gID] === undefined) {
                    socket.feeds.groupOnDataChange[gID] = connection;
                    rethinkdb.table(gID).changes({includeTypes:true})
                        .pluck({'old_val' :['id']},'new_val', 'type')
                        .without({'new_val':['file', 'password']})
                        .run(connection,function (err, cursor) {
                            if (err) {
                                connection.close();
                                return callback(true, 'Sync.service@_feedGroupOnDataChange: something goes wrong with _feedGroupOnDataChange on group <' + gID + '>');
                            }
                            cursor.each(function (err, row) {
                                if (socket.state === 'disconnecting') {
                                    delete socket.feeds.groupOnDataChange[gID];
                                    connection.close();
                                }
                                if (row !== undefined) {
                                    if (Object.keys(row).length > 0 && row.type === 'add') {
                                        debug.status('Broadcast groupDataChange (add) for group <' + gID + '>');
                                        socket.emit('groupDataAdd', {
                                            "gID": gID,
                                            "value": {
                                                "data"  : row.new_val.data,
                                                "id"    : row.new_val.id,
                                                "time"  : row.new_val.time,
                                                "type"  : row.new_val.type,
                                                "user"  : row.new_val.user
                                            }
                                        });
                                    } else if (Object.keys(row).length > 0 && row.type === 'remove') {
                                        debug.status('Broadcast groupDataChange (remove) for group <' + gID + '>');
                                        socket.emit('groupDataRemove', {
                                            "gID": gID,
                                            "value": row.old_val.id
                                        });
                                    }else if(Object.keys(row).length > 0 && row.type === 'change'){
                                        debug.status('Broadcast groupDataModify (change) for group <' + gID + '>');
                                        socket.emit('groupDataModify', {
                                            "gID": gID,
                                            "value": {
                                                "data"  : row.new_val.data,
                                                "mID"   : row.new_val.id,
                                                "modify": row.new_val.modify
                                            }
                                        });
                                    }
                                }
                            });
                        });
                }else{
                    connection.close();
                }
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
                debug.status('Start _feedGroupOnNameChange on  group <' + gID + '>');

                if(socket.feeds.groupOnNameChange[gID] === undefined){
                    socket.feeds.groupOnNameChange[gID] = connection;

                    rethinkdb.table('groups').get(groupID).changes()
                        .pluck({'new_val' : ['name'], 'old_val' :['name']})
                        .filter(
                            rethinkdb.row('old_val')('name').ne(rethinkdb.row('new_val')('name')
                            )
                    ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedGroupOnNameChange : something goes wrong with changes on group <' + gID + '>');
                        }
                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.groupOnNameChange[gID];
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val.name !== null){
                                    debug.status('Broadcast groupNameChange for group <' + gID + '>');
                                    socket.emit('groupNameChange',{
                                        "gID"     : gID,
                                        "gName"   : row.new_val.name
                                    });
                                }
                            }
                        });
                    });
                }else{
                    connection.close();
                }
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

                if(socket.feeds.account.name === undefined){
                    socket.feeds.account.name = connection;

                    rethinkdb.table('accounts').get(uEmail).changes()
                        .pluck({'new_val' : ['nickname'], 'old_val' :['nickname']})
                        .filter(
                            rethinkdb.row('old_val')('nickname').ne(rethinkdb.row('new_val')('nickname'))
                        ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnNameChange : something goes wrong with changes on <' + uEmail + '>');
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
                                        "uEmail"       : uEmail,
                                        "uNickname"    : row.new_val.nickname
                                    });
                                }
                            }
                        });
                    });

                }else{
                    connection.close();
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on user for avatar change
     *
     * @param socket
     * @param uEmail
     * @private
     */
    function _feedAccountOnAvatarChange(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedAccountOnAvatarChange: cant connect on database');
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
                debug.status('Start _feedAccountOnAvatarChange on account <' + uEmail + '>');

                if(socket.feeds.account.avatar === undefined){
                    socket.feeds.account.avatar = connection;

                    rethinkdb.table('accounts').get(uEmail).changes()
                        .pluck({'new_val' : ['avatar'], 'old_val' :['avatar']})
                        .filter(
                            rethinkdb.row('old_val')('avatar').ne(rethinkdb.row('new_val')('avatar'))
                        ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnAvatarChange : something goes wrong with changes on <' + uEmail + '>');
                        }
                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.account.avatar;
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){
                                    debug.status('Broadcast accountAvatarChange for user <' + uEmail + '>');
                                    socket.emit('accountAvatarChange',{
                                        "uEmail"    : uEmail,
                                        "avatar"    : row.new_val.avatar
                                    });
                                }
                            }
                        });
                    });

                }else{
                    connection.close();
                }
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
                if(socket.feeds.account.password === undefined){
                    socket.feeds.account.password = connection;

                    rethinkdb.table('accounts').get(uEmail).changes()
                        .pluck({'new_val' : ['password'], 'old_val' :['password']})
                        .filter(
                            rethinkdb.row('old_val')('password').ne(rethinkdb.row('new_val')('password'))
                        ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnPasswordChange : something goes wrong with changes on <' + uEmail + '>');
                        }
                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.account.password;
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){
                                    debug.status('Broadcast accountPasswordChange for user <' + uEmail + '>');
                                    socket.emit('accountPasswordChange',{
                                        "uPassword" : row.new_val.password
                                    });
                                }
                            }
                        });
                    });

                }else{
                    connection.close();
                }
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
                debug.status('Start _feedAccountOnGroupCreate on account <' + uEmail + '>');
                if(socket.feeds.account.insertGroup === undefined){
                    socket.feeds.account.insertGroup = connection;

                    rethinkdb.table('accounts').get(uEmail).changes()
                        .pluck({'new_val' : ['groups'], 'old_val' :['groups']})
                        .filter(
                            rethinkdb.row('new_val')('groups').count().gt(rethinkdb.row('old_val')('groups').count())
                        ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnGroupCreate : something goes wrong with changes on <' + uEmail + '>');
                        }
                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.account.insertGroup;
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){
                                    const gID   = (row.new_val.groups.diff(row.old_val.groups))[0];
                                    rethinkdb.table('groups').get(convertGroupID(gID, '-'))
                                        .run(connection, function (err, result) {
                                            if(err){
                                                debug.error('Sync.service@_feedAccountOnGroupCreate: error happen while retrieve name for group: ' + gID);
                                            }else{
                                                _groupUpdateLastTimeRead(socket, gID, undefined);
                                                _feedGroupOnNameChange(socket, gID);
                                                _feedGroupForBadgeNotification(socket, gID);
                                                debug.status('Broadcast groupCreate for user <' + uEmail + '>');
                                                socket.emit('groupCreate',{
                                                    "uEmail"    : uEmail,
                                                    "gID"       : gID,
                                                    "gName"     : result.name
                                                });
                                            }
                                        });
                                }
                            }
                        });
                    });

                }else{
                    connection.close();
                }
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

                if(socket.feeds.account.deleteGroup === undefined){
                    socket.feeds.account.deleteGroup = connection;


                    rethinkdb.table('accounts').get(uEmail).changes()
                        .pluck({'new_val' : ['groups'], 'old_val' :['groups']})
                        .filter(
                            rethinkdb.row('old_val')('groups').count().gt(rethinkdb.row('new_val')('groups').count())
                        ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnGroupDelete : something goes wrong with changes on <' + uEmail + '>');
                        }

                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.account.deleteGroup;
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){

                                    const gID   = (row.old_val.groups.diff(row.new_val.groups))[0];
                                    rethinkdb.table('groups').get(convertGroupID(gID, '-')).pluck('name')
                                        .run(connection, function (err, result) {
                                            if(err){
                                                debug.error('Sync.service@_feedAccountOnGroupDelete: error happen while retrieve name for group: ' + gID);
                                            }else{
                                                debug.status('Broadcast groupDelete for user <' + uEmail + '>');
                                                socket.emit('groupDelete',{
                                                    "uEmail"    : uEmail,
                                                    "gID"       : gID,
                                                    "gName"     : result.name
                                                });
                                            }
                                        });
                                }
                            }
                        });
                    });

                }else{
                    connection.close();
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on user for new group participate
     *
     * @param socket
     * @param uEmail
     * @private
     */
    function _feedAccountOnParticipateAdd(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedAccountOnParticipateAdd: cant connect on database');
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
                debug.status('Start _feedAccountOnParticipateAdd on account <' + uEmail + '>');
                if(socket.feeds.account.addParticipate === undefined){
                    socket.feeds.account.addParticipate = connection;


                    rethinkdb.table('accounts').get(uEmail).changes()
                        .pluck({'new_val' : ['participateGroups'], 'old_val' :['participateGroups']})
                        .filter(
                            rethinkdb.row('new_val')('participateGroups').count().gt(rethinkdb.row('old_val')('participateGroups').count())
                        ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnParticipateAdd : something goes wrong with changes on <' + uEmail + '>');
                        }

                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.account.addParticipate;
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){

                                    const gID   = (row.new_val.participateGroups.diff(row.old_val.participateGroups))[0];
                                    rethinkdb.table('groups').get(convertGroupID(gID, '-')).pluck('name')
                                        .run(connection, function (err, result) {
                                            if(err){
                                                debug.error('Sync.service@_feedAccountOnParticipateAdd: error happen while retrieve name for group: ' + gID);
                                            }else{
                                                _groupUpdateLastTimeRead(socket, gID, undefined);
                                                _feedGroupOnNameChange(socket, gID);
                                                _feedGroupForBadgeNotification(socket, gID);
                                                debug.status('Broadcast participateAdd for user <' + uEmail + '>');
                                                socket.emit('participateAdd',{
                                                    "uEmail"    : uEmail,
                                                    "gID"       : gID,
                                                    "gName"     : result.name
                                                });
                                            }
                                        });
                                }
                            }
                        });
                    });
                }else{
                    connection.close();
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Live feed on user for removed from a participating group
     *
     * @param socket
     * @param uEmail
     * @private
     */
    function _feedAccountOnParticipateRemove(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_feedAccountOnParticipateRemove: cant connect on database');
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
                debug.status('Start _feedAccountOnParticipateRemove on account <' + uEmail + '>');

                if(socket.feeds.account.removeParticipate === undefined){
                    socket.feeds.account.removeParticipate = connection;


                    rethinkdb.table('accounts').get(uEmail).changes()
                        .pluck({'new_val' : ['participateGroups'], 'old_val' :['participateGroups']})
                        .filter(
                            rethinkdb.row('old_val')('participateGroups').count().gt(rethinkdb.row('new_val')('participateGroups').count())
                        ).run(connection,function (err, cursor) {
                        if(err){
                            connection.close();
                            return callback(true,'Sync.service@_feedAccountOnParticipateRemove : something goes wrong with changes on <' + uEmail + '>');
                        }

                        cursor.each(function (err, row) {
                            if(socket.state === 'disconnecting'){
                                delete socket.feeds.account.removeParticipate;
                                connection.close();
                            }
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){
                                    const gID   = (row.old_val.participateGroups.diff(row.new_val.participateGroups))[0];
                                    rethinkdb.table('groups').get(convertGroupID(gID, '-')).pluck('name')
                                        .run(connection, function (err, result) {
                                            if(err){
                                                debug.error('Sync.service@_feedAccountOnParticipateRemove: error happen while retrieve name for group: ' + gID);
                                            }else{
                                                _groupDeleteLastTimeRead(socket, gID);
                                                debug.status('Broadcast participateRemove for user <' + uEmail + '>');
                                                socket.emit('participateRemove',{
                                                    "uEmail"    : uEmail,
                                                    "gID"       : gID,
                                                    "gName"     : result.name
                                                });
                                            }
                                        });
                                }
                            }
                        });
                    });

                }else{
                    connection.close();
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Check if timestamp for user on gID exists
     *
     * @param socket
     * @param timestamp if undefined then we retrieve the group create time otherwise we use it
     * @param gID
     * @private
     */
    function _groupUpdateLastTimeRead(socket, gID, timestamp) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_checkGroupLastView: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Retrieve default timestamp from the group
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                if(timestamp === undefined){
                    rethinkdb.table(gID).get('created').pluck('time')
                        .run(connection,function (err,results) {
                            if(err){
                                connection.close();
                                debug.error('Group.service@_checkGroupLastView: cant retrieve group <' + gID + '> timestamp');
                                return callback(true, 'Error happens while getting group timestamp');
                            }
                            timestamp = results.time;
                            callback(null, connection);
                        });
                }else{
                    callback(null, connection);
                }
            },
            /**
             * Checking if exist lastTimeRead depends on user fingerprint
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(gID, '-')).update(
                    function (group) {
                        return rethinkdb.branch(
                            group('lastTimeRead').contains(socket.account.fingerprint).eq(false),
                            {
                                lastTimeRead : group('lastTimeRead').append(socket.account.fingerprint).append(timestamp)
                            },
                            group('lastTimeRead')((group('lastTimeRead').offsetsOf(socket.account.fingerprint)(0)).add(1)).lt(timestamp),
                            {
                                lastTimeRead : group('lastTimeRead').changeAt((group('lastTimeRead').offsetsOf(socket.account.fingerprint)(0)).add(1),timestamp)
                            },
                            {}
                        )
                    }
                ).run(connection, function (err, results) {
                    connection.close();
                    if(err){
                        debug.error('Group.service@_checkGroupLastView: can\'t update group <' + gID + '> timestamp');
                        return callback(true, 'Error happens while updating group timestamp');
                    }
                })
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Delete lastRead for gID
     *
     * @param socket
     * @param gID
     * @private
     */
    function _groupDeleteLastTimeRead(socket, gID) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@_groupDeleteLastTimeRead: cant connect on database');
                    }
                    callback(null, connection);
                });
            },
            /**
             * Delete lastTimeRead
             *
             * @param connection
             * @param callback
             */
            function (connection, callback) {
                rethinkdb.table('groups').get(convertGroupID(gID, '-')).update(
                    function (group) {
                        return rethinkdb.branch(
                            group('lastTimeRead').contains(socket.account.fingerprint),
                            {
                                lastTimeRead : group('lastTimeRead').deleteAt(
                                    (group('lastTimeRead').offsetsOf(socket.account.fingerprint)(0)),
                                    (group('lastTimeRead').offsetsOf(socket.account.fingerprint)(0)).add(2)
                                )
                            },
                            {}
                        )
                    }
                ).run(connection, function (err, results) {
                    connection.close();
                    if(err){
                        debug.error('Group.service@_groupDeleteLastTimeRead: can\'t update group <' + gID + '> timestamp');
                        return callback(true, 'Error happens while updating group timestamp');
                    }
                })
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