var fs = require("fs");
var express = require("../node_modules/express");

var appManager = {
	app: null,				//L'application du serveur
	appsAvaliable: {},		//Les apps disponibles
	//fonctions
	searchApps: function(){
		try
		{
			var appDir = fs.readdirSync(__dirname+"/../apps");
			for(var i = 0; i<appDir.length; i++)
			{
				if(fs.existsSync(__dirname+"/../apps/"+appDir[i]+"/"+appDir[i]+".js"))
				{
					this.appsAvaliable[appDir[i]] = new require(__dirname+"/../apps/"+appDir[i]+"/"+appDir[i])(this);
				}
				else
				{
					console.error("L'application "+appDir[i]+" n'a pas été chargée car elle ne correspond pas au schema d'une application MineJS");
				}
			}
		}
		catch(e)
		{
			console.trace(e);
		}
	},

	initApps: function(){
		for(var app in this.appsAvaliable)
		{
			this.app.expressApp.use("/app/"+app,express.static(__dirname+"/../apps/"+app+"/static"));
			console.log("url : /app/"+app+"Mene vers "+__dirname+"../apps/"+app+"/static");
			this.appsAvaliable[app].onLoad();
		}
	},
}

module.exports = function(app){
	appManager.app = app;
	appManager.searchApps();
	appManager.initApps();
	return appManager;
}