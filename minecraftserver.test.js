var MinecraftServer = require("./core/MinecraftServer");
var main = new MinecraftServer();
main.event.on("log",function(message){
	console.log("message : "+message);
});
main.run();