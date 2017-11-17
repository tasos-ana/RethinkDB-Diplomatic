(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('registerService', registerService);

    registerService.$inject = ['$http','md5'];
    function registerService($http, md5) {
        var service = {};

        service.userByEmail = userByEmail;
        service.create = create;

        return service;

        // private functions
        function userByEmail(email) {
            return $http.get('/account/user/' + email).then(handleSuccess, handleError('Email \''+ email +'\' already exist'));
        }

        function create(user) {
            user.password = md5.createHash(user.password || '');
            return $http.post('/account/create', user).then(handleSuccess, handleError('Error creating user'));
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
