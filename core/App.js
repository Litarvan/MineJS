var express = require('../node_modules/express');
var expressApp = express();
var http = require('http').Server(expressApp);
var io = require('../node_modules/socket.io')(http);
var fs = require('fs');
var yaml = require('../node_modules/js-yaml');

var MinecraftServer = require("./MinecraftServer");
var AppManager = require("./AppManager");
var User = require('./User');

function exist(path)
{
	try
	{
		fs.accessSync(path);
	}
	catch(e)
	{
		if(e.code != "ENOENT")
		{
			console.trace(e);
		}
		return false;
	}
	return true;
}

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
		*/
		installStep: 0,

		expressApp: expressApp,		//Application Express de l'app

		//Fonctions

		setConfig: function(value){
			this.config = value;
			this.refreshConfig;
		},

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
			app.gameServer.loadConfig();
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

			if(!exist(__dirname+"/../config"))
			{
				fs.mkdir(__dirname+"/../config");
			}

			if(!exist(__dirname+"/../gamefiles"))
			{
				fs.mkdir(__dirname+"/../gamefiles");
			}
			
			if(!exist(__dirname+"/../config/users.yml"))
			{
				this.installStep = 0;
				return 0;
			}
			else if(!exist(__dirname+"/../config/config.yml"))
			{
				this.installStep = 1;
				return 1;
			}
			else if(this.gameServer.getInstallStatusSync() == 3 || this.gameServer.getInstallStatusSync() == 2)
			{
				this.installStep = 2;
				return 2;
			}
			else if(this.gameServer.getInstallStatusSync() == 1)
			{
				this.installStep = 3;
				return 3;
			}
			else
			{
				this.installStep = -1;
				return -1;
			}
		},

		refreshConfig: function(){
			this.gameServer.setFolder(this.config.gameServerFolder);
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
			this.refreshConfig();
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
	app.gameServer = new MinecraftServer();
	app.loadConfig();
	app.checkInstall();
	if(app.installStep != -1)
	{
		console.log("Etat de l'installation : "+app.installStep);
	}

	expressApp.use("/static",express.static("static"));
	expressApp.use("/partials",express.static("core/partials"));

	expressApp.get("/",function(request,response){
		response.sendFile(__dirname+"/partials/index.html");
	});

	io.on("connection",function(socket){
		var user = new User(socket);

		if(app.installStep > -1)
		{
			app.appManager.openApp("setup",user);
		}

		if(app.gameServer != null)
		{
			user.socket.emit("gameServerState",app.gameServer.state);
		}

		user.socket.emit("gameServerPlayerConnect",app.gameServer.onlinePlayers);

		user.socket.on("getDisplayableApps",function(){
			var appsDisplayable = app.appManager.getDisplayableApps();
			user.socket.emit("displayableApps",appsDisplayable);
		});

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
						console.log(user.infos.username+" redémarre le serveur");
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
						console.log(user.infos.username+" lance le serveur");
						app.gameServer.run();
					}
					else if(app.gameServer.state == 2)
					{
						console.log(user.infos.username+" arrete le serveur");
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