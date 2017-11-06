(function () {
    'use strict';
    angular
        .module('starterApp',['ngMaterial','ngMessages','ngRoute','ngCookies'])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];
    function config($routeProvider, $locationProvider) {
        $locationProvider.html5Mode({enabled:true})
        $routeProvider
            .when('/',{
                controller: 'HomeController',
                templateUrl: './home/home.view.html',
                controllerAs: 'vm'
            })
            .when('/login',{
                controller: 'LoginController',
                templateUrl: './login/login.view.html',
                controllerAs: 'vm'
            })
            .when('/register',{
                controller: 'RegisterController',
                templateUrl: './register/register.view.html',
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
            var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }
        });
    }
})();




// var app = angular.module('starterApp', ['ngMaterial','ngRoute', 'ngMessages']);
//
// app.factory('socket', function(){
// 	var socket = io.connect('http://localhost:3000')
// 	return socket;
// });
//
// app.config(
// 	function($locationProvider,$routeProvider){
// 		$locationProvider.html5Mode({enabled:true})
// 		$routeProvider
// 			.when('/',{
// 				templateUrl: './templates/home.html'
// 			})
// 			.when('/register',{
// 				templateUrl: './templates/register/register.html'
// 			})
// 			.when('/login',{
// 				templateUrl: './templates/login.html'
// 			}).
// 			otherwise({
// 				template: "Not Found"
// 		})
// 	});
//
// app.controller('syncController',function($scope,$http,socket){
// 	$scope.syncData = [];
// 	//getAllData();
//
// 	/**
// 	 * @description fetch the data from rethinkDB and render it
// 	 */
// 	 function getAllData(){
// 	 	$http.get("/sync")
// 			.then(function(response){
//                 $scope.syncData = response.data;
// 		}, function(err){});
// 	 }
//
// 	 	$scope.addNewData = function() {
// 	 	var data = {"name" : $scope.syncData.name};
// 	 	var message = {"title" : "", "message" : ""};
//
// 		$http.post("/sync",data)
// 			.then(function(response) {
//                 $scope.data2Sync = "";
//                 console.log("new data added");
//             }, function(err) {
// 				console.log("error while adding new data");
// 			});
//      }
//
//
//
//   socket.on('changeFeed',function(data){
//   	for(var d in data){
//   		//do something
//
//   		//render changes on html
//   		$scope.$apply();
//   	}
//
//   })
// });
