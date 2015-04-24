var fs = require('fs');

var server = {
	//Variables
	folder: __dirname+"/../gamefiles/minecraft-server",
	installStatus: -1,

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
	* Run
	* Cette fonction lance le serveur en suivant sa configuration. Si le serveur n'est pas installé (code 2) le serveur ne sera pas démarré
	* Params : none
	* Return : none
	*/
	run: function(){

	},
};

module.exports = function(){
	return server;
};