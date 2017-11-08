"use strict";

var rethinkdb = require('rethinkdb');
var db = require('./database.service');
var async = require('async');

class sync {
	addNewData(dataSet,callback) {
		async.waterfall([
			function(callback){
				var r = new db();
				r.connectToDb(function(err,connection){
					if(err){
						return callback(true,'Error connecting to database');
					}
					callback(null,connection);
				});
			},
			function(connection,callback) {
				rethinkdb.table('table1').insert({
					"name" : dataSet.name
				}).run(connection,function(err,result){
					connection.close();
					if(err){
						return callback(true,'Error happens while pushing new data');
					}
					callback(null,result);
				});
			}
		],function(err,data){
			callback(err === null ? false : true,data);
		});
	}

	getAllData(callback){
		async.waterfall([
			function(callback){
				var r = new db();
				r.connectToDb(function(err,connection){
					if(err){
						return callback(true,"Error connecting to database");
					}
					callback(null,connection);
				});
			},
			function(connection,callback){
				rethinkdb.table('table1').run(connection,function(err,cursor){
					connection.close();
					if(err){
						return callback(true,"Error fetching data from database");
					}
					cursor.toArray(function(err,result){
						if(err){
							return callback(true,"Error reading cursor");
						}
						callback(null,result);
					});
				});
			}
		],function(err,data){
			callback(err === null ? false : true,data);
		});
	}
}


module.exports = sync;