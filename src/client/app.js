(function () {
    'use strict';
    angular
        .module('starterApp',['ngMaterial','ngRoute','ngCookies','ngMessages','validation.match'])
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
            .when('/home',{
                templateUrl: './app/components/home/home.view.html'
            })
            .when('/about',{
                templateUrl: './app/components/about/about.view.html'
            })
            .when('/dashboard',{
                controller: 'DashboardController',
                templateUrl: './app/components/dashboard/dashboard.view.html',
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

        /*
            Show dialog function
         */
        $rootScope.showAlert = function(ev,title,content,aria,ok) {
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title(title)
                    .textContent(content)
                    .ariaLabel(aria)
                    .ok(ok)
                    .targetEvent(ev)
            );
        };


        $rootScope.loginStatus = false;

        // keep user logged in after page refresh
        $rootScope.globals = $cookies.getObject('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            $rootScope.pageName = $location.path().split('/')[1];
            var loggedIn = $rootScope.globals.currentUser;
            if(loggedIn){
                var restrictedPage = $.inArray($location.path(), ['/home','/register']) !==  -1;
                if(restrictedPage) {
                    $rootScope.loginStatus = true;
                    $location.path('/dashboard');
                }
            }else{
                // redirect to login page if not logged in and trying to access a restricted page
                var restrictedPage = $.inArray($location.path(), ['/dashboard']) !==  -1;
                if(restrictedPage) {
                    $location.path('/login');
                }
            }
        });
    }
})();