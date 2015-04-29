var Application = require(__dirname+'/../../core/Application');


module.exports = function(appManager){
	var config = new Application(appManager);

	config.id = "config";
	config.name = "Config";
	config.description = "Permet de configurer votre serveur minecraft";

	config.style.primaryColor = "#0096FF";

	config.icon = "wrench.svg";

	config.html = "configIndex.html";
	config.css = null;
	config.script = "configScript.js";

	config.onOpen = function(user){
		user.socket.on("appConfigGetConfig",function(){
			config.appManager.app.gameServer.loadConfig();
			user.socket.emit("appConfigGetConfig",config.appManager.app.gameServer.config);
		});

		user.socket.on("appConfigSave",function(newConfig){
			config.appManager.app.gameServer.config = newConfig;
			config.appManager.app.gameServer.saveConfig();
			user.socket.emit("appConfigSave",{success:true});
		});
	}

	config.onClose = function(user){
		user.socket.removeAllListeners("appConfigGetConfig");
	}

	return config;
}