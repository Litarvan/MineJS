var app = new require("./core/App")();
var Server = new require("./core/minecraftServer");

app.gameServer = new Server();

if(!app.gameServer.run())
{
	app.gameServer.install("latest",function(){
		app.gameServer.run();
	});
}

app.gameServer.event.on("load",function(){
	console.log("Chargement du serveur Minecraft");
});

app.gameServer.event.on("ready",function(){
	console.log("Serveur Minecraft pret");
});

app.gameServer.event.on("playerConnect",function(name){
	console.log("Connexion de "+name);
});

app.gameServer.event.on("playerDisconnect",function(name){
	console.log("Deconnexion de "+name);
});

app.gameServer.event.on("close",function(){
	console.log("Serveur Minecraft étein");
});

app.run();