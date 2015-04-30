app.controllerProvider.register("playersAppController",function($scope,socket){
	$scope.tab = 1;
});

app.controllerProvider.register("onlinePlayersAppController",function($scope,socket){
	$scope.playerSelected = null;

	$scope.select = function(player){
		$scope.playerSelected = player;
	}

	$scope.isSelected = function(player)
	{
		if(player == $scope.playerSelected)
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	$scope.kill = function(player)
	{
		$scope.serverCommand("kill "+player);
	}

	$scope.kick = function(player)
	{
		$scope.serverCommand("kick "+player);
	}

	$scope.ban = function(player)
	{
		$scope.serverCommand("ban "+player);
	}
});