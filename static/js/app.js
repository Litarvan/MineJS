var app = angular.module("MineJS",["btford.socket-io"]);

app.factory("userFactory",function(){
	return {
		status: "anonymous",
		username: null,
	}
})

app.factory("socket",function(socketFactory){
	return socketFactory();
});

app.controller("globalController",function($scope){
	$scope.backgroundBlur = true;
});

app.controller("loginController",function($scope,userFactory,socket){
	$scope.loading = false;
	$scope.formError = false;
	$scope.logIn = function(){
		socket.emit("logIn",{username:$scope.username,password:$scope.password});
		socket.once("logIn",function login(data){
			console.log(data);
			if(data.status == "bad")
			{
				$scope.username = data.username;
				$scope.formError = true;
			}
			else
			{
				userFactory.status = "connected";
				userFactory.username = data.username;
			}
		});

		$scope.username = $scope.password = "";
	}
});