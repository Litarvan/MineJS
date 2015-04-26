var application = {
	//Fonctions coté serveur
	onLoad: function(){};		//Appelé lors du démarrage du serveur ou de l'activation de l'application
	onOpen:function(){};		//Applé lors de l'ouverture coté client de l'application
	onClose: function(){};		//Appelé lors de la fermeture coté client de l'application
	//Position des scripts et ressources
	html: null					//Position du fichier html affiché dans le fenètre client
	css: null 					//Position du fichier CSS décrivant l'application
	script: null				//Position du script executé coté client
}

module.exports = function(){
	return application;
}