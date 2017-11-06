var app = angular.module('starterApp', ['ngRoute', 'ngMessages']);

app.factory('socket', function(){
	var socket = io.connect('http://localhost:3000')
	return socket;
});

app.config(function($routeProvider){
	$routeProvider
		.when('/',{
			templateUrl: 'home.html'
		})
		.when('/register',{
			templateUrl: 'register.html'
		})
		.when('/login',{
			templateUrl: 'login.html'
		});

});

app.controller('syncController',function($scope,$http,socket){
	$scope.syncData = [];
	getAllData();

	/**
	 * @description fetch the data from rethinkDB and render it
	 */
	 function getAllData(){
	 	$http.get("/sync")
			.then(function(response){
                $scope.syncData = response.data;
		}, function(err){});
	 }

	 // $$scope.updateVote = function(index) {
  //   var data = {
  //     "id" : $scope.pollData[index].id,
  //     "option" : $scope.pollData[index].selected
  //   };
  //   $http.put("/polls",data).success(function(response) {
  //     if(response.responseCode === 0) {
  //       $scope.hiddenrows.push(index);
  //     } else {
  //       console.log("error");
  //     }
  //   });
  // }



  socket.on('changeFeed',function(data){
  	for(var d in data){
  		//do something

  		//render changes on html
  		$scope.$apply();
  	}

  })
});