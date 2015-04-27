var Application = require(__dirname+'/../../core/Application');
var User = require(__dirname+'/../../core/User');
var MinecraftServer = new require(__dirname+"/../../core/MinecraftServer")();

module.exports = function(appManager){
	var setup = new Application(appManager);

	setup.id = "setup";
	setup.name = "Installation";
	setup.description = "Permet la premiere installation de MineJS";
	setup.needLogIn = false;

	MinecraftServer.getAvaliableVersions(function(versions){
		setup.custom.minecraftVersionsAvaliable = versions;
	});

	setup.style.primaryColor = "#9FC236";

	setup.html = "setupInit.html";
	setup.css = "setupApp.css";
	setup.script = "setupApp.js";

	setup.onOpen = function(user){
		user.socket.on("appSetupRegisterAdmin",function(data){
			var admin = new User();
			admin.infos.username = data.username;
			admin.setPassword(data.password);
			admin.save(function(){
				user.socket.emit("appSetupRegisterAdmin",{success: true});
			});
		});
	}

	return setup;
}