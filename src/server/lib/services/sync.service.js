'use strict';

const rethinkdb         = require('rethinkdb');
const async             = require('async');

const db                = require('./database.service');
const debug             = require('./debug.service');
const accountService    = require('./account.service');

/**
 * API for sync data between devices
 * @returns {{feedGroupData: _feedGroupData, disconnect: _disconnect}}
 */
const syncService = function () {

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    return{
        feedGroupData   : _feedGroupData,
        feedGroupName   : _feedGroupName,
        connect         : _connect,
        disconnect      : _disconnect,
        disconnectGroup : _disconnectGroup
    };

    /**
     * Live feed changes on table and emit it on user
     * @param socket    communication socket between server,client
     * @param gID       group id that we feed
     * @private
     */
    function _feedGroupData(socket, gID) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@feed: cant connect on database');
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
                if(tryPush(gID, connection, socket, 'groupData')){
                    debug.status('Start feeding on group <' + gID + '>');
                    rethinkdb.table(gID).changes().run(connection,function (err, cursor) {
                        if(err){
                            delete socket.feeds['groupData'][gID];
                            connection.close();
                            return callback(true,'Sync.service@feed: something goes wrong with changes on group <' + gID + '>');
                        }
                        cursor.each(function (err, row) {
                            if(row !== undefined){
                                if(Object.keys(row).length>0){
                                    debug.status('Broadcast new data for group <' + gID + '>');
                                    socket.emit(gID, {
                                        "data"  : row.new_val.data,
                                        "id"    : row.new_val.id,
                                        "time"  : row.new_val.time,
                                        "type"  : row.new_val.type
                                    });
                                }
                            }
                        });
                    });
                }else{
                    connection.close();
                    callback(null,'');
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Retrieve data from database and start feeding
     * @param socket
     * @private
     */
    function _connect(socket) {
        if(socket.request.cookies['userCredentials'] !== undefined){
            accountService.info(undefined, socket.request.cookies['userCredentials'], function (err,responseData) {
                if(!err){
                    socket.feeds = { };
                    const uEmail = responseData.email;
                    _feedAccountsGroups(socket, uEmail);
                    const groupsList = responseData.groupsList;
                    while (groupsList.length > 0){
                        const gID = groupsList.pop();
                        _feedGroupData(socket, gID);
                        _feedGroupName(socket, gID);
                    }
                }
            });
        }
    }

    /**
     * If user disconnect or logout we must stop live feed
     * @param socket
     * @private
     */
    function _disconnect(socket) {
        if(socket.feeds !== undefined){
            for(const target in socket.feeds){
                if(socket.feeds[target] !== undefined){
                    for(const id in socket.feeds[target]){
                        socket.feeds[target][id].close();
                        debug.correct('Feed on <' + id + '> closed successful');
                        delete socket.feeds[target][id];
                    }
                }
            }
        }
    }

    /**
     * After a group deleted we must close all the sockets of group
     * @param socket
     * @param gID
     * @private
     */
    function _disconnectGroup(socket, gID) {
        if(socket.feeds !== undefined){
            if(socket.feeds['groupData'] !== undefined && socket.feeds['groupData'][gID] !== undefined){
                socket.feeds['groupData'][gID].close();
                delete socket.feeds['groupData'][gID];
                debug.correct('Feed on <' + gID + '> closed successful');
            }
            gID = convertGroupID(gID,'-');
            if(socket.feeds['groupName'] !== undefined && socket.feeds['groupName'][gID] !== undefined){
                socket.feeds['groupName'][gID].close();
                delete socket.feeds['groupName'][gID];
                debug.correct('Feed on <' + gID + '> closed successful');
            }
        }
    }

    function _feedAccountsGroups(socket, uEmail) {
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@feedAccountsGroups: cant connect on database');
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
                if(tryPush(uEmail, connection, socket, 'accountsGroups')){
                    debug.status('Start feeding on user <' + uEmail + '>');
                    rethinkdb.table('accounts').get(uEmail).changes().run(connection,function (err, cursor) {
                        if(err){
                            delete socket.feeds['accountsGroups'][uEmail];
                            connection.close();
                            return callback(true,'Sync.service@feedAccountsGroups: ' +
                                'something goes wrong with changes on user <' + uEmail + '>');
                        }
                        cursor.each(function (err, row) {
                            if(row !== undefined){
                                if(Object.keys(row).length>0){
                                    const oldGroupsList = row.old_val.groups;
                                    const newGroupsList = row.new_val.groups;
                                    let action,gID;
                                    if(oldGroupsList.length > newGroupsList.length){
                                        action = 'deleteGroup' ;
                                        gID = row.old_val.groups.diff(row.new_val.groups);
                                    }else{
                                        action = 'createGroup';
                                        gID = row.new_val.groups.diff(row.old_val.groups);
                                    }

                                    debug.status('Broadcast ' + action +' for user <' + uEmail + '>');
                                    socket.emit(uEmail, {
                                        "action"    : action,
                                        "gID"       : convertGroupID(gID[0], '_')
                                    });
                                }
                            }
                        });
                    });
                }else{
                    connection.close();
                    callback(null,'');
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * Feed on gID for name change
     * @param socket
     * @param gID   groupID
     * @private
     */
    function _feedGroupName(socket, gID) {
        gID = convertGroupID(gID, '-');
        async.waterfall([
            /**
             * Connect on database
             * @param callback
             */
            function (callback) {
                db.connectToDb(function (err, connection) {
                    if (err){
                        return callback(true, 'Sync.service@feedGroupName: cant connect on database');
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
                if(tryPush(gID, connection, socket, 'groupName')){
                    debug.status('Start feeding on group <' + gID + '>');
                    rethinkdb.table('groups').get(gID).changes().run(connection,function (err, cursor) {
                        if(err){
                            delete socket.feeds['groupName'][gID];
                            connection.close();
                            return callback(true,'Sync.service@feedGroupName: something goes wrong with changes on group <' + gID + '>');
                        }
                        cursor.each(function (err, row) {
                            if(row !== undefined){
                                if(Object.keys(row).length>0 && row.new_val !== null){
                                    debug.status('Broadcast new name for group <' + gID + '>');
                                    socket.emit(gID, row.new_val.name);
                                }
                            }
                        });
                    });
                }else{
                    connection.close();
                    callback(null,'');
                }
            }
        ], function (err, msg) {
            if(err){
                debug.error(msg);
            }
        });
    }

    /**
     * If gID do not exists on list push them else return false
     * @param id           the id of table
     * @param connection
     * @param socket
     * @param target            where we will add the data
     * @returns {boolean}
     * @private
     */
    function tryPush(id, connection, socket, target) {
        if(socket.feeds[target] === undefined){
            socket.feeds[target] = { };
        }
        let status = false;

        if(socket.feeds[target][id] === undefined){
            status = true;
            socket.feeds[target][id] = connection;
        }

        return status;
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

module.exports = syncService;