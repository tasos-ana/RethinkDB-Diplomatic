package com.diplomatic.pushup.dataEntities;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * Created by tasos198 on 3/2/2018.
 *
 * <p>
 *  This class extends {@link User} class and add 3 more attributes such as:
 *     <ul>
 *         <li>myGroups - HashMap</li>
 *         <li>participateGroups - HashMap</li>
 *         <li>openedGroups - ArrayList</li>
 *     </ul>
 *</p>
 *
 * @see Group
 *
 */
public class Account extends User {

    private HashMap<String, Group> myGroups;
    private HashMap<String, Group> participateGroups;
    private ArrayList<String> openedGroups;

    /**
     * Create new account, then a new user with the give arguments. Also initialize new hashMaps and Arraylist
     * @param anEmail user email
     * @param aNickname user nickname
     * @param anAvatar user avatar
     */
    public Account(String anEmail, String aNickname, String anAvatar) {
        super(anEmail, aNickname, anAvatar);
        myGroups = new HashMap<>();
        participateGroups = new HashMap<>();
        openedGroups = new ArrayList<>();
    }

    /**
     * Put new group on myGroups hashMap
     * @param aGroup {@link Group} object
     * @throws NullPointerException if <code>aGroup</code> is null
     * @throws IllegalArgumentException if <code>aGroup</code> already contained on myGroups
     */
    public void putGroup(Group aGroup){
        if(aGroup == null){
            throw new NullPointerException("trying to put Null object on myGroups");
        }
        if(!containsGroup(aGroup.getId())){
            throw new IllegalArgumentException("trying to put a group that already exist on myGroups");
        }

        this.myGroups.put(aGroup.getId(), aGroup);
    }

    /**
     * Put new group on participateGroups hashMap
     * @param aGroup {@link Group} object
     * @throws NullPointerException if <code>aGroup</code> is null
     * @throws IllegalArgumentException if <code>aGroup</code> already contained on participateGroups
     */
    public void putParticipateGroup(Group aGroup){
        if(aGroup == null){
            throw new NullPointerException("trying to put Null object on participateGroups");
        }
        if(!containsParticipateGroup(aGroup.getId())){
            throw new IllegalArgumentException("trying to put a group that already exist on participateGroups");
        }

        this.participateGroups.put(aGroup.getId(), aGroup);
    }

    /**
     * Add new group on openedGroups
     * @param aGroupID group id
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or, empty string or already exist on openedGroups
     */
    public void addOpenedGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroupID cant be null or empty string");
        }
        if(containsOpenedGroup(aGroupID)){
            throw new IllegalArgumentException("aGroupID already exist on openedGroups");
        }
        this.openedGroups.add(aGroupID);
    }

    /**
     * Remove a group from myGroups
     * @param aGroupID group ID
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or empty String or not contained on myGroups
     * @return the removed {@link Group} object
     */
    public Group removeGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroupID cant be null or empty string");
        }
        if(!containsGroup(aGroupID)){
            throw new IllegalArgumentException("aGroupID cant removed if don't exist");
        }

        return this.myGroups.remove(aGroupID);

    }

    /**
     * Remove a group from participateGroups
     * @param aGroupID group ID
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or empty String or not contained on participateGroups
     * @return the removed {@link Group} object
     */
    public Group removeParticipateGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroupID cant be null or empty string");
        }
        if(!containsParticipateGroup(aGroupID)){
            throw new IllegalArgumentException("aGroupID cant removed if don't exist");
        }

        return this.participateGroups.remove(aGroupID);
    }

    /**
     * Remove a group from openedGroups
     * @param aGroupID group id
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or, empty string or not exist on openedGroups
     */
    public void removeOpenedGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroupID cant be null or empty string");
        }
        if(!this.openedGroups.contains(aGroupID)){
            throw new IllegalArgumentException("aGroupID cant removed because do not exist on openedGroups");
        }
        this.openedGroups.remove(aGroupID);
    }

    /**
     * Retrieve a group from myGroups
     * @param aGroupID group ID
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or empty string or not contained at myGroups
     * @return {@link Group} object
     */
    public Group getGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroup cant be null or empty string");
        }
        if(!containsGroup(aGroupID)){
            throw new IllegalArgumentException("aGroupID can not get because don't exist");
        }

        return this.myGroups.get(aGroupID);
    }

    /**
     * Retrieve a group from participateGroups
     * @param aGroupID group ID
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or empty string or not contained at participateGroups
     * @return {@link Group} object
     */
    public Group getParticipateGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroup cant be null or empty string");
        }
        if(!containsGroup(aGroupID)){
            throw new IllegalArgumentException("aGroupID can not get because don't exist");
        }

        return this.participateGroups.get(aGroupID);
    }

    /**
     * Return all the openedGroups
     * @return openedGroups
     */
    public ArrayList<String> getOpenedGroups(){
        return this.openedGroups;
    }

    /**
     * Check if <code>aGroupID</code> exists on myGroups
     * @param aGroupID group id
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or empty string
     * @return true if <code>aGroupID</code> exist on myGroups, otherwise false
     */
    public boolean containsGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroupID cant be null or empty string");
        }
        return !this.myGroups.isEmpty() && this.myGroups.containsKey(aGroupID);
    }

    /**
     * Check if <code>aGroupID</code> exists on participateGroups
     * @param aGroupID group id
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or empty string
     * @return true if <code>aGroupID</code> exist on participateGroups, otherwise false
     */
    public boolean containsParticipateGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroupID cant be null or empty string");
        }
        return !this.participateGroups.isEmpty() && this.participateGroups.containsKey(aGroupID);
    }

    /**
     * Check if <code>aGroupID</code> exists on openedGroups
     * @param aGroupID group id
     * @throws IllegalArgumentException if <code>aGroupID</code> is null or empty string
     * @return true if <code>aGroupID</code> contained at openedGroups, otherwise false
     */
    public boolean containsOpenedGroup(String aGroupID){
        if(aGroupID == null || aGroupID.trim().length() == 0){
            throw new IllegalArgumentException("aGroupID cant be null or empty string");
        }
        return !this.openedGroups.isEmpty() && this.openedGroups.contains(aGroupID);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();

        sb.append("Account{").append("myGroups={");
        for(String key : this.myGroups.keySet()){
            sb.append('<').append(key).append(':').append(this.myGroups.get(key).toString()).append(">, ");
        }

        sb.append("}, participateGroups={");
        for(String key : this.participateGroups.keySet()){
            sb.append('<').append(key).append(':').append(this.participateGroups.get(key).toString()).append(">, ");
        }

        sb.append("}, openedGroups=[");
        for(String key : this.openedGroups){
            sb.append(key).append(", ");
        }
        sb.append("]}");

        return sb.toString();
    }
}