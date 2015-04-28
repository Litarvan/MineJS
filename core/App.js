var express = require('../node_modules/express');
var expressApp = express();
var http = require('http').Server(expressApp);
var io = require('../node_modules/socket.io')(http);
var fs = require('fs');
var yaml = require('../node_modules/js-yaml');
var MinecraftServer = require("./MinecraftServer");
var AppManager = require("./AppManager");

var User = require('./User');

module.exports = function(){
	var app = {
		//variables
		name: "MineJS",				//Nom de lapplication (ne sert a rien pour le momment

		gameServer: null,			//Instance de la classe MinecraftServer permettant le fonctionnement d'un serveur

		appManager: null,			//Instance de la classe AppManager gérant le fonctionnement des applications

		config: null,				//Configuration présente dans le fichier config

		/**
		* Status d'installation de MineJS
		*  -1: MineJS installé
		*	0: Aucune installation
		*	1: compte utilisateur créés
		*	2: configuration globale MineJS éfféctuée
		*	3: Serveur minecraft téléchargé
		*	4: Serveur minecraft configuré
		*/
		installState: 0,

		expressApp: expressApp,		//Application Express de l'app

		//Fonctions
		/**
		* Run
		* Lance le serveur sur le port définis
		* Params: none
		* Return: none
		*/
		run: function(){
			console.log("Ecoute ...");
			http.listen(this.config.port);
		},

		/**
		* LoadGameServer
		* Crée des évenements Socket pour informer les utilisateurs de l'etat du serveur
		* Params: none
		* Return: none
		*/
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

		/**
		* CheckInstall
		* Verifie l'état de l'installation de MineJS
		* Params: none
		* Return: none
		*/
		checkInstall: function(){
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
		},

		/**
		* LoadConfig
		* Charge la configuration du serveur ou une configuration par défaut si elle n'existe pas
		* Params: none
		* Return: none
		*/
		loadConfig: function(){
			console.info("Chargement de la configuration");
			var configFile = null;
			try
			{
				configFile = fs.readFileSync(__dirname+"/../config/config.yml");
			}
			catch(e)
			{
				if(e.code == "ENOENT")
				{
					console.warn("Le fichier config.yml n'existe pas, chargement de la configuration par défaut");
					configFile = fs.readFileSync(__dirname+"/defaultConfig/config.yml");
				}
				else
				{
					console.trace(e);
				}
			}

			var config = yaml.safeLoad(configFile);
			this.config = config;
		},

		/**
		* SaveConfig
		* Sauvegarde la configuration actuelle
		* Params: none
		* Return: none
		*/
		saveConfig: function(){

			console.info("Sauvegarde de la configuration");
			var encodedConfig = yaml.safeDump(this.config);
			fs.writeFile(__dirname+"/../config/config.yml",encodedConfig);

		},
	}

	//Constructeur
	app.appManager = new AppManager(app);
	app.loadConfig();

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