var fs = require('fs');
var cp = require('child_process');
var events = require('events');
var https = require('https');

var server = {
	//Variables
	folder: __dirname+"/../gamefiles/minecraft-server",
	serverFile: null,
	serverProcess: null,
	installStatus: -1,
	ram: 1024,
	eula: false,
	version: 0,
	state:0,
	onlinePlayers: [],
	event: new events.EventEmitter(),

	//functions

	/**
	* GetInstallStatus
	* Cette fonction renvoie un code de status pour decrir l'etat du serveur minecraft installé
	* Codes:
	*  -1 : Veuillez demarrer une détéction pour actualiser le code
	*	0 : Le serveur est pret
	*	1 : Le serveur minecraft est installé mais la configuration est manquante
	*	2 : Le serveur n'est pas installé
	*	3 : Le dossier n'existe pas
	* Params : callback(int)
	* Return : none
	*/
	getInstallStatus: function(callback){
		fs.readdir(this.folder,function(err,files){
			if(err)
			{
				this.installStatus = 3;
				callback(3);
			}
			else
			{
				for(var i = 0,config = -1,executable = -1; i < files.length; i++)
				{
					if(executable == -1)
					{
						executable = files[i].search(/minecraft_server(.*).(exe|jar)/i);
						this.serverFile = files[i];
					}

					if(config == -1)
					{
						config = files[i].search(/server.properties/i);
					}
				}

				if(executable == -1)
				{
					this.installStatus = 2;
					callback(2);
				}
				else if(config == -1)
				{
					this.installStatus = 1;
					callback(1);
				}
				else
				{
					this.installStatus = 0;
					callback(0);
				}
			}
		}.bind(this));
	},

	/**
	* GetAvaliableVersions
	* Cette fonction cherche sur le serveur officiel la liste des version RELASE de serveur minecraft
	* Params:
	*	callback: function(array)
	* Return: none
	*/
	getAvaliableVersions: function(callback)
	{
		https.get("https://s3.amazonaws.com/Minecraft.Download/versions/versions.json",function(response){

			var dataSpam = "";

			response.on("data",function(chunk){
				dataSpam += chunk;
			});

			response.on("end",function(){
				var avaliableVersions = [];
				var datas = JSON.parse(dataSpam);
				for(var i = 0; i < datas.versions.length; i++)
				{
					if(datas.versions[i].type == "release")
					{
						avaliableVersions.push(datas.versions[i].id);
					}
				}
				callback(avaliableVersions);
			});

		})
	},

	/**
	* Install
	* Cette fonction permet d'installer le serveur minecraft de version donné en arguments.Le code de resultat sera retourné
	* Codes:
	*	100 : le serveur a été correctement installé
	*	101 : le serveur était déjà installé
	* Params:
	*	version: string
	*	callback: function(int)
	* Return: none
	* 
	*/
	install: function(version,callback){

		this.getInstallStatus(function(){

			if(this.installStatus == 0 )
			{
				callback(101);
				return;
			}

			if(this.installStatus == 1)
			{
				this.generateConfig(function(){
					callback(100);
					return;
				});
			}
			
			if(this.installStatus == 3)
			{
				fs.mkdirSync(this.folder);
			}
			
			if(this.installStatus <= 3)
			{
				this.downloadServer(version,function(code){
					this.generateConfig(function(){
						if(code == 200)
						{
							callback(100);
						}
						else
						{
							callback(code);
						}
						return;
					});
				}.bind(this));
			}

		}.bind(this));
	},

	generateConfig: function(callback){
		this.event.once("ready",function(){
			this.stop();
			callback();
		}.bind(this));
		this.setEula(true);
		this.run();
	},

	setEula: function(state){
		this.eula = state;
		if(fs.existsSync(this.folder+"/eula.txt"))
		{
			fs.unlinkSync(this.folder+"/eula.txt");
		}
		fs.writeFileSync(this.folder+"/eula.txt","eula="+state);
	},

	/**
	* downloadServer
	* Cette fonction télécharge le serveur de version donnée
	* Codes:
	*	200 : le serveur s'est téléchargé
	*	201 : le numero de version est invalide
	*	203 : le serveur est déja présent dans les dossiers
	*	204 : erreur de connexion pour le téléchargement
	* Params:
	*	version: string
	*	callback: function(int)
	* Return: none
	*/
	downloadServer: function(version,callback){

		this.getAvaliableVersions(function(versions){

			for(var i = 0,finded = false; i<versions.length; i++)
			{
				if(versions[i] == version || version == "latest")
				{
					finded = true;
					this.version = versions[i];
					var fileStream = fs.createWriteStream(this.folder+"/minecraft_server."+this.version+".jar");
					https.get("https://s3.amazonaws.com/Minecraft.Download/versions/"+this.version+"/minecraft_server."+this.version+".jar",function(response){
						if(response.statusCode == 200)
						{
							response.pipe(fileStream);	
						}
						else
						{
							callback(204);
							return;
						}

						response.on("end",function(){
							callback(200);
						});
					});
					break;
				}
			}

			if(!finded)
			{
				callback(201);
			}

		}.bind(this));

	},

	/**
	* AnalyzeLine
	* Cette fonction analyse une lique de LOG pour en ressortir un tableau contenant le code et le messaage
	* Params:
	*	line: string
	* Return: Array
	*/
	analyzeLine: function(line){
		line = line.replace(/\[..\:..\:..\] \[.*\/(.*)\].*: (.*)/i,"$1#$2");
		line = line.slice(0, line.length - 1);
		line = line.split("#");
		if(line.length > 1)
		{
			return line;
		}
		else
		{
			return ["",""];
		}
	},

	/**
	* EventDisplacher
	* Cette fonction analyse le code du LOG et emmet un evenement adequat basique
	* Params:
	*	dataLine: Array
	* Return: none
	*/

	eventDispacher: function(dataLine){
		this.event.emit("log",dataLine[1]);
		switch(dataLine[0])
		{
			case "INFO":
				this.event.emit("logInfo",dataLine[1]);
			break;
			case "WARN":
				this.event.emit("logWarning",dataLine[1]);
			break;
			case "ERROR":
				this.event.emit("logError",dataLine[1]);
			break;
			default:
				this.event.emit("logOther",dataLine[1]);
			break;
		}
	},

	/**
	* AdvancedEventDispacher
	* Cette fonction declasre des istener pour produir des evenements plus avancés
	* Params : none
	* Return : none
	*/
	advancedEventDispacher: function(){
		this.event.on("logInfo",function(message){
			if(message.search(/Done \(.*\)! For help, type .*/i) != -1)
			{
				this.event.emit("ready");
			}
			else if(message.search(/(.*) joined the game/i) != -1)
			{
				var playerName = message.replace(/(.*) joined the game/i,"$1");
				playerName = playerName.slice(0, playerName.length - 1);
				this.onlinePlayers.push(playerName);
				this.event.emit("playerConnect",playerName);
			}
			else if(message.search(/(.*) left the game/i) != -1)
			{
				var playerName = message.replace(/(.*) left the game/i,"$1");
				playerName = playerName.slice(0, playerName.length - 1);
				this.onlinePlayers.splice(this.onlinePlayers.indexOf(playerName),1);
				this.event.emit("playerDisconnect",playerName);
			}
		}.bind(this));

		this.event.on("load",function(message){
			this.state = 1;
		}.bind(this));

		this.event.on("ready",function(message){
			this.state = 2
		}.bind(this));

		this.event.on("close",function(message){
			this.onlinePlayers = [];
			this.state = 0;
		}.bind(this));
	},

	/**
	* Run
	* Cette fonction lance le serveur en suivant sa configuration. Si le serveur n'est pas installé (code 2) le serveur ne sera pas démarré
	* Params : none
	* Return : 
	*	true : pas d'erreur
	*	false: le serveur n'est pas installé
	*/
	run: function(){
		this.getInstallStatus(function(){
			if(this.installStatus <= 1 && this.installStatus >= 0 )
			{

				this.serverProcess = cp.spawn("java",["-Xmx"+this.ram+"M","-Xms"+this.ram+"M","-jar",this.serverFile,"nogui"],{cwd:this.folder});
				this.event.emit("load");

				this.serverProcess.stdout.setEncoding("UTF-8");
				var line = "";
				this.serverProcess.stdout.on("data",function(data){
					line += data;
					if(data.search(/\n/i) != -1)
					{
						this.eventDispacher(this.analyzeLine(line));
						line = "";
					}
				}.bind(this));

				this.serverProcess.on("close",function(code){
					this.event.emit("close");
				}.bind(this));

				return true;

			}
			else
			{
				return false;
			}
		}.bind(this));
	},

	/**
	* SendCommand
	* Cette fonction envoie la commande en parametres au serveur. inutile de mettre un retour a la ligne
	* Params :
	*	command: string
	* Return : none
	*/
	sendCommand: function(command){
		this.serverProcess.stdin.write(command+"\n","UTF-8");
	},

	/**
	* Stop
	* Cette fonction arrete le serveur
	* Params : none
	* Return : none
	*/
	stop: function(){
		this.sendCommand("stop");
	},

	/**
	* Restart
	* Cette fonction relance le serveur
	* Params : none
	* Return : none
	*/
	restart: function(){
		this.sendCommand("stop");
		this.serverProcess.on("close",function(code){
			this.run();
		}.bind(this));
	},
};

module.exports = function(){
	server.advancedEventDispacher();
	return server;
};