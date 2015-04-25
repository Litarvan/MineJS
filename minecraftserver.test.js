var MinecraftServer = require("./core/MinecraftServer");
var main = new MinecraftServer();
main.folder = "./gamefiles/minecraft-server-new";
main.install("latest",function(code){
	console.log("Code d'installation : "+code)
	if(code == 100)
	{
		console.log("Lancement du serveur");
		main.event.on("playerDisconnect",function(){
			main.stop();
		});
		main.run();
	}
});