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

        service.accountGetUserInfo          = _accountGetUserInfo;
        service.accountCreate               = _accountCreate;
        service.accountAuthenticate         = _accountAuthenticate;
        service.accountUpdateNickname       = _accountUpdateNickname;
        service.accountUpdatePassword       = _accountUpdatePassword;
        service.accountUpdateAll            = _accountUpdateAll;

        service.groupAddData                = _groupAddData;
        service.groupRetrieveData           = _groupRetrieveData;
        service.groupRetrieveName           = _groupRetrieveName;
        service.groupCreate                 = _groupCreate;
        service.groupDelete                 = _groupDelete;
        service.groupUpdateName             = _groupUpdateName;
        service.groupInsertToOpenedList     = _groupInsertToOpenedList;
        service.groupRemoveFromOpenedList   = _groupRemoveFromOpenedList;
        service.groupUpdateUnreadMessages      = _groupUpdateUnreadMessages;

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

        function _accountCreate(user) {
            return $http({
                method          : 'POST',
                url             : '/account/create',
                data            : {
                                    uNickname   : user.uNickname,
                                    uEmail      : user.uEmail,
                                    uPassword   : md5.createHash(user.uPassword || '')
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
                                    uPassword   : md5.createHash(user.uPassword),
                                    rememberMe  : user.rememberMe
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Error at user login'));
        }

        function _accountUpdateNickname(curPassword, nickname) {
            return $http({
                method          : 'POST',
                url             : '/account/update/nickname',
                data            : {
                    curPassword : md5.createHash(curPassword),
                    nickname    : nickname
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Error updating nickname'));
        }

        function _accountUpdatePassword(curPassword, newPassword) {
            return $http({
                method          : 'POST',
                url             : '/account/update/password',
                data            : {
                    curPassword : md5.createHash(curPassword),
                    password    : md5.createHash(newPassword)
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Error updating password'));
        }

        function _accountUpdateAll(curPassword, nickname, newPassword) {
            return $http({
                method          : 'POST',
                url             : '/account/update/all',
                data            : {
                    curPassword : md5.createHash(curPassword),
                    nickname    : nickname,
                    password    : md5.createHash(newPassword)
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Error updating nickname and password'));
        }

        //Functions for group managing
        function _groupAddData(data) {
            let data2send = {
                gID     : data.gID,
                data    : data.value,
                time    : data.time,
                type    : data.type
            };
            if(data.type !== 'text'){
                data2send.name = data.name;
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

        function _groupDelete(gID, gName) {
            return $http({
                method          : 'GET',
                url             : '/group/delete',
                params          : {
                                    gID     : gID,
                                    gName   : gName
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

        function _groupUpdateUnreadMessages(gID, newVal) {
            return $http({
                method          : 'POST',
                url             : '/group/update/unreadMessages',
                data            : {
                    gID     : gID,
                    unread  : newVal
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess, handleError('Cant update group new value for messages notification'));
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
