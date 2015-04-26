var app = angular.module("MineJS",["btford.socket-io"]);

app.factory("userFactory",function(){
	return {
		status: "anonymous",
		username: null,
	}
})

app.factory("graphicalFactory",function(){
	return {
		backgroundBlur: false,
	}
});

app.factory("barMenuFactory",function(){
	return {
		server: false,
		players: false,
		command: false,
	};
})

app.factory("socket",function(socketFactory){
	return socketFactory();
});

app.factory("serverStateFactory",function(){
	return [
		{icon:"x",info:"Hors ligne"},
		{icon:"loop",info:"Démarrage"},
		{icon:"check",info:"En ligne"},
		{icon:"minus",info:"Inconnu"},
	]
});

app.factory("onlinePlayersFactory",function(){
	return [];
});

app.controller("globalController",function($scope,socket,graphicalFactory){
	socket.emit("openApp","setup");
	$scope.backgroundBlur = function(){
		return graphicalFactory.backgroundBlur;
	}

	socket.on("notif",function(alert){
		console.log(alert);
	});
});

app.controller("loginController",function($scope,userFactory,socket,graphicalFactory){

	function boxOut(){
		var container = jQuery('#login-form');
		var title = container.find("h1");
		var box = container.find(".logBox");

		var timeline = new TimelineMax();
		timeline.to(box,0.2,{opacity:0,scale:0.5,boxShadow:"0 0 0 black"});
		timeline.to(title,0.5,{y: 100,scale:1.5},"-=0.1");
		timeline.to(title,0.5,{opacity:0},"+=3");
		timeline.to(container,0,{display:"none"});
	};

	graphicalFactory.backgroundBlur = true;
	$scope.loading = false;
	$scope.formError = false;
	$scope.isLogged = false;

	$scope.logIn = function(){
		socket.emit("logIn",{username:$scope.username,password:$scope.password});
		socket.once("logIn",function login(data){
			console.log(data);
			if(data.status == "bad")
			{
				$scope.username = data.username;
				$scope.password = "";
				$scope.formError = true;
			}
			else
			{
				userFactory.status = "connected";
				userFactory.username = data.username;
				$scope.isLogged = true;
				graphicalFactory.backgroundBlur = false;
				boxOut();
			}
		});
	}
});

app.controller("controlBarController",function($scope,barMenuFactory,serverStateFactory,socket,onlinePlayersFactory){
	$scope.hideBar = false;
	$scope.serverState = serverStateFactory[3];

	socket.on("gameServerState",function(state){
		$scope.serverState = serverStateFactory[state];
	});

	$scope.isShowMenu = function(name){
		return barMenuFactory[name];
	}

	$scope.toggleMenu = function(name){
		if(barMenuFactory[name])
		{
			barMenuFactory[name] = false;
		}
		else
		{
			barMenuFactory[name] = true;
		}
	}

	$scope.getOnlinePlayers = function(){
		return onlinePlayersFactory;
	};

	socket.on("gameServerPlayerConnect",function(players){
		onlinePlayersFactory = players;
	});

	socket.on("gameServerPlayerDisconnect",function(players){
		onlinePlayersFactory = players;
	});

});

app.controller("menuCommandController",function($scope,socket){
	$scope.sendCommand = function(){
		if($scope.command != "" && $scope.command != null)
		{
			socket.emit("sendCommand",$scope.command);
			$scope.command = "";
		}
	};
});

app.controller("menuServerController",function($scope,socket){

	$scope.toggle = function(){
		console.log("toggle");
		socket.emit("gameServerToggle");
	}

	$scope.reload = function(){
		console.log("restart");
		socket.emit("gameServerReload");
	}
});