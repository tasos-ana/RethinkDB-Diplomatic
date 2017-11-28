(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('loginService', loginService);

    loginService.$inject = ['$http', '$cookies', '$rootScope', 'socketService'];
    function loginService($http, $cookies, $rootScope, socketService) {
        var service = {};

        service.setCredentials = setCredentials;
        service.clearCredentials = clearCredentials;

        return service;

        function setCredentials(uEmail, cookie) {

            $rootScope.globals = {
              currentUser: {
                  email     : uEmail,
                  authdata  : cookie}
            };

            // set default auth header for http requests
            $http.defaults.headers.common['Authorization'] = cookie;

            // store user details in globals cookie that keeps user logged in for 1 week (or until they logout)
            const cookieExp = new Date();
            cookieExp.setHours(cookieExp.getHours() + 1);
            $cookies.putObject('LOGIN INFO', $rootScope.globals, { expires: cookieExp });
        }

        function clearCredentials() {
            socketService.logout();
            $rootScope.globals = {};
            $cookies.remove('LOGIN INFO');
            $http.defaults.headers.common.Authorization = 'Basic';
        }
    }
})();