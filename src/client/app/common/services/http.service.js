/**
 * Angular module that send http request on server
 */
(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('httpService', httpService);

    httpService.$inject = ['$http', 'md5'];

    function httpService($http, md5) {
        const service = {};

        service.accountGetUserInfo              = _accountGetUserInfo;
        service.accountGetParticipateUserInfo   = _accountGetParticipateUserInfo;
        service.accountCreate                   = _accountCreate;
        service.accountAuthenticate             = _accountAuthenticate;
        service.accountUpdate                   = _accountUpdate;

        service.groupAddData                    = _groupAddData;
        service.groupRetrieveData               = _groupRetrieveData;
        service.retrieveGroupParticipants       = _retrieveGroupParticipants;
        service.retrieveFileValue               = _retrieveFileValue;
        service.groupRetrieveName               = _groupRetrieveName;
        service.groupCreate                     = _groupCreate;
        service.groupShare                      = _groupShare;
        service.groupDelete                     = _groupDelete;
        service.groupUpdateName                 = _groupUpdateName;
        service.groupRemoveParticipant          = _groupRemoveParticipant;

        service.groupInsertToOpenedList         = _groupInsertToOpenedList;
        service.groupRemoveFromOpenedList       = _groupRemoveFromOpenedList;
        service.groupRetrieveTotalUnreadMessages= _groupRetrieveTotalUnreadMessages;

        service.groupDeleteMessage              = _groupDeleteMessage;
        service.groupModifyMessage              = _groupModifyMessage;

        return service;

        // private functions

        //Functions for account managing
        function _accountGetUserInfo(uEmail) {
            return $http({
                method          : 'GET',
                url             : '/account/info',
                params          : { uEmail : uEmail},
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('User do not exist'));
        }

        function _accountGetParticipateUserInfo(uEmail) {
            return $http({
                method          : 'GET',
                url             : '/account/participate/info',
                params          : { uEmail : uEmail},
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Participate user do not exist'));
        }

        function _accountCreate(user) {
            return $http({
                method          : 'POST',
                url             : '/account/create',
                data            : {
                                    uNickname   : user.uNickname,
                                    uEmail      : user.uEmail,
                                    uPassword   : md5(user.uPassword || '')
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Error creating user'));
        }

        function _accountAuthenticate(user) {
            return $http({
                method          : 'GET',
                url             : '/account/authenticate',
                params          : {
                                    uEmail      : user.uEmail,
                                    uPassword   : md5(user.uPassword),
                                    rememberMe  : user.rememberMe
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Error at user login'));
        }

        function _accountUpdate(details) {
            let newPassword;
            if(details.newPassword !== undefined){
                newPassword = md5(details.newPassword);
            }else{
                newPassword = undefined;
            }
            return $http({
                method      : 'POST',
                url         : '/account/update/details',
                data        : {
                    newAvatar   : details.newAvatar,
                    newNickname : details.newNickname,
                    newPassword : newPassword,
                    curPassword : md5(details.curPassword)
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Error while updating account details'));
        }

        //Functions for group managing
        function _groupAddData(data) {
            let data2send = {
                gID     : data.gID,
                data    : data.value,
                time    : data.time,
                type    : data.type,
                user    : data.user
            };
            if(data.type !== 'text'){
                data2send.file = data.file;
            }

            return $http({
                method          : 'POST',
                url             : '/group/add/data',
                data            : data2send,
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant push data'));
        }

        function _groupRetrieveData(gID, afterFrom, limitVal) {
            return $http({
                method          : 'GET',
                url             : '/group/retrieve/data',
                params          : {
                                    gID         : gID,
                                    afterFrom   : afterFrom,
                                    limitVal    : limitVal
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant retrieve data from table:' + gID));
        }

        function _retrieveGroupParticipants(gID) {
            return $http({
                method          : 'GET',
                url             : '/group/retrieve/participants',
                params          : {
                    gID         : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant retrieve participants from table:' + gID));
        }

        function _retrieveFileValue(gID, mID) {
            return $http({
                method          : 'GET',
                url             : '/group/retrieve/file',
                params          : {
                    gID : gID,
                    mID : mID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant retrieve file with id <' + mID + '> from group <' + gID +'>'));
        }

        function _groupRetrieveName(gID) {
            return $http({
                method          : 'GET',
                url             : '/group/retrieve/name',
                params          : {
                    gID : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant retrieve name from table:' + gID));
        }

        function _groupCreate(gName) {
            return $http({
                method          : 'POST',
                url             : '/group/create',
                data            : {
                                    gName : gName
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant create group \'' + gName + '\''));
        }

        function _groupShare(uEmail, gID) {
            return $http({
                method          : 'POST',
                url             : '/group/share',
                data            : {
                    email  : uEmail,
                    gID     : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant share group to user \'' + uEmail + '\''));
        }

        function _groupDelete(gID) {
            return $http({
                method          : 'GET',
                url             : '/group/delete',
                params          : {
                                    gID     : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant delete group \'' + gID + '\''));
        }

        function _groupUpdateName(data) {
            return $http({
                method          : 'POST',
                url             : '/group/update/name',
                data            : {
                                    gID     : data.gID,
                                    gName   : data.gName
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Cant update group name'));
        }

        function _groupRemoveParticipant(uEmail, gID) {
            return $http({
                method          : 'GET',
                url             : '/group/participant/remove',
                params          : {
                    gID     : gID,
                    uEmail  : uEmail,
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant remove participant from group \'' + gID + '\''));
        }

        function _groupInsertToOpenedList(gID) {
            return $http({
                method          : 'POST',
                url             : '/group/openedList/insert',
                data            : {
                                    gID : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Cant insert on opened group list'));
        }

        function _groupRemoveFromOpenedList(gID) {
            return $http({
                method          : 'POST',
                url             : '/group/openedList/remove',
                data            : {
                                    gID : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Cant remove on opened group list'));
        }

        function _groupRetrieveTotalUnreadMessages(gID, fingerprint) {
            return $http({
                method          : 'GET',
                url             : '/group/retrieve/unreadMessages',
                params          : {
                    gID         : gID,
                    fingerprint : fingerprint
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant retrieve unreadMessages from table:' + gID));
        }

        function _groupDeleteMessage(gID, mID) {
            return $http({
                method          : 'POST',
                url             : '/group/delete/message',
                data            : {
                    gID : gID,
                    mID : mID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Cant delete message from group'));
        }

        function _groupModifyMessage(gID, mID, data) {
            return $http({
                method          : 'POST',
                url             : '/group/modify/message',
                data            : {
                    gID     : gID,
                    mID     : mID,
                    data    : data,
                    modify  : Date.now()
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Cant modify message on group'));
        }

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(error) {
            return function () {
                return { success: false, message: error };
            };
        }
    }
})();
