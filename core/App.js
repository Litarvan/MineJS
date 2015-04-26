var express = require('../node_modules/express');
var expressApp = express();
var http = require('http').Server(expressApp);
var io = require('../node_modules/socket.io')(http);
var fs = require('fs');
var yaml = require('../node_modules/js-yaml');
var Server = new require("./minecraftServer");

var User = require('./User');

var app = {
	name: "MineJS",
	gameServer: null,
	config: {
		port: 80,
	},

	run: function(){
		console.log("Ecoute ...");
		http.listen(this.config.port);
	},
}

module.exports = function(){
	app.gameServer = new Server();

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
	});

	if(!app.gameServer.run())
	{
		app.gameServer.install("latest",function(){
			app.gameServer.run();
		});
	}

	app.gameServer.event.on("load",function(){
		io.emit("gameServerState",1);
	});

	app.gameServer.event.on("ready",function(){
		io.emit("gameServerState",2);
	});

	app.gameServer.event.on("close",function(){
		io.emit("gameServerState",0);
	});

	return app;
}