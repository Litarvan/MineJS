var MinecraftServer = require("./core/MinecraftServer");
var main = new MinecraftServer();
main.getInstallStatus(function(code){
	console.log("install code : "+main.installStatus);
});