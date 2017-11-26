'use strict';

const rethinkdb = require('rethinkdb');
const async     = require('async');
const db        = require('./database.service');
const debug     = require('./debug.service');

const groupSevice = function () {
    return {
        create      : _create,
        retrieve    : _retrieve,
        add         : _add
    };

    //TODO na ginei kati san transcation
    //Otan ginetai kapoio fail na diagrafei ola ta tables
    function _create(details, callback) {
        async.waterfall([
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
             * Stage 1
             * Add new tuple on groups and get the id that assigned to that tuple
             */
            function (connection, callback) {
                var responseData = {
                    gName: '',
                    gID: ''
                };

                rethinkdb.table('groups').insert({
                    'name': details.gName,
                    'user': details.uEmail
                }).run(connection, function (err, result) {
                    if (err) {
                        debug.error('Group.service@create: can\'t insert <' + details.gName + '> on table \'groups\'');
                        return callback(true, 'Error happens while adding new group');
                    }

                    debug.status('New group <' + details.gName + '> added successful');

                    var tmpID = result.generated_keys[0];
                    responseData.gID = tmpID.replace(/-/g, '_');
                    responseData.gName = details.gName;
                    callback(null,responseData, connection);
                });
            },
            /**
             * Stage 2
             * Add a table with generated ID from previous query (replace {-} with {_}
             */
            function(responseData, connection, callback) {
                rethinkdb.tableCreate(responseData.gID)
                    .run(connection, function (err, result) {
                        if (err) {
                            debug.error('Group.service@create: cant create new table <' + responseData.gID + '>');
                            return callback(true, 'Error happens while creating table \'' + responseData.gID +'\'');
                        }

                        debug.status('Created new table <' + responseData.gID + '> with primary key \'id\' ');

                        callback(null, responseData, connection);
                    });
            },
            /**
             * Stage 3.1
             * Retrieve groups depends on id
             */
            function(responseData, connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).getField('groups')
                    .run(connection,function (err,result) {
                        if (err) {
                            debug.error('Group.service@create: cant retrieve groups for user <' + details.uEmail + '>');
                            return callback(true, 'Error happens while retrieving user group');
                        }

                        result[responseData.gID] = {id : responseData.gID, name : details.gName};

                        callback(null,result, responseData, connection);
                    });
            },
            /**
             * Stage 3.2
             * Assign that id on user groups
             */
            function(newGroup, responseData, connection, callback) {
                rethinkdb.table('accounts').get(details.uEmail).update({
                    groups: newGroup
                }).run(connection, function (err, result) {
                    if (err) {
                        debug.error('Group.service@create: cant update user <' + details.uEmail + '> groups');
                        return callback(true, 'Error happens while update user groups');
                    }

                    debug.status('New group <' + details.gName + '> inserted on user <' + details.uEmail + '> groups successful');

                    callback(null,responseData,connection);
                });
            },
            /**
             * Stage 4
             * Add on group field with id socket and connected : false
             */
            function (responseData, connection, callback) {
                rethinkdb.table(responseData.gID).insert({
                    id          : 'socket',
                    data        : 'Group created by ' + details.uEmail,
                    type        : 'text',
                    lastLogin   : Date.now(),
                    time        : Date.now()
                }).run(connection,function (err,result) {
                    if (err) {
                        debug.error('Group.service@create: cant insert socket on group <' + responseData.gID + '>');
                        return callback(true, 'Error happens while adding socket on group');
                    }

                    debug.status('Add socket on group <' + responseData.gID + '>');
                    debug.correct('New group <' + responseData.gID + '> added successful on user <' + details.uEmail + '>');

                    callback(null, connection, responseData);
                });
            }
        ], function (err,connection, data) {
            connection.close();
            callback(err !== null, data);
        });
    }

    function _retrieve(gID, callback) {
        async.waterfall([
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@retrieve: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            function(connection,callback) {
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

    function _add(details, callback) {
        async.waterfall([
            function (callback) {
                db.connectToDb(function(err,connection) {
                    if(err){
                        debug.error('Group.service@add: cant connect on database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
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

}();

module.exports = groupSevice;