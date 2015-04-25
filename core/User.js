var yaml = require("../node_modules/js-yaml");
var fs = require("fs");
var crypto = require('crypto');

var user = {

	trusted: false,
	username: null,
	password: null,
	socket: null,

	setPassword: function(password)
	{
		this.password = this.hashString(password);
	},

	hashString: function(string)
	{
		var shahash = crypto.createHash('sha1');
		shahash.update(string);
		return shahash.digest('hex');
	},

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
		user.setPassword(data.password);
		user.check();

		if(user.trusted)
		{
			user.socket.emit("logIn",{status:"ok",username:user.username});
		}
		else
		{
			user.socket.emit("logIn",{status:"bad",username:user.username});
		}
	});

	return user;
}