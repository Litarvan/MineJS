var Application = require(__dirname+'/../../core/Application');

module.exports = function(appManager){
	var setup = new Application(appManager);

	setup.id = "setup";
	setup.name = "Installation";
	setup.description = "Permet la premiere installation de MineJS";
	setup.needLogIn = false;

	setup.style.primaryColor = "#009820";

	setup.html = "index.html";
	setup.css = "global.css";
	setup.script = "global.js";

	return setup;
}