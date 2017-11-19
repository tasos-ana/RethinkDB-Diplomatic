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
                    'groups'    : []
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
            callback(err === null ? false : true, data);
        });
    }

    authenticate(details, callback) {
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
                        connection.close();
                        if(err){
                            debug('Error at \'account.service:authenticate\': cant get user with email \'' + details.email +'\'');
                            return callback(true, 'Error happens while getting user details');
                        }
                            if(result === null || result.password !== details.password){
                                return callback(true, 'Email or password its wrong');
                            }
                            callback(null,{"email": result.email, "nickname":result.nickname, "groups":result.groups});
                    });
            }
        ], function (err,data) {
            callback(err === null ? false : true, data);
        });
    }

    getAccount(email, callback){
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
            callback(err === null ? false : true, data);
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
            function (connection, callback) {
                var data2return = {
                    user    : '',
                    name    : '',
                    id      : '',
                    data    : []
                };
                data2return.user = details.user;

                /** 1st
                 * Add new tuple on groups and get the id that assigned to that tuple
                 */
                rethinkdb.table('groups').insert({
                    'name'  : details.group,
                    'user'  : details.user
                }).run(connection,function(err,result){
                    if(err){
                        debug('Error at \'account.service:addGroup\': while adding new group{' + details.group + '}');
                        return callback(true, 'Error happens while adding new group');
                    }
                    debug('Add new group: ' + details.group);
                    var tmpID = result.generated_keys[0];
                    data2return.id = tmpID.replace(/-/g,'_');
                    data2return.name = details.group;

                    /** 2nd
                     * Add a table with generated ID from previous query (replace {-} with {_}
                     */
                    new db().initTable(data2return.id,'id');

                    /** 3rd
                     * Assign that id on user groups
                     */
                    rethinkdb.table('accounts').get(data2return.user).getField('groups')
                        .run(connection,function (err,result) {
                           if(err){
                               debug('Error at \'account.service:addGroup\' while retrieving user group');
                               return callback(true, 'Error while retrieving user group');
                           }
                           result[result.length] = {id : data2return.id, name : details.group};
                           rethinkdb.table('accounts').get(data2return.user).update({
                               groups: result
                           }).run(connection,function (err,result) {
                                if(err){
                                    debug('Error at \'account.service:addGroup\' while update user group');
                                    return callback(true, 'Error while update user group');
                                }
                           });
                        });


                    /** 4th
                     * Add group on sockets table with enabled : false
                     */
                    rethinkdb.table('sockets').insert({
                        'id'        : data2return.id,
                        'enabled'    : false
                    }).run(connection,function (err,result) {
                        if(err){
                            debug('Error at \'account.service:addGroup\': while adding group{' + details.group + '} on sockets');
                            return callback(true, 'Error happens while adding group on sockets');
                        }
                        connection.close();
                        callback(null,data2return);
                    });
                });
            }
        ], function (err,data) {
            callback(err === null ? false : true, data);
        });
    }


}

module.exports = AccountService;