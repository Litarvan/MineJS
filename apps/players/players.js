var Application = require(__dirname+'/../../core/Application');


module.exports = function(appManager){
	var playersApp = new Application(appManager);

	playersApp.id = "players";
	playersApp.name = "Joueurs";
	playersApp.description = "Permet de configurer l'acces au serveur des joueurs";

	playersApp.style.primaryColor = "#FF8023";

	playersApp.icon = "torso.svg";

	playersApp.html = "playerIndex.html";
	playersApp.css = "playersStyle.css";
	playersApp.script = "playersScript.js";

	playersApp.onOpen = function(user){
	}

	playersApp.onClose = function(user){
	}

	return playersApp;
}