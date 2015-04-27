module.exports = function(appManager){
	var application = {
		id: "app",					//L'identifiant de l'application qui doit etre le meme que son dossier ou sa class principale
		name: "Application",
		description: "Donnez une déscription",
		appManager: null,			//Le gestionnaire d'applications du serveur
		type: "gui",				//Le type d'application. peut etre gui pour l'affichage d'une fenètre ou bac pour une execution en arriere plan
		needLogIn: true,			//Indique s'il faut etre authentifié pour ouvrir l'application
		style:{
			primaryColor: "#3984FF",//Une chaine de caractere indiquant la couleur principale de l'application
			},
		//Fonctions coté serveur
		onLoad: function(){},		//Appelé lors du démarrage du serveur ou de l'activation de l'application
		onOpen:function(user){},		//Applé lors de l'ouverture coté client de l'application
		onClose: function(user){},		//Appelé lors de la fermeture coté client de l'application
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
				style: this.style,
				html: this.html,
				css: this.css,
				script: this.script,
			};
		},
	}

	application.appManager = appManager;
	return application;
}