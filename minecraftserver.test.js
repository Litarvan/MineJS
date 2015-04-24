var MinecraftServer = require("./core/MinecraftServer");
var main = new MinecraftServer();

main.event.on("log",function(message){
	console.log("message : "+message);
});

main.event.on("ready",function(){
	console.log("-----[ Serveur pret ]-----");
});

main.event.on("playerConnect",function(name){
	console.log("-----[ bonjour "+name+" ]-----");
});

main.event.on("playerDisconnect",function(name){
	console.log("-----[ au revoir "+name+" ]-----");
});

main.run();