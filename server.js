var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use("/static",express.static("static"));
app.use("/partials",express.static("core/partials"));

app.get("/",function(request,response){
	response.sendFile(__dirname+"/core/partials/index.html");
});

io.on("connection",function(socket){
	console.log("Conexion socket");

	socket.on("logIn",function(data){
		console.log(data);
		socket.emit("logIn",{status:"bad",username:data.username});
	});
});

http.listen(80);