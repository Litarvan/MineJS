var fs = require('fs');
var cp = require('child_process');
var events = require('events');

var server = {
	//Variables
	folder: __dirname+"/../gamefiles/minecraft-server",
	serverFile: null,
	serverProcess: null,
	installStatus: -1,
	ram: 1024,
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
	advacedEventDispacher: function(){
		this.event.on("logInfo",function(message){
			if(message.search(/Done \(.*\)! For help, type .*/i) != -1)
			{
				this.event.emit("ready");
			}
			else if(message.search(/(.*) joined the game/i) != -1)
			{
				var playerName = message.replace(/(.*) joined the game/i,"$1");
				playerName = playerName.slice(0, playerName.length - 1);
				this.event.emit("playerConnect",playerName);
			}
			else if(message.search(/(.*) left the game/i) != -1)
			{
				var playerName = message.replace(/(.*) left the game/i,"$1");
				playerName = playerName.slice(0, playerName.length - 1);
				this.event.emit("playerDisconnect",playerName);
			}
		}.bind(this));
	},

	/**
	* Run
	* Cette fonction lance le serveur en suivant sa configuration. Si le serveur n'est pas installé (code 2) le serveur ne sera pas démarré
	* Params : none
	* Return : none
	*/
	run: function(){
		this.getInstallStatus(function(){
			if(this.installStatus <= 1 && this.installStatus >= 0 )
			{
				this.advacedEventDispacher();

				this.serverProcess = cp.spawn("java",["-Xmx"+this.ram+"M","-Xms"+this.ram+"M","-jar",this.serverFile,"nogui"],{cwd:this.folder});

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
					//Serveur etein
				});

			}
			else
			{
				console.error("Le serveur n'est pas installé correctement code : "+this.installStatus);
			}
		}.bind(this));
	},
};

module.exports = function(){
	return server;
};