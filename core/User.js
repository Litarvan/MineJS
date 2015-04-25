var yaml = require("../node_modules/js-yaml");
var fs = require("fs");

var user = {

	trusted: false,
	username: null,
	password: null,
	socket: null,

	check: function(){
		if(typeof this.username !== 'undefined' && typeof this.password !== 'undefined')
		{
			try 
			{
			  var users = yaml.safeLoad(fs.readFileSync('./config/users.yml', 'utf8'));
			  for(var i = 0; i<users.length; i++)
			  {
			  	if(users[i].username == this.username && users[i].password == this.password)
			  	{
			  		this.trusted = true;
			  		this.username = users[i].username;
			  		this.password = users[i].password;
			  		return;
			  	}
			  }
			  this.trusted = false;
			} 
			catch (e) 
			{
			  console.log(e);
			  this.trusted = false;
			}
		}
		else
		{
			this.trusted = false;
		}
	},

}

module.exports = function(socket){
	user.socket = socket;

	user.socket.on("logIn",function(data){

		user.username = data.username;
		user.password = data.password;
		user.check();

		if(user.trusted)
		{
			user.socket.emit("logIn",{status:"ok",username:user.username});
		}
		else
		{
			user.socket.emit("logIn",{status:"bad",username:duser.username});
		}
	});

	return user;
}