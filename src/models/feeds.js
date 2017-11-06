var rethinkdb = require('rethinkdb');
var db = require('./db');
var r = new db();

module.exports = function(socket){
	r.connectToDb(function(err,connection){
		if(err){
			return callback(true,"Error connecting to database");
		}

		rethinkdb.table('table1').changes().run(connection,function(err,cursor){
			if(err){
				console.log(err);
			}

			cursor.each(function(err,row){
				console.log(JSON.stringify(row));
				if(Object.keys(row).length > 0){
					socket.broadcast.emit("changeFeed",{"id" : row.new_val.id, "value" : row.new_val.name});
				}
			});
		});
	});
}