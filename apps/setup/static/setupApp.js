app.controllerProvider.register("setupAppController",function($scope,$timeout){
	$scope.tab = 1;
	$scope.loading = {
		state: false,
		message: "Patience ... nous installons les lamas",
	}

	$scope.nextStep = function(){
		$scope.tab++;
	};

	$scope.previousStep = function(){
		$scope.tab--;
	};
});

app.controllerProvider.register("createUserSetupAppController",function($scope,socket){

	$scope.createUser = function(){
		if($scope.setupUsername != null && $scope.setupPassword != null && $scope.setupCheckPassword != null)
		{
			if($scope.setupPassword == $scope.setupCheckPassword)
			{
				socket.emit("appSetupRegisterAdmin",{username: $scope.setupUsername, password: $scope.setupCheckPassword});
				socket.once("appSetupRegisterAdmin",function(result){
					if(result.success)
					{
						$scope.nextStep();
					}
					else
					{
						console.warn(result.message);
					}
				})
			}
		}
	}

});

app.controllerProvider.register("installServerSetupAppController",function($scope){
	$scope.slected = null;
	$scope.select = function(id){
		$scope.slected = id;
	};
	$scope.isSelected = function(id){
		if(id == $scope.slected)
		{
			return true;
		}
		else
		{
			return false;
		}
	};
});