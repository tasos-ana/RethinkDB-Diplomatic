(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('httpService', httpService);

    httpService.$inject = ['$http', 'md5'];
    function httpService($http, md5) {
        var service = {};

        service.accountGetUserByEmail   = _accountGetUserByEmail;

        service.accountCreate           = _accountCreate;

        service.accountAuthenticate     = _accountAuthenticate;

        service.groupAddData            = _groupAddData;
        service.groupRetrieveData       = _groupRetrieveData;
        service.groupCreate             = _groupCreate;
        service.groupDelete             = _groupDelete;

        return service;

        // private functions
        function _accountGetUserByEmail(uEmail) {
            return $http.get('/account/info/' + uEmail)
                .then(handleSuccess, handleError('User do not exist'));
        }

        function _accountCreate(user) {
            user.uPassword = md5.createHash(user.uPassword || '');
            return $http.post('/account/create', user)
                .then(handleSuccess, handleError('Error creating user'));
        }

        function _accountAuthenticate(user) {
            return $http.get('/account/authenticate/' + user.uEmail + '/' + md5.createHash(user.uPassword))
                .then(handleSuccess,handleError('Error at user login'));
        }

        function _groupAddData(data) {
            return $http.post('/group/add', data)
                .then(handleSuccess,handleError('Cant push data'));
        }

        function _groupRetrieveData(gID) {
            return $http.get('/group/retrieve/' + gID)
                .then(handleSuccess,handleError('Cant retrieve data from table:' + gID));
        }

        function _groupCreate(data) {
            return $http.post('/group/create',data)
                .then(handleSuccess,handleError('Cant create group \'' + data.gName + '\' for user ' + data.uEamil));
        }

        function _groupDelete(gID) {
            return $http.get('/group/delete/' + gID)
                .then(handleSuccess,handleSuccess('Cant delete group \'' + gID + '\''));
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
