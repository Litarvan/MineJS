var express = require('../node_modules/express');
var expressApp = express();
var http = require('http').Server(expressApp);
var io = require('../node_modules/socket.io')(http);
var fs = require('fs');
var yaml = require('../node_modules/js-yaml');

var User = require('./User');

var app = {
	name: "MineJS",
	gameServer: null,
	config: {
		port: 80,
	},

	run: function(){
		console.log("Ecoute ...");
		http.listen(this.config.port);
	},
}

module.exports = function(){
	expressApp.use("/static",express.static("static"));
	expressApp.use("/partials",express.static("core/partials"));

	expressApp.get("/",function(request,response){
		response.sendFile(__dirname+"/partials/index.html");
	});

	io.on("connection",function(socket){
		var user = new User(socket);
	});

	return app;
}