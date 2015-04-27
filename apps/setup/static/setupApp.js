app.controllerProvider.register("setupAppController",function($scope,$timeout,socket){
	$scope.tab = 1;
	$scope.loading = {
		state: false,
		message: "Patience ... nous installons les lamas",
	}

	$scope.finish = function(){
		socket.emit("appSetupFinish");
	};

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

app.controllerProvider.register("installServerSetupAppController",function($scope,socket){

	$scope.selected = null;

	$scope.select = function(id){
		$scope.selected = id;
	};

	$scope.isSelected = function(id){
		if(id == $scope.selected)
		{
			return true;
		}
		else
		{
			return false;
		}
	};

	$scope.installServer = function(){
		if($scope.selected != null)
		{
			$scope.loading.state = true;
			$scope.loading.message = "Nous installons votre serveur";

			socket.emit("appSetupInstallServer",$scope.selected);

			socket.once("appSetupInstallServer",function(result){
				$scope.loading.state = false;
				if(result.success)
				{
					$scope.nextStep();
				}
				else
				{
					console.warn(result.message);
				}
			});
		}
	}
});