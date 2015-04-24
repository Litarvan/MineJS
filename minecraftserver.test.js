var MinecraftServer = require("./core/MinecraftServer");
var main = new MinecraftServer();

main.event.on("log",function(message){
	console.log("message : "+message);
});

main.event.on("playerConnect",function(name){
	main.sendCommand("say Bonjour "+name);
});

main.event.on("playerDisconnect",function(name){
	main.stop();
});

main.run();