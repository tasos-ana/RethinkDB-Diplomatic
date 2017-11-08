(function () {
    'use strict';
    angular
        .module('starterApp',['ngMaterial','ngMessages','ngRoute','ngCookies'])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];
    function config($routeProvider, $locationProvider) {

        $routeProvider
            .when('/',{
                templateUrl: './app-view/welcome/welcome.view.html'
            })
            .when('/home',{
                templateUrl: './app-view/home/home.view.html'
            })
            .when('/about',{
                templateUrl: './app-view/about/about.view.html'
            })
            .when('/login',{
                controller: 'LoginController',
                templateUrl: './app-view/login/login.view.html',
                controllerAs: 'vm'
            })
            .when('/register',{
                controller: 'RegisterController',
                templateUrl: './app-view/register/register.view.html',
                controllerAs: 'vm'
            })
            .otherwise({redirectTo: '/'});
    }

    run.$inject = ['$rootScope', '$location', "$cookies", "$http"];
    function run($rootScope, $location, $cookies, $http) {
        // keep user logged in after page refresh
        $rootScope.globals = $cookies.getObject('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var validPage = $.inArray($location.path(), ['/home']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (!validPage && !loggedIn) {
                $location.path('/login');
            }
        });
    }
})();