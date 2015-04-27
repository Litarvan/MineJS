var express = require('../node_modules/express');
var expressApp = express();
var http = require('http').Server(expressApp);
var io = require('../node_modules/socket.io')(http);
var fs = require('fs');
var yaml = require('../node_modules/js-yaml');
var MinecraftServer = require("./MinecraftServer");
var AppManager = require("./AppManager");

var User = require('./User');

var app = {
	name: "MineJS",
	gameServer: null,
	appManager: null,
	config: {
		port: 80,
	},
	isInstalled: false,
	expressApp: expressApp,

	run: function(){
		console.log("Ecoute ...");
		http.listen(this.config.port);
	},

	loadGameServer: function(){
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
	},
}

module.exports = function(){
	app.appManager = new AppManager(app);

	if(fs.existsSync(__dirname+"/../config/users.yml"))
	{
		if(typeof yaml.safeLoad(fs.readFileSync('./config/users.yml', 'utf8')) != "object")
		{
			app.isInstalled = false;
		}
		else
		{
			app.isInstalled = true;
			app.gameServer = new MinecraftServer();
		}
	}
	else
	{
		app.isInstalled = false;
	}

	expressApp.use("/static",express.static("static"));
	expressApp.use("/partials",express.static("core/partials"));

	expressApp.get("/",function(request,response){
		response.sendFile(__dirname+"/partials/index.html");
	});

	io.on("connection",function(socket){
		var user = new User(socket);

		if(!app.isInstalled)
		{
			app.appManager.openApp("setup",user);
		}

		if(app.gameServer != null)
		{
			user.socket.emit("gameServerState",app.gameServer.state);
		}

		user.socket.on("sendCommand",function(command){
			if(user.trusted)
			{
				if(app.gameServer != null)
				{
					app.gameServer.sendCommand(command);
				}
				else
				{
					user.socket.emit("notif",{type:"error",message:"Aucun serveur n'est installé"});
				}
			}
			else
			{
				user.socket.emit("notif",{type:"error",message:"Vous devez d'abort vous connecter"});
			}
		});

		user.socket.on("gameServerReload",function(){

			if(user.trusted)
			{
				if(app.gameServer != null)
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
					user.socket.emit("notif",{type:"error",message:"Aucun serveur n'est installé"});
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
				if(app.gameServer != null)
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
					user.socket.emit("notif",{type:"error",message:"Aucun serveur n'est installé"});
				}
			}
			else
			{
				user.socket.emit("notif",{type:"error",message:"Vous devez d'abort vous connecter"});
			}
		});

		user.socket.on("openApp",function(id){
			app.appManager.openApp(id,user);
		});

		user.socket.on("closeApp",function(){
			app.appManager.closeApp(user);
		});
	});

	if(app.gameServer != null)
	{
		app.loadGameServer();
	}

	return app;
}