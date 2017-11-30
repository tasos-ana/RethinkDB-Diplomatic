(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('loginService', loginService);

    loginService.$inject = ['$cookies', 'socketService'];
    function loginService( $cookies, socketService) {
        const service = {};

        service.clearCredentials = clearCredentials;

        return service;

        function clearCredentials() {
            socketService.logout();
            $cookies.remove('userCredentials');
        }
    }
})();