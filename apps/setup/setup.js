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
		if(!setup.appManager.app.isInstalled)
		{
			user.socket.on("appSetupRegisterAdmin",function(data){
				var admin = new User();
				admin.infos.username = data.username;
				admin.setPassword(data.password);
				admin.save(function(){
					user.socket.emit("appSetupRegisterAdmin",{success: true});
				});
			});

			user.socket.on("appSetupInstallServer",function(version){
				console.log("Installation du serveur en version "+version);
				setup.appManager.app.gameServer = new MinecraftServer();
				setup.appManager.app.gameServer.getAvaliableVersions(function(versions){
					for(var i = 0; i<versions.length; i++)
					{
						if(version == "latest" || version == versions[i])
						{
							setup.appManager.app.gameServer.install(version,function(code){
								if(code == 100 || code == 101)
								{
									user.socket.emit("appSetupInstallServer",{success: true});
								}
								else
								{
									user.socket.emit("appSetupInstallServer",{success: false,message:"Le serveur ne s'est pas installé correctement, code "+code});
								}
							});
						}
					}
				});
			});

			user.socket.on("appSetupFinish",function(){
				setup.appManager.app.isInstalled = true;
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