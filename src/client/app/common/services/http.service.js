(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('httpService', httpService);

    httpService.$inject = ['$http', 'md5', '$cookies'];
    function httpService($http, md5, $cookies) {
        const service = {};

        service.accountGetUserInfo      = _accountGetUserInfo;

        service.accountCreate           = _accountCreate;

        service.accountAuthenticate     = _accountAuthenticate;

        service.groupAddData            = _groupAddData;
        service.groupRetrieveData       = _groupRetrieveData;
        service.groupCreate             = _groupCreate;
        service.groupDelete             = _groupDelete;
        service.groupUpdateName         = _groupUpdateName;

        return service;

        // private functions
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
                                    uPassword   : md5.createHash(user.uPassword)
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Error at user login'));
        }

        function _groupAddData(data) {
            return $http({
                method          : 'POST',
                url             : '/group/add',
                data            : {
                                    gID     : data.gID,
                                    data    : data.data,
                                    time    : data.time,
                                    type    : data.type
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant push data'));
        }

        function _groupRetrieveData(gID) {
            return $http({
                method          : 'GET',
                url             : '/group/retrieve',
                params          : {
                                    gID : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleError('Cant retrieve data from table:' + gID));
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

        function _groupDelete(gID) {
            return $http({
                method          : 'GET',
                url             : '/group/delete',
                params          : {
                                    gID : gID
                },
                xsrfCookieName  : 'XSRF-TOKEN',
                xsrfHeaderName  : 'x-xsrf-token'
            }).then(handleSuccess,handleSuccess('Cant delete group \'' + gID + '\''));
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
