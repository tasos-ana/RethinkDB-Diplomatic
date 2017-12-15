(function () {
    'use strict';
    angular
        .module('starterApp',['ngRoute', 'ngMessages', 'ngCookies','validation.match','angular-md5'])
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
            .when('/login',{
                controller: 'LoginController',
                templateUrl: './app/components/login/login.view.html',
                controllerAs: 'vm'
            })
            .when('/register',{
                controller: 'RegisterController',
                templateUrl: './app/components/register/register.view.html',
                controllerAs: 'vm'
            }).otherwise({redirectTo: '/login'});
    }

    run.$inject = ['$rootScope', '$location', "$cookies"];
    function run($rootScope, $location, $cookies) {

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            $rootScope.pageName = $location.path().split('/')[1];
            const loggedIn = $cookies.get('userCredentials');
            if(loggedIn !== undefined){
                $rootScope.loginStatus = true;
                let restrictedPage = $.inArray($location.path(), ['/register']) !==  -1;
                if(restrictedPage) {
                    $location.path('/home');
                }
            }else{
                // redirect to login page if not logged in and trying to access a restricted page
                let restrictedPage = $.inArray($location.path(), ['/home']) !==  -1;
                if(restrictedPage) {
                    $location.path('/login');
                }
            }
        });
    }
})();