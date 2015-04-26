var application = {
	id: "app",					//L'identifiant de l'application qui doit etre le meme que son dossier ou sa class principale
	name: "Application",
	description: "Donnez une déscription",
	appManager: null,			//Le gestionnaire d'applications du serveur
	type: "gui",				//Le type d'application. peut etre gui pour l'affichage d'une fenètre ou bac pour une execution en arriere plan
	needLogIn: true,
	//Fonctions coté serveur
	onLoad: function(){},		//Appelé lors du démarrage du serveur ou de l'activation de l'application
	onOpen:function(socket){},		//Applé lors de l'ouverture coté client de l'application
	onClose: function(socket){},		//Appelé lors de la fermeture coté client de l'application
	//Position des scripts et ressources
	html: null,					//Position du fichier html affiché dans le fenètre client
	css: null, 					//Position du fichier CSS décrivant l'application
	script: null,				//Position du script executé coté client
	//Fonctions
	getInfos: function(){
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			type: this.type,
			needLogIn: this.needLogIn,
			html: this.html,
			css: this.css,
			script: this.script,
		};
	},
}

module.exports = function(appManager){
	application.appManager = appManager;
	return application;
}