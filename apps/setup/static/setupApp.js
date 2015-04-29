app.controllerProvider.register("setupAppController",function($scope,$timeout,socket){
	$scope.tab = 1;
	$scope.welcomeMessage = "Nous evaluons votre configuration ... veillez patienter";
	$scope.firstButtonText = "Patientez";
	$scope.firstTab = 1;
	$scope.loading = {
		state: false,
		message: "Patience ... nous installons les lamas",
	}

	socket.emit("appSetupInstallStep");
	socket.once("appSetupInstallStep",function(step){
		console.log(step);
		switch(step)
		{
			case 0:
				$scope.firstTab = 2;
				$scope.welcomeMessage = "Demarrez maintenan votre installation en cliquant sur le bouton Demarrer l'installation";
				$scope.firstButtonText = "Demarrer l'installation";
			break;
			case 1:
				$scope.firstTab = 3;
				$scope.welcomeMessage = "Vous avez déjà un compte administrateur, configurez MineJS en appuyant sur continuer l'installation";
				$scope.firstButtonText = "Continuer l'installation";
			break;
			case 2:
				$scope.firstTab = 4;
				$scope.welcomeMessage = "Vous avez déjà un compte administrateur et configuré MineJS, installez votre serveur en appuyant sur continuer l'installation";
				$scope.firstButtonText = "Continuer l'installation";
			break;
			case 3:
				$scope.firstTab = 5;
				$scope.welcomeMessage = "Vous avez presque tout fait, configurez votre serveur en appuyant sur continuer l'installation";
				$scope.firstButtonText = "Continuer l'installation";
			break;
		}
	})

	$scope.goFirstStep = function(){
		$scope.tab = $scope.firstTab;
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

app.controllerProvider.register("configAppSetupAppController",function($scope,socket){
	socket.emit("appSetupGetAppConfig");
	socket.once("appSetupGetAppConfig",function(config){
		$scope.port = config.port;
		$scope.installFolder = config.gameServerFolder;
	});

	$scope.configApp = function(){
		socket.emit("appSetupAppConfig",{port: $scope.port, gameServerFolder: $scope.installFolder});
		socket.once("appSetupAppConfig",function(result){
			if(result.success)
			{
				$scope.nextStep();
			}
		});
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