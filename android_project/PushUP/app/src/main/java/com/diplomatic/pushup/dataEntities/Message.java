package com.diplomatic.pushup.dataEntities;

import java.util.Calendar;
import java.util.Date;

/**
 * Created by tasos198 on 3/2/2018.
 *
 * <p>
 *  This class contains the required fields that represent a message of group such as:
 *     <ul>
 *         <li>id               - String</li>
 *         <li>data             - String</li>
 *         <li>type             - String</li>
 *         <li>fileValue        - String</li>
 *         <li>user             - User</li>
 *         <li>time             - long</li>
 *         <li>modify           - long</li>
 *         <li>timeAsString     - String</li>
 *         <li>modifyAsString   - String</li>
 *     </ul>
 *</p>
 *
 * @see User
 *
 */
public class Message {

    private String id;

    private String data;
    private String type;
    private String fileValue;

    private User user;

    private long time;
    private long modify;

    private String timeAsString;
    private String modifyAsString;

    /**
     * Construct message that is file
     *
     * @param aMessageID message id
     * @param aData file name
     * @param aType file type
     * @param aFileValue file content
     * @param aUser sender email
     * @param aTime send time (timestamp)
     * @param aModify modify time (timestamp)
     * @throws IllegalArgumentException if any of the argument is null or empty string for strings,
     *                                      negative for long number
     */
    public Message(String aMessageID, String aData, String aType, String aFileValue, User aUser, long aTime, long aModify) {
        if(aMessageID == null || aMessageID.trim().length() == 0){
            throw new IllegalArgumentException("aMessageID cant be null or empty string");
        }
        if(aData == null || aData.trim().length() == 0){
            throw new IllegalArgumentException("aData cant be null or empty string");
        }
        if(aType == null || aType.trim().length() == 0){
            throw new IllegalArgumentException("aType cant be null or empty string");
        }
        if(aFileValue == null || aFileValue.trim().length() == 0){
            throw new IllegalArgumentException("aFileValue cant be null or empty string");
        }
        if(aUser == null){
            throw new IllegalArgumentException("aUser cant be null object");
        }
        if(aTime <= 0){
            throw new IllegalArgumentException("aTime cant be less or equal than zero");
        }
        if(aModify < 0){
            throw new IllegalArgumentException("aModify cant be less or equal than zero");
        }

        this.id = aMessageID;
        this.data = aData;
        this.type = aType;
        this.fileValue = aFileValue;
        this.user = aUser;
        this.time = aTime;
        this.modify = aModify;

        configureDates();
    }

    /**
     * Construct message that is text
     *
     * @param aMessageID message id
     * @param aData file name
     * @param aType file type
     * @param aUser sender email
     * @param aTime send time (timestamp)
     * @param aModify modify time (timestamp)
     * @throws IllegalArgumentException if any of the argument is null or empty string for strings,
     *                                      negative for long number
     */
    public Message(String aMessageID, String aData, String aType, User aUser, long aTime, long aModify) {
        if(aMessageID == null || aMessageID.trim().length() == 0){
            throw new IllegalArgumentException("aMessageID cant be null or empty string");
        }
        if(aData == null || aData.trim().length() == 0){
            throw new IllegalArgumentException("aData cant be null or empty string");
        }
        if(aType == null || aType.trim().length() == 0){
            throw new IllegalArgumentException("aType cant be null or empty string");
        }
        if(aUser == null){
            throw new IllegalArgumentException("aUser cant be null object");
        }
        if(aTime <= 0){
            throw new IllegalArgumentException("aTime cant be less or equal than zero");
        }
        if(aModify < 0){
            throw new IllegalArgumentException("aModify cant be less or equal than zero");
        }

        this.id = aMessageID;
        this.data = aData;
        this.type = aType;
        this.user = aUser;
        this.time = aTime;
        this.modify = aModify;

        configureDates();
    }

    /**
     * Return message id
     * @return {String} id
     */
    public String getId() {
        return id;
    }

    /**
     * Return message data
     * @return {String} data
     */
    public String getData() {
        return data;
    }

    /**
     * Return message type
     * @return {String} type
     */
    public String getType() {
        return type;
    }

    /**
     * Return message file value
     * @throws UnsupportedOperationException if message type is text
     * @return {String} fileValue
     */
    public String getFileValue(){
        if(type.endsWith("text")){
            throw new UnsupportedOperationException("fileValue do not exist for message type text");
        }
        return fileValue;
    }

    /**
     * Return {@link User} that send the message
     * @return user
     */
    public User getUser() {
        return user;
    }

    /**
     * Return the send message time
     * @return time
     */
    public long getTime() {
        return time;
    }

    /**
     * Return the modify message time
     * @return modify
     */
    public long getModify() {
        return modify;
    }

    /**
     * Return the send message time as string
     * @return timeAsString
     */
    public String getTimeAsString() {
        return timeAsString;
    }

    /**
     * Return the modify message time as string
     * @return modifyAsString
     */
    public String getModifyAsString() {
        return modifyAsString;
    }

    /**
     * Set new data value for message
     * @param aData new message data
     * @throws IllegalArgumentException if aData is null or empty string
     */
    public void setData(String aData) {
        if(aData == null || aData.trim().length() == 0){
            throw new IllegalArgumentException("cant set data to message that is null or empty");
        }
        this.data = aData;
    }

    /**
     * Set new modification time for message
     * @param aTime new modification time
     * @throws IllegalArgumentException if <code>aTime</code> has negative value
     */
    public void setModify(long aTime) {
        if(aTime <= 0){
            throw new IllegalArgumentException("cant assign time to negative value");
        }
        this.modify = aTime;
    }

    /**
     * Convert send and modify time to string
     * For a valid time and modify we convert it to nice view string
     *
     */
    public void configureDates(){
        Calendar aTime = Calendar.getInstance();
        if(this.time>0){
            aTime.setTime(new Date(this.time));
            this.timeAsString = timestampToString(aTime);
        }

        if(this.modify>0){
            aTime.setTime(new Date(this.modify));
            this.modifyAsString = timestampToString(aTime);
        }
    }

    /**
     * Convert aTime to string for better look on device
     * <p>
     *     Make compares between current time and message send and modify time, we convert timestamp
     *     to String. That string looks like "Today @ 13:00". The algorithm check if the day where
     *     message send is today or yesterday and use it as prefix for time, else it's use the day where
     *     message send. Next will append the hh:mm:s of message
     * </p>
     *
     * @param aTime a time depends on timestamp
     * @return {String} represent on <code>aTime</code>
     */
    private String timestampToString(Calendar aTime){
        Calendar now = Calendar.getInstance();
        StringBuilder sb = new StringBuilder();

        int _dd = now.get(Calendar.DAY_OF_MONTH),
                _mm = now.get(Calendar.MONTH) + 1,
                _yyyy = now.get(Calendar.YEAR) - 1900;
        int dd = aTime.get(Calendar.DAY_OF_MONTH),
                mm = aTime.get(Calendar.MONTH) + 1,
                yyyy = aTime.get(Calendar.YEAR) - 1900;

        if( (yyyy != _yyyy) || (mm != _mm) || ((dd - _dd)>1) ){
            sb.append(dd).append("/").append(mm).append("/").append(yyyy);
        }else{
            if(dd != _dd){
                sb.append("Yesterday");
            }else{
                sb.append("Today");
            }
        }
        sb.append(" @ ")
                .append(aTime.get(Calendar.HOUR_OF_DAY)).append(":").append(aTime.get(Calendar.MINUTE))
                .append(":").append(aTime.get(Calendar.SECOND));

        return sb.toString();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Message{")
                .append("id='").append(this.id).append('\'')
                .append(", type='").append(this.type).append('\'');

        if(this.type.equals("text")){
            sb.append(", file name='").append(this.data).append('\'')
                    .append(", file content='").append(this.fileValue).append('\'');
        }else {
            sb.append(", message text='").append(this.data).append('\'');
        }

        sb.append(", time='").append(this.timeAsString).append('\'')
                .append(" (").append(this.time).append(")")
                .append(", modify='").append(this.modifyAsString).append('\'')
                .append(" (").append(this.time).append(")")
                .append("}");

        return sb.toString();
    }
}
