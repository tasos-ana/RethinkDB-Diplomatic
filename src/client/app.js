(function () {
    'use strict';
    angular
        .module('starterApp',['ngRoute', 'ngCookies', 'ngAnimate', 'angular-md5', 'ngNotify'])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];
    function config($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider
            .when('/about',{
                templateUrl: './app/components/about/about.view.html'
            })
            .when('/home',{
                controller: 'HomeController',
                templateUrl: './app/components/home/home.view.html',
                controllerAs: 'vm'
            })
            .when('/home/dashboard',{
                controller: 'DashboardController',
                templateUrl: './app/components/home/dashboard/dashboard.view.html',
                controllerAs: 'vm'
            })
            .when('/home/account/settings',{
                controller: 'SettingsAccountController',
                templateUrl: './app/components/home/settings/account/account.settings.view.html',
                controllerAs: 'vm'
            })
            .when('/home/groups/settings',{
                controller: 'SettingsGroupsController',
                templateUrl: './app/components/home/settings/groups/groups.settings.view.html',
                controllerAs: 'vm'
            })
            .when('/home/about',{
                controller: 'HomeController',
                templateUrl: './app/components/home/about/about.view.html',
                controllerAs: 'vm'
            })
            .when('/login',{
                controller: 'LoginController',
                templateUrl: './app/components/login/login.view.html',
                controllerAs: 'vm'
            })
            .when('/register',{
                controller: 'RegisterController',
                templateUrl: './app/components/register/register.view.html',
                controllerAs: 'vm'
            }).otherwise({redirectTo: '/home'});
    }

    run.$inject = ['$rootScope', '$location', "$cookies"];
    function run($rootScope, $location, $cookies) {

        if($rootScope.loginCauseError === undefined){
            $rootScope.loginCauseError = {};
        }

        if($rootScope.loginCauseSuccess === undefined){
            $rootScope.loginCauseSuccess = {};
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            const loggedIn = $cookies.get('userCredentials');
            if(loggedIn !== undefined){
                $rootScope.loginStatus = true;
                let restrictedPage = $.inArray($location.path(), ['/register']) !==  -1;
                if(restrictedPage) {
                    $location.path('/home');
                }
            }else{
                // redirect to login page if not logged in and trying to access a restricted page
                const path = $location.path();
                if(path.indexOf('/home') !== -1){
                    $location.path('/login');
                }
            }
        });
    }
})();