(function () {
    'use strict';
    angular
        .module('starterApp',['ngRoute', 'ngCookies', 'ngAnimate', 'ngNotify', 'monospaced.elastic', 'ngFileSaver' ,'ui.gravatar'])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider', 'gravatarServiceProvider'];
    function config($routeProvider, $locationProvider, gravatarServiceProvider) {
        gravatarServiceProvider.defaults ={
            size        : 50,
            // "default"   : 'retro'
            // "default"   : 'identicon'
            default         : 'robohash'
        };

        String.prototype.shuffle = function () {
            var a = this.split(""),
                n = a.length;

            for(var i = n - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = a[i];
                a[i] = a[j];
                a[j] = tmp;
            }
            return a.join("");
        };

        $locationProvider.html5Mode(true);
        $routeProvider
            .when('/',{
                templateUrl: './app/components/welcome/welcome.view.html'
            })
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
            .when('/login',{
                controller: 'LoginController',
                templateUrl: './app/components/login/login.view.html',
                controllerAs: 'vm'
            })
            .when('/signup',{
                controller: 'SignupController',
                templateUrl: './app/components/signup/signup.view.html',
                controllerAs: 'vm'
            }).otherwise({redirectTo: '/'});
    }

    run.$inject = ['$rootScope', '$location', "$cookies"];
    function run($rootScope, $location, $cookies) {

        //Define struct that used when navigated to login page cause of error
        if($rootScope.loginCauseError === undefined){
            $rootScope.loginCauseError = {};
        }
        //Define struct that used when navigated to login page cause of success, like register
        if($rootScope.loginCauseSuccess === undefined){
            $rootScope.loginCauseSuccess = {};
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            const loggedIn = $cookies.get('userCredentials');
            if(loggedIn !== undefined){
                $rootScope.loginStatus = true;
                //if user having cookie we navigate him to home if he is trying to access register page
                let restrictedPage = $.inArray($location.path(), ['/signup']) !==  -1;
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