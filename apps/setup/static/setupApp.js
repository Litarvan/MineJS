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

app.controllerProvider.register("setupBigSelector",function($scope){
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