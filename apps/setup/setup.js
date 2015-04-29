var Application = require(__dirname+'/../../core/Application');
var User = require(__dirname+'/../../core/User');
var MinecraftServer = require(__dirname+"/../../core/MinecraftServer");

module.exports = function(appManager){
	var setup = new Application(appManager);

	setup.id = "setup";
	setup.name = "Installation";
	setup.description = "Permet la premiere installation de MineJS";
	setup.needLogIn = false;

	new MinecraftServer().getAvaliableVersions(function(versions){
		setup.custom.minecraftVersionsAvaliable = versions;
	});

	setup.style.primaryColor = "#9FC236";

	setup.html = "setupInit.html";
	setup.css = "setupApp.css";
	setup.script = "setupApp.js";

	setup.onOpen = function(user){
		if(setup.appManager.app.installStep > -1)
		{
			user.socket.once("appSetupInstallStep",function(){
				user.socket.emit("appSetupInstallStep",setup.appManager.app.installStep);
			});

			user.socket.on("appSetupGetAppConfig",function(){
				user.socket.emit("appSetupGetAppConfig",setup.appManager.app.config);
			});

			user.socket.on("appSetupRegisterAdmin",function(data){
				var admin = new User();
				admin.infos.username = data.username;
				admin.setPassword(data.password);
				admin.save(function(){
					setup.appManager.app.installStep = 1;
					user.socket.emit("appSetupRegisterAdmin",{success: true});
				});
			});

			user.socket.on("appSetupAppConfig",function(config){
				setup.appManager.app.setConfig(config);
				setup.appManager.app.saveConfig();
				setup.appManager.app.refreshConfig();
				setup.appManager.app.installStep = 2;
				user.socket.emit("appSetupAppConfig",{success:true});
			});

			user.socket.on("appSetupInstallServer",function(version){
				console.log("Installation du serveur en version "+version);
				setup.appManager.app.gameServer.getAvaliableVersions(function(versions){
					setup.appManager.app.gameServer.install(version,function(code){
						if(code == 100 || code == 101)
						{
							setup.appManager.app.installStep = 3;
							user.socket.emit("appSetupInstallServer",{success: true});
						}
						else
						{
							user.socket.emit("appSetupInstallServer",{success: false,message:"Le serveur ne s'est pas installé correctement, code "+code});
						}
					});
				});
			});

			user.socket.on("appSetupFinish",function(){
				setup.appManager.app.installStep = -1;
				setup.appManager.app.loadGameServer();
				setup.appManager.closeApp(user);
			});
		}
		else
		{
			setTimeout(function(){
				user.socket.emit("notif",{type:"error",message:"MineJS est déjà installé"});
				setup.appManager.closeApp(user);
			},500);
		}
		
	}

	setup.onClose = function(user){
		user.socket.removeAllListeners("appSetupRegisterAdmin");
		user.socket.removeAllListeners("appSetupInstallServer");
		user.socket.removeAllListeners("appSetupFinish");
	}

	return setup;
}