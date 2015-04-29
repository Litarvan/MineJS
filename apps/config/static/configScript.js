app.controllerProvider.register("configAppController",function($scope,socket){
	$scope.tab = 1;
	$scope.saved = false;
	socket.emit("appConfigGetConfig");
	socket.once("appConfigGetConfig",function(config){
		$scope.config = config;
		$scope.config["max-players"] = parseInt(config["max-players"],10);
		$scope.config["max-build-height"] = parseInt(config["max-build-height"],10);
		$scope.config["server-port"] = parseInt(config["server-port"],10);
		$scope.config["player-idle-timeout"] = parseInt(config["player-idle-timeout"],10);
		$scope.config["view-distance"] = parseInt(config["view-distance"],10);
		$scope.config["max-world-size"] = parseInt(config["max-world-size"],10);
		$scope.config["max-tick-time"] = parseInt(config["max-tick-time"],10);
	});
	$scope.save = function(){
		socket.emit("appConfigSave",$scope.config);
		socket.once("appConfigSave",function(result){
			if(result.success)
			{
				$scope.saved = true;
			}
		});
	};
});