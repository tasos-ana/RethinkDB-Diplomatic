(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('httpService', httpService);

    httpService.$inject = ['$http', 'md5'];
    function httpService($http, md5) {
        var service = {};

        service.accountGetUserByEmail = accountGetUserByEmail;

        service.accountCreate = accountCreate;

        service.accountAuthenticate = accountAuthenticate;

        service.groupAddData = groupAddData;
        service.groupRetrieveData = groupRetrieveData;
        service.groupCreate = groupCreate;

        return service;

        // private functions
        function accountGetUserByEmail(uEmail) {
            return $http.get('/account/info/' + uEmail)
                .then(handleSuccess, handleError('User do not exist'));
        }

        function accountCreate(user) {
            user.uPassword = md5.createHash(user.uPassword || '');
            return $http.post('/account/create', user)
                .then(handleSuccess, handleError('Error creating user'));
        }

        function accountAuthenticate(user) {
            return $http.get('/account/authenticate/' + user.uEmail + '/' + md5.createHash(user.uPassword))
                .then(handleSuccess,handleError('Error at user login'));
        }

        function groupAddData(data) {
            return $http.post('/group/add', data)
                .then(handleSuccess,handleError('Cant push data'));
        }

        function groupRetrieveData(gID) {
            return $http.get('/group/retrieve/' + gID)
                .then(handleSuccess,handleError('Cant retrieve data from table:' + gID));
        }

        function groupCreate(data) {
            return $http.post('/group/create',data)
                .then(handleSuccess,handleError('Cant create group \'' + data.gName + '\' for user ' + data.uEamil));
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
