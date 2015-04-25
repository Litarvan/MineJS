var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var yaml = require('js-yaml');

app.use("/static",express.static("static"));
app.use("/partials",express.static("core/partials"));

app.get("/",function(request,response){
	response.sendFile(__dirname+"/core/partials/index.html");
});

io.on("connection",function(socket){
	console.log("Conexion socket");

	socket.on("logIn",function(data){
		if(isValidUser(data))
		{
			socket.emit("logIn",{status:"ok",username:data.username});
		}
		else
		{
			socket.emit("logIn",{status:"bad",username:data.username});
		}
	});
});

function isValidUser(user)
{
	if(typeof user.username !== 'undefined' && typeof user.password !== 'undefined')
	{
		try 
		{
		  var users = yaml.safeLoad(fs.readFileSync('./config/users.yml', 'utf8'));
		  for(var i = 0; i<users.length; i++)
		  {
		  	if(users[i].username == user.username && users[i].password == user.password)
		  	{
		  		return true;
		  	}
		  }
		  return false;
		} 
		catch (e) 
		{
		  console.log(e);
		  return false;
		}
	}
	else
	{
		return false;
	}
}

http.listen(80);