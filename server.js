var app = new require("./core/App")();
var Server = new require("./core/minecraftServer");

app.gameServer = new Server();

/*if(!app.gameServer.run())
{
	app.gameServer.install("latest",function(){
		app.gameServer.run();
	});
}

app.gameServer.event.on("log",function(message){
	console.log("Serveur minecraft : "+message);
});

app.gameServer.event.on("playerDisconnect",function(name){
	app.gameServer.sendCommand("stop");
});*/

app.run();