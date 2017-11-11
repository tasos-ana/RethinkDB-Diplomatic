(function () {
    'use strict';
    angular
        .module('starterApp',['ngMaterial','ngRoute','ngCookies'])
        .config(config)
        .run(run);

    config.$inject = ['$mdThemingProvider','$routeProvider', '$locationProvider'];
    function config($mdThemingProvider,$routeProvider, $locationProvider) {
        // Configure a dark theme with primary foreground lime
        $mdThemingProvider.theme('docs-dark', 'default')
            .primaryPalette('lime')
            .accentPalette('cyan')
            .dark();

        $mdThemingProvider.theme('default')
            .primaryPalette('lime')
            .accentPalette('cyan')
            .dark();
        $locationProvider.html5Mode(true);
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

    run.$inject = ['$rootScope', '$location', "$cookies", "$http",'$mdSidenav'];
    function run($rootScope, $location, $cookies, $http,$mdSidenav) {
        /*
            Side bar
         */
        $rootScope.toggleLeft = buildToggler('left');
        $rootScope.toggleRight = buildToggler('right');

        function buildToggler(componentId) {
            return function () {
                $mdSidenav(componentId).toggle();
            };
        }
        var p =  $location.path();
        if(p === '/') p ='/Home'
        $rootScope.pageName = p.split('/')[1];
        // keep user logged in after page refresh
        $rootScope.globals = $cookies.getObject('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        }

        $rootScope.$on('$routeChangeSuccess','$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var validPage = $.inArray($location.path(), ['/home']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (!validPage && !loggedIn) {
                $location.path('/login');
            }
            if(loggedIn){
                $location.path('/home');
            }
        });
    }
})();