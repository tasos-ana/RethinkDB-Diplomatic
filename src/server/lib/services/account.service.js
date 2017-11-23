'use strict';

var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var async = require('async');
var debug = require('debug')('pushup-refactoring:server');

class AccountService {

    create(details, callback) {
        async.waterfall([
            function (callback) {
                new db().connectToDb(function(err,connection) {
                    if(err){
                        debug('Error at \'account.service:create\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null,connection);
                });
            },
            function(connection,callback) {
                rethinkdb.table('accounts').insert({
                    'nickname'  : details.nickname,
                    'email'     : details.email,
                    'password'  : details.password,
                    'groups'    : {}
                }).run(connection,function(err,result){
                    connection.close();
                    if(err){
                        debug('Error at \'account.service:create\': while creating new account email{' + details.email + '}');
                        return callback(true, 'Error happens while creating new account');
                    }
                    debug('Add user: ' + details.email);
                    callback(null, result);
                });
            }
        ],function (err,data) {
            callback(err !== null, data);
        });
    }

    logout(email, callback){
        var self = this;
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'account.service:logout\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(email).getField('groups')
                    .run(connection,function (err,groups) {
                        if(err){
                            debug('Error at \'account.service:logout\': cant get user with email \'' + email +'\'');
                            return callback(true, 'Error happens while getting user details');
                        }
                        for(var i=0; i<groups.length; ++i){
                            self.disableSocket(groups[i].id,function (err,responde) {
                                
                            });
                        }
                        callback(null,'Logged out');
                        connection.close();
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    disableSocket(table, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,conn) {
                    if(err){
                       // debug('Error at \'account.service:logout\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, conn);
                });
            },
            function (conn, callback) {
                rethinkdb.table(table).get('socket').update({connected:false})
                    .run(conn,function (err,results) {
                        conn.close();
                        if(err){
                            //debug('Error at \'account.service:logout\': on updating socket flag');
                            return callback(true, 'Error on updating socket flag');
                        }
                        callback(null,'Socket set connected to false');
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    getAccount(details, callback) {
        var self = this;
        var user = {
            email       : '',
            nickname    : '',
            groups      : {}
        };
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'account.service:authenticate\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(details.email)
                    .run(connection,function (err,result) {
                        if(err){
                            debug('Error at \'account.service:authenticate\': cant get user with email \'' + details.email +'\'');
                            return callback(true, 'Error happens while getting user details',connection);
                        }
                        if(details.password!==null){
                            if(result === null || result.password !== details.password){
                                return callback(true, 'Email or password its wrong', connection);
                            }
                        }
                        if(result === null){
                            return callback(true, 'User not found', connection);
                        }
                        callback(null, {
                            email: result.email,
                            nickname : result.nickname,
                            groups : result.groups},
                            connection);
                        //else{
                            // user.email = details.email;
                            // user.nickname = result.nickname;
                            //
                            // const remainingGroups = result.groups;
                            // if(remainingGroups.length === 0){
                            //     callback(null,user,connection);
                            // }else {
                            //     for (var i = 0; i < remainingGroups.length; ++i) {
                            //         user.groups[remainingGroups[i].id] = {
                            //             id      : remainingGroups[i].id,
                            //             name    : remainingGroups[i].name,
                            //             data    : []
                            //         };
                            //         self.getTable(remainingGroups[i], function (err, result) {
                            //             if (err) {
                            //                 debug('Error happens while retrieving data from groups');
                            //                 return callback(true, 'Error happens while retrieving data from groups', connection)
                            //             }
                            //             //TODO isws prepei na ginetai lock sto IF
                            //             user.groups[result.index].data = result.data;
                            //             var len = Object.keys(user.groups).length;
                            //             if (len === remainingGroups.length) {
                            //                 try {
                            //                     callback(null, user, connection);
                            //                 }catch (err){
                            //
                            //                 }
                            //             }
                            //         });
                            //     }
                            // }
                        //}
                    });
            }
        ], function (err,data,connection) {
            connection.close();
            callback(err !== null, data);
        });
    }

    getTable(group, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'account.service:existsEmail\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function(connection,callback) {
                rethinkdb.table(group.id).orderBy("time")
                    .run(connection,function (err,cursor) {
                        connection.close();
                        if(err){
                            debug('Error at \'account.service:getTable\': cant get data from table \'' + group.id +'\'');
                            return callback(true, 'Error happens while getting user details');
                        }
                        cursor.toArray(function(err, results) {
                            if (err){
                                debug('Error at \'account.service:getTable\': cant convert data to array');
                                return callback(true, 'Error happens while converting data to array');
                            }
                            callback(null,{ index: group.id, data: results});
                        });
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    getAccount2(email, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'account.service:existsEmail\': connecting to database');
                        return callback(true, 'Error connecting to database');
                    }
                    callback(null, connection);
                });
            },
            function (connection, callback) {
                rethinkdb.table('accounts').get(email)
                    .run(connection,function (err,result) {
                        connection.close();
                        if(err){
                            debug('Error at \'account.service:existsEmail\': cant get user with email \'' + details.email +'\'');
                            return callback(true, 'Error happens while getting user details');
                        }
                        if(result === null){
                            return callback(true,'Email do not exists');
                        }
                        callback(null,{"email": result.email, "nickname":result.nickname, "groups":result.groups});
                    });
            }
        ], function (err,data) {
            callback(err !== null, data);
        });
    }

    //TODO na ginei kati san transcation
    //Otan ginetai kapoio fail na diagrafei ola ta tables
    addGroup(details, callback){
        async.waterfall([
            function (callback) {
                new db().connectToDb(function (err,connection) {
                    if(err){
                        debug('Error at \'account.service:addGroup\': connecting to database');
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
                var data2return = {
                    name: '',
                    id: ''
                };

                rethinkdb.table('groups').insert({
                    'name': details.group,
                    'user': details.user
                }).run(connection, function (err, result) {
                    if (err) {
                        debug('Error at \'account.service:addGroup\': while adding new group{' + details.group + '}');
                        return callback(true, 'Error happens while adding new group');
                    }
                    debug('Add new group: ' + details.group);
                    var tmpID = result.generated_keys[0];
                    data2return.id = tmpID.replace(/-/g, '_');
                    data2return.name = details.group;
                    callback(null,data2return, connection);
                });
            },
            /**
             * Stage 2
             * Add a table with generated ID from previous query (replace {-} with {_}
             */
            function(data, connection, callback) {
                rethinkdb.tableCreate(data.id)
                    .run(connection, function (err, result) {
                        if (err) {
                            debug("table with name '" + data.id + "' already created");
                            return callback(true, 'Error happens while creating table \'' + data.id +'\'');
                        }
                        debug("Created new table '" + data.id + "' with primary key 'id' ");
                        callback(null, data, connection);
                    });
            },
            /**
             * Stage 3.1
             * Retrieve groups depends on id
             */
            function(data, connection, callback) {
                rethinkdb.table('accounts').get(details.user).getField('groups')
                    .run(connection,function (err,result) {
                        if (err) {
                            debug('Error at \'account.service:addGroup\' while retrieving user group');
                            return callback(true, 'Error happens while retrieving user group');
                        }
                        result[data.id] = {id : data.id, name : details.group};
                        callback(null,result, data, connection);
                    });
            },
            /**
             * Stage 3.2
             * Assign that id on user groups
             */
            function(newGroup, data, connection, callback) {
                rethinkdb.table('accounts').get(details.user).update({
                    groups: newGroup
                }).run(connection, function (err, result) {
                    if (err) {
                        debug('Error at \'account.service:addGroup\' while update user group');
                        return callback(true, 'Error happens while update user group');
                    }
                    callback(null,data,connection);
                });
            },
            /**
             * Stage 4
             * Add on group field with id socket and connected : false
             */
            function (data, connection, callback) {
                rethinkdb.table(data.id).insert({
                    id          : 'socket',
                    data        : 'Group created by ' + details.user,
                    type        : 'text',
                    connected   : false,
                    time        : Date.now()
                }).run(connection,function (err,result) {
                    if (err) {
                        debug('Error at \'account.service:addGroup\' while adding socket on group');
                        return callback(true, 'Error happens while adding socket on group');
                    }
                    callback(null, connection, data);
                });
            },
            /**
             * Stage 5
             * get the data from table
             */
            function(connection, data, callback) {
                rethinkdb.table(data.id).orderBy("time")
                    .run(connection,function (err,cursor) {
                        if(err){
                            debug('Error at \'account.service:createTable\': cant get data from table \'' + data.id +'\'');
                            return callback(true, 'Error happens while getting user details');
                        }
                        cursor.toArray(function(err, results) {
                            if (err){
                                debug('Error at \'account.service:createTable\': cant convert data to array');
                                return callback(true, 'Error happens while converting data to array');
                            }
                            data.data = results;
                            callback(null,connection,data);
                        });
                    });
            }
        ], function (err,connection, data) {
            connection.close();
            callback(err !== null, data);
        });
    }
}

module.exports = AccountService;