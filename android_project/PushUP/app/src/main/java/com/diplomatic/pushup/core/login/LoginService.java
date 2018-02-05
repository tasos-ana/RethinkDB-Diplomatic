package com.diplomatic.pushup.core.login;
import com.diplomatic.pushup.utils.database.Database;
import com.rethinkdb.RethinkDB;
import com.rethinkdb.net.Connection;
import com.rethinkdb.net.Cursor;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Created by tasos198 on 4/2/2018.
 *
 */

public class LoginService {

    public static boolean authenticateUser(String email, String password){
        RethinkDB r = RethinkDB.r;
        Database db = new Database();
        Connection conn = db.getConnection();

        Cursor cursor = r.table("accounts").get(email).pluck("password").run(conn);
        for (Object obj : cursor){
            System.out.println(obj);
        }

        db.closeConnection();
        return false;
    }

    public static boolean isEmailValid(final String email){
        return true;
    }

    public static boolean isPasswordValid(final String password){
        return true;
    }

    public static String md5(final String s) {
        final String MD5 = "MD5";
        try {
            // Create MD5 Hash
            MessageDigest digest = MessageDigest.getInstance(MD5);
            digest.update(s.getBytes());
            byte messageDigest[] = digest.digest();

            // Create Hex String
            StringBuilder hexString = new StringBuilder();
            for (byte aMessageDigest : messageDigest) {
                String h = Integer.toHexString(0xFF & aMessageDigest);
                while (h.length() < 2)
                    h = "0" + h;
                hexString.append(h);
            }
            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return "";
    }
}
