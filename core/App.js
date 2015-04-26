var express = require('../node_modules/express');
var expressApp = express();
var http = require('http').Server(expressApp);
var io = require('../node_modules/socket.io')(http);
var fs = require('fs');
var yaml = require('../node_modules/js-yaml');
var Server = require("./minecraftServer");
var AppManager = require("./AppManager");

var User = require('./User');

var app = {
	name: "MineJS",
	gameServer: null,
	appManager: null,
	config: {
		port: 80,
	},
	expressApp: expressApp,

	run: function(){
		console.log("Ecoute ...");
		http.listen(this.config.port);
	},
}

module.exports = function(){
	app.gameServer = new Server();
	app.appManager = new AppManager(app);

	expressApp.use("/static",express.static("static"));
	expressApp.use("/partials",express.static("core/partials"));

	expressApp.get("/",function(request,response){
		response.sendFile(__dirname+"/partials/index.html");
	});

	io.on("connection",function(socket){
		var user = new User(socket);

		user.socket.emit("gameServerState",app.gameServer.state);

		user.socket.on("sendCommand",function(command){
			if(user.trusted)
			{
				app.gameServer.sendCommand(command);
			}
			else
			{
				user.socket.emit("notif",{type:"error",message:"Vous devez d'abort vous connecter"});
			}
		});

		user.socket.on("gameServerReload",function(){

			if(user.trusted)
			{
				if(app.gameServer.state == 2)
				{
					console.log(user.username+" redémarre le serveur");
					app.gameServer.restart();
				}
				else
				{
					user.socket.emit("notif",{type:"error",message:"Le serveur n'est pas en ligne"});
				}
			}
			else
			{
				user.socket.emit("notif",{type:"error",message:"Vous devez d'abort vous connecter"});
			}
		});

		user.socket.on("gameServerToggle",function(){
			if(user.trusted)
			{
				if(app.gameServer.state == 0)
				{
					console.log(user.username+" lance le serveur");
					app.gameServer.run();
				}
				else if(app.gameServer.state == 2)
				{
					console.log(user.username+" arrete le serveur");
					app.gameServer.stop();
				}
				else
				{
					user.socket.emit("notif",{type:"error",message:"Le serveur se démarre"});
				}
			}
			else
			{
				user.socket.emit("notif",{type:"error",message:"Vous devez d'abort vous connecter"});
			}
		});

		user.socket.on("openApp",function(id){
			if(typeof app.appManager.appsAvaliable[id] != "undefined")
			{
				if((app.appManager.appsAvaliable[id].needLogIn && user.trusted) || !app.appManager.appsAvaliable[id].needLogIn)
				{
					if(user.activeApp == null)
					{
						user.socket.emit("openApp",app.appManager.appsAvaliable[id].getInfos());
						user.activeApp = app.appManager.appsAvaliable[id];
						user.activeApp.onOpen(user);
					}
					else
					{
						user.socket.emit("notif",{type:"error",message:"Fermez tout d'abort l'application "+id});
					}
				}
				else
				{
					user.socket.emit("notif",{type:"error",message:"Vous devez vous connecter pour ouvrir l'application "+user.activeApp.id});
				}
			}
			else
			{
				user.socket.emit("notif",{type:"error",message:"L'application "+id+" n'existe pas"});
			}
		});

		user.socket.on("closeApp",function(){
			user.socket.emit("notif",{type:"info",message:"fermeture de l'app"});
			user.socket.emit("closeApp");
			user.activeApp = null;
		});
	});

	/*if(!app.gameServer.run())
	{
		app.gameServer.install("latest",function(){
			app.gameServer.run();
		});
	}*/

	app.gameServer.event.on("load",function(){
		io.emit("gameServerState",1);
	});

	app.gameServer.event.on("ready",function(){
		io.emit("gameServerState",2);
	});

	app.gameServer.event.on("close",function(){
		io.emit("gameServerState",0);
	});

	app.gameServer.event.on("playerConnect",function(){
		io.emit("gameServerPlayerConnect",app.gameServer.onlinePlayers);
	});

	app.gameServer.event.on("playerDisconnect",function(){
		io.emit("gameServerPlayerDisconnect",app.gameServer.onlinePlayers);
	});

	return app;
}