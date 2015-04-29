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
			this.appsAvaliable[app].onLoad();
		}
	},

	openApp: function(id,user){
		if(typeof this.appsAvaliable[id] != "undefined")
			{
				if((this.appsAvaliable[id].needLogIn && user.trusted) || !this.appsAvaliable[id].needLogIn)
				{
					if(user.activeApp == null)
					{
						user.activeApp = this.appsAvaliable[id];
						user.activeApp.onOpen(user);
						user.socket.emit("openApp",this.appsAvaliable[id].getInfos());
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
	},

	closeApp: function(user){
			user.socket.emit("notif",{type:"info",message:"fermeture de l'app"});
			user.activeApp.onClose(user);
			user.socket.emit("closeApp");
			user.activeApp = null;

	},

	getDisplayableApps: function(){
		var apps = [];
		var appsId = Object.keys(this.appsAvaliable);
		for(var i = 0; i<appsId.length; i++)
		{
			if(this.appsAvaliable[appsId[i]].showIcon == true)
			{
				apps.push(this.appsAvaliable[appsId[i]].getInfos());
			}
		}
		return apps;
	}
}

module.exports = function(app){
	appManager.app = app;
	appManager.searchApps();
	appManager.initApps();
	return appManager;
}