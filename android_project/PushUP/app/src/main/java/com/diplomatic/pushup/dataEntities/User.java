package com.diplomatic.pushup.dataEntities;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by tasos198 on 3/2/2018.
 * <p>
 * <p>
 * This class contains the basic user details such a:
 * <ul>
 * <li>email - String</li>
 * <li>nickname - String</li>
 * <li>avatar - String</li>
 * </ul>
 * </p>
 */

public class User {

    private String email;
    private String nickname;
    private String avatar;

    /**
     * Construct new user with email, nickname, avatar
     *
     * @param anEmail   user email
     * @param aNickname user nickname
     * @param anAvatar  user avatar
     */
    public User(String anEmail, String aNickname, String anAvatar) {
        if (anEmail == null || anEmail.trim().length() == 0) {
            throw new IllegalArgumentException("anEmail cant be null or empty string");
        }
        if (aNickname == null || aNickname.trim().length() == 0) {
            throw new IllegalArgumentException("aNickname cant be null or empty string");
        }
        if (anAvatar == null || anAvatar.trim().length() == 0) {
            throw new IllegalArgumentException("anAvatar cant be null or empty string");
        }

        this.email = anEmail;
        this.nickname = aNickname;
        this.avatar = anAvatar;
    }

    /**
     * Return the user email
     *
     * @return {String} email
     */
    public String getEmail() {
        return this.email;
    }

    /**
     * Return the user nickname
     *
     * @return {String} nickname
     */
    public String getNickname() {
        return this.nickname;
    }

    /**
     * Return the user avatar
     *
     * @return {String} avatar
     */
    public String getAvatar() {
        return this.avatar;
    }

    /**
     * Set new nickname for the user
     *
     * @param aNickname new nickname
     * @throws IllegalArgumentException if <code>aNickname</code> is null or empty string
     */
    public void setNickname(String aNickname) {
        if (aNickname == null || aNickname.trim().length() == 0) {
            throw new IllegalArgumentException("aNickname cant be null or empty string");
        }
        this.nickname = aNickname;
    }

    /**
     * Set new avatar for the user
     *
     * @param anAvatar new avatar
     * @throws IllegalArgumentException if <code>anAvatar</code> is null or empty string
     */
    public void setAvatar(String anAvatar) {
        if (anAvatar == null || anAvatar.trim().length() == 0) {
            throw new IllegalArgumentException("anAvatar cant be null or empty string");
        }
        this.avatar = anAvatar;
    }

    public String generateAvatar() {
        List<Character> characters = new ArrayList<>();
        for (char c : this.avatar.toCharArray()) {
            characters.add(c);
        }
        StringBuilder newAvatar = new StringBuilder(this.avatar.length());
        while (characters.size() != 0) {
            int randPicker = (int) (Math.random() * characters.size());
            newAvatar.append(characters.remove(randPicker));
        }

        return newAvatar.toString();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();

        sb.append("User{")
                .append("email='").append(this.email).append('\'')
                .append(", nickname='").append(this.nickname).append('\'')
                .append(", avatar='").append(this.avatar).append('\'')
                .append('}');


        return sb.toString();
    }
}
