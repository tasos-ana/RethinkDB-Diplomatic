package com.diplomatic.pushup.dataEntities;

import java.util.HashMap;

/**
 * Created by tasos198 on 3/2/2018.
 *
 * <p>
 *  This class contains the required fields that represent a group table of rethinkDB such as:
 *     <ul>
 *         <li>id - String</li>
 *         <li>name - String</li>
 *         <li>email - String</li>
 *         <li>unreadMessages - int</li>
 *         <li>participateUsers - HashMap</li>
 *         <li>messages - HashMap</li>
 *     </ul>
 *</p>
 *
 * @see Message
 * @see User
 *
 */
public class Group {

    private String id;
    private String name;
    private String email;
    private int unreadMessages;
    private HashMap<String, User> participateUsers;
    private HashMap<String, Message> messages;

    /**
     * Initialize group of user
     *
     * @param id group id
     * @param name group name
     * @param email user id
     *
     */
    public Group(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
        unreadMessages = 0;
        participateUsers = new HashMap<>();
        messages = new HashMap<>();
    }

    /**
     * Set new name for group
     *
     * @param aName new name
     */
    public void setName(String aName) {
        this.name = aName;
    }

    /**
     * Increase by 1, the unread messages
     */
    public void increaseUnreadMessages() {
        this.unreadMessages+=1;
    }

    /**
     * Set new value on unread messages
     * @param aNumber new value
     * @throws IllegalArgumentException if <code>aNumber</code> < 0
     */
    public void setUnreadMessages(int aNumber) {
        if(aNumber < 0){
            throw new IllegalArgumentException(aNumber + " is less than 0");
        }
        this.unreadMessages = aNumber;
    }

    /**
     * Return the group ID
     * @return {String} id
     */
    public String getId() {
        return id;
    }

    /**
     * Return the group name
     * @return {String} name
     */
    public String getName() {
        return name;
    }

    /**
     * Return the group owner id
     * @return {String} email
     */
    public String getEmail() {
        return email;
    }

    /**
     * Return the group total unread messages
     * @return {int} unreadMessages
     */
    public int getUnreadMessages() {
        return unreadMessages;
    }

    /**
     * Put a new user on group participateUser
     * @param aUser {@link User} object
     * @throws NullPointerException if <code>aUser</code> is null
     * @throws IllegalArgumentException if <code>aUser</code> exist
     * @see User
     */
    public void putParticipateUser(User aUser){
        if(aUser == null){
            throw new NullPointerException("trying to put NULL object on participateUser");
        }
        if(containsParticipateUser(aUser.getEmail())){
            throw new IllegalArgumentException("trying to put user that already exist");
        }

        this.participateUsers.put(aUser.getEmail(), aUser);
    }

    /**
     * Put a new message on group messages
     * @param aMessage a {@link Message} object
     * @throws NullPointerException if <code>aMessage</code> is null
     * @throws IllegalArgumentException if <code>aMessage</code> already contained on group messages
     */
    public void putMessage(Message aMessage){
        if(aMessage == null){
            throw new NullPointerException("trying to put NULL object on messages");
        }
        if(containsMessage(aMessage.getId())){
            throw new IllegalArgumentException("trying to put message that already exist");
        }

        this.messages.put(aMessage.getId(), aMessage);
    }

    /**
     * Remove user from group participateUser
     * @param aUserEmail user id
     * @throws IllegalArgumentException if <code>aUserEmail</code> is null or empty string or not contained in participateUser
     * @return the removed {@link User} object
     * @see User
     */
    public User removeParticipateUser(String aUserEmail){
        if(aUserEmail == null || aUserEmail.trim().length() == 0){
            throw new IllegalArgumentException("aUserEmail cant be null or empty string");
        }
        if(!containsParticipateUser(aUserEmail)){
            throw new IllegalArgumentException("aUserEmail can not removed because do not exist");
        }

        return this.participateUsers.remove(aUserEmail);
    }

    /**
     * Remove message from group messages
     * @param aMessageID message id
     * @throws IllegalArgumentException if <code>aMessageID</code> is null or empty string or not contained in messages
     * @return the removed {@link Message} object
     */
    public Message removeMessage(String aMessageID){
        if(aMessageID == null || aMessageID.trim().length() == 0){
            throw new IllegalArgumentException("aMessageID cant be null or empty string");
        }
        if(!containsMessage(aMessageID)){
            throw new IllegalArgumentException("aMessageID can not removed because do not exist");
        }

        return this.messages.remove(aMessageID);
    }

    /**
     * Retrieve user from group participateUser
     * @param aUserEmail user id
     * @throws IllegalArgumentException if <code>aUserEmail</code> is null or empty string or not contained in messages
     * @return {@link User} object
     */
    public User getParticipateUser(String aUserEmail){
        if(aUserEmail == null || aUserEmail.trim().length() == 0){
            throw new IllegalArgumentException("aUserEmail cant be null or empty string");
        }
        if(!containsParticipateUser(aUserEmail)){
            throw new IllegalArgumentException("aUserEmail can not retrieved because do not exist");
        }

        return this.participateUsers.get(aUserEmail);
    }

    /**
     * Retrieve message from group messages
     * @param aMessageID message id
     * @throws IllegalArgumentException if <code>aMessageID</code> is null or empty string or not contained in messages
     * @return {@link Message} object
     */
    public Message getMessage(String aMessageID){
        if(aMessageID == null || aMessageID.trim().length() == 0){
            throw new IllegalArgumentException("aMessageID cant be null or empty string");
        }
        if(!containsMessage(aMessageID)){
            throw new IllegalArgumentException("aMessageID can not retrieved because do not exist");
        }

        return this.messages.get(aMessageID);
    }

    /**
     * Modify the value of message on group messages
     * @param aMessage a {@link Message} object
     * @throws NullPointerException if <code>aMessageID</code> is null
     * @throws IllegalArgumentException if <code>aMessageID</code> is not contained in messages
     */
    public void modifyMessage(Message aMessage){
        if(aMessage == null){
            throw new NullPointerException("trying to put NULL object on messages");
        }
        if(!containsMessage(aMessage.getId())){
            throw new IllegalArgumentException("trying to modify message that not exist");
        }

        //TODO replace on api 24+
        //this.messages.replace(aMessage.getId(), aMessage);
        this.messages.remove(aMessage.getId());
        this.messages.put(aMessage.getId(), aMessage);
    }

    /**
     * Check if <code>aUserEmail</code> exists on group participateUsers
     * @param aUserEmail user id
     * @throws IllegalArgumentException if <code>aUserEmail</code> is null or empty string
     * @return true if <code>aUserEmail</code> contained on participateUsers, otherwise false
     */
    public boolean containsParticipateUser(String aUserEmail){
        if(aUserEmail == null || aUserEmail.trim().length() == 0){
            throw new IllegalArgumentException("aUserEmail cant be null or empty string");
        }
        return !this.participateUsers.isEmpty() && this.participateUsers.containsKey(aUserEmail);
    }

    /**
     * Check if <code>aMessageID</code> exists on group messages
     * @param aMessageID message id
     * @throws IllegalArgumentException if <code>aMessageID</code> is null or empty string
     * @return true if <code>aMessageID</code> contained on messages, otherwise false
     */
    public boolean containsMessage(String aMessageID){
        if(aMessageID == null || aMessageID.trim().length() == 0){
            throw new IllegalArgumentException("aMessageID cant be null or empty string");
        }
        return !this.messages.isEmpty() && this.messages.containsKey(aMessageID);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Group{")
                .append("id='").append(this.id).append('\'')
                .append(", name='").append(this.name).append('\'')
                .append(", email='").append(this.email).append('\'')
                .append(", unreadMessages=").append(this.unreadMessages)
                .append(", participateUsers={");
        for(String key : this.participateUsers.keySet()){
            sb.append('<').append(key).append(':').append(this.participateUsers.get(key).toString()).append(">, ");
        }

        sb.append("}, messages={");
        for(String key : this.messages.keySet()){
            sb.append('<').append(key).append(':').append(this.messages.get(key).toString()).append(">, ");
        }
        sb.append("}}");

        return sb.toString();
    }
}