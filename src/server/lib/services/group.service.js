'use strict';
var rethinkdb = require('rethinkdb');
var async = require('async');
var db = require('./database.service');

const r_clr = '\x1b[41m'; //red bg color
const g_clr = '\x1b[42m'; //green bg color
const b_clr = '\x1b[44m'; //blue bg color
const w_clr = '\x1b[0m'; //white bg color

var debugError = require('debug')(r_clr + 'pushup: server' + w_clr);
var debugCorrect = require('debug')(g_clr + 'pushup: server' + w_clr);
var debugStatus = require('debug')(b_clr + 'pushup: server' + w_clr);

class GroupService {
    //TODO na ginei kati san transcation
    //Otan ginetai kapoio fail na diagrafei ola ta tables
    create(details, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debugError('Group.service@create: can\'t connect to database');
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
                        debugError('Group.service@create: can\'t insert <' + details.gName + '> on table \'groups\'');
                        return callback(true, 'Error happens while adding new group');
                    }

                    debugStatus('New group <' + details.gName + '> added successful');

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
                            debugError('Group.service@create: cant create new table <' + responseData.gID + '>');
                            return callback(true, 'Error happens while creating table \'' + responseData.gID +'\'');
                        }

                        debugStatus('Created new table <' + responseData.gID + '> with primary key \'id\' ');

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
                            debugError('Group.service@create: cant retrieve groups for user <' + details.uEmail + '>');
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
                rethinkdb.table('accounts').get(details.gEmail).update({
                    groups: newGroup
                }).run(connection, function (err, result) {
                    if (err) {
                        debugError('Group.service@create: cant update user <' + details.gEmail + '> groups');
                        return callback(true, 'Error happens while update user groups');
                    }

                    debugStatus('New group <' + details.gName + '> inserted on user <' + details.gEmail + '> groups successful');

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
                    data        : 'Group created by ' + details.gEmail,
                    type        : 'text',
                    connected   : false,
                    time        : Date.now()
                }).run(connection,function (err,result) {
                    if (err) {
                        debugError('Group.service@create: cant insert socket on group <' + responseData.gID + '>');
                        return callback(true, 'Error happens while adding socket on group');
                    }

                    debugStatus('Add socket on group <' + responseData.gID + '>');

                    callback(null, connection, responseData);
                });
            },
            /**
             * Stage 5
             * get the data from table
             */
            function(connection, responseData, callback) {
                rethinkdb.table(responseData.gID).orderBy("time")
                    .run(connection,function (err,cursor) {
                        if(err){
                            debugError('Group.service@create: cant get data from group <' + responseData.gID + '>');
                            return callback(true, 'Error happens while getting user details');
                        }
                        cursor.toArray(function(err, results) {
                            if (err){
                                debugError('Group.service@create: cant convert cursor from group <' + responseData.gID + '> to array');
                                return callback(true, 'Error happens while converting data to array');
                            }
                            responseData.data = results;

                            debugCorrect('New group <' + responseData.gID + '> added successful on user <' + details.uEmail + '>');

                            callback(null,connection,responseData);
                        });
                    });
            }
        ], function (err,connection, data) {
            connection.close();
            callback(err !== null, data);
        });
    }

    retrieve(gID, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debugError('Group.service@retrieve: cant connect on database');
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
                            debugError('Group.service@retrieve: cant retrieve group <' + gID + '> data');
                            return callback(true, 'Error happens while getting group data');
                        }
                        cursor.toArray(function(err, results) {
                            if (err){
                                debugError('Group.service@retrieve: cant convert group <' + gID + '> data to array');
                                return callback(true, 'Error happens while converting data to array');
                            }
                            debugCorrect('Retrieve data from group <' + gID + '> successful');
                            callback(null,{id : gID, value: results});
                        });
                    });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    add(details, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debugError('Group.service@add: cant connect on database');
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
                        debugError('Group.service@add: cant insert new data on group <' + details.gID + '>');
                        return callback(true, 'Error happens while adding new data');
                    }
                    debugCorrect('New data added on group <' + details.gID + '> successful');
                    callback(null, result);
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }
}

module.exports = GroupService;