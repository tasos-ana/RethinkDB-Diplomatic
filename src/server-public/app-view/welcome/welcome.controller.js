(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('WelcomeController', WelcomeController);

    WelcomeController.$inject = ['$rootScope', '$location', "$cookies", "$http"];
    function WelcomeController($rootScope, $location, $cookies, $http) {
        var vm = this;

        initController();


        function initController() {
            // keep user logged in after page refresh
            $rootScope.globals = $cookies.getObject('globals') || {};
            if ($rootScope.globals.currentUser) {
                $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
            }

            $rootScope.$on('$locationChangeStart', function (event, next, current) {
                // redirect to home page if logged in
                var loggedIn = $rootScope.globals.currentUser;
                if (loggedIn) {
                    //$location.path('/home');
                }
            });
        }
    }

})();