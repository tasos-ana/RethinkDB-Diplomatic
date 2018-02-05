package com.diplomatic.pushup.utils.database;

import com.rethinkdb.RethinkDB;
import com.rethinkdb.gen.exc.ReqlError;
import com.rethinkdb.gen.exc.ReqlQueryLogicError;
import com.rethinkdb.model.MapObject;
import com.rethinkdb.net.Connection;

/**
 * Created by tasos198 on 4/2/2018.
 *
 */

public class Database {
    private final Connection conn;

    public Database() {
        RethinkDB r = RethinkDB.r;
        this.conn = r.connection().hostname("192.168.10.3").port(28015).connect();
    }

    public Connection getConnection(){
        return this.conn;
    }

    public void closeConnection(){
        conn.close();
    }
}
