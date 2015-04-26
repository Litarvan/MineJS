app.controllerProvider.register("setupAppController",function($scope){
	$scope.tab = 1;

	$scope.nextStep = function(){
		$scope.tab++;
	};

	$scope.previousStep = function(){
		$scope.tab--;
	};
});