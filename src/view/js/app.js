var app = angular.module('starterApp', ['ngRoute', 'ngMessages']);

app.factory('socket', function(){
	var socket = io.connect('http://localhost:3000')
	return socket;
});

app.config(function($routeProvider){
	$routeProvider
		.when('/',{
			templateUrl: './templates/home.html'
		})
		.when('/register',{
			templateUrl: './templates/register.html'
		})
		.when('/login',{
			templateUrl: './templates/login.html'
		});

});

app.controller('syncController',function($scope,$http,socket){
	$scope.syncData = [];
	//getAllData();

	/**
	 * @description fetch the data from rethinkDB and render it
	 */
	 function getAllData(){
	 	$http.get("/sync")
			.then(function(response){
                $scope.syncData = response.data;
		}, function(err){});
	 }

	 	$scope.addNewData = function() {
	 	var data = {"name" : $scope.syncData.name};
	 	var message = {"title" : "", "message" : ""};

		$http.post("/sync",data)
			.then(function(response) {
                $scope.data2Sync = "";
                console.log("new data added");
            }, function(err) {
				console.log("error while adding new data");
			});
     }



  socket.on('changeFeed',function(data){
  	for(var d in data){
  		//do something

  		//render changes on html
  		$scope.$apply();
  	}

  })
});