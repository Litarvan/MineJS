var yaml = require("../node_modules/js-yaml");
var fs = require("fs");
var crypto = require('crypto');

module.exports = function(socket){
	var user = {

		trusted: false,
		infos : {
				username: null,
				password: null,
				},
		socket: null,
		activeApp: null,

		setPassword: function(password)
		{
			this.infos.password = this.hashString(password);
		},

		hashString: function(string)
		{
			var shahash = crypto.createHash('sha1');
			shahash.update(string);
			return shahash.digest('hex');
		},

		save: function(){
			var users = yaml.safeLoad(fs.readFileSync('./config/users.yml', 'utf8'));

			if(typeof users != "array")
			{
				users = [];
			}

			for(var i = 0; i<users.length; i++)
			{
				if(users[i].username == this.infos.username)
				{
				  	users[i].password = this.infos.password;
				  	break;
				}
			}

			if(i == users.length)
			{
				users.push(this.infos);
			}

			fs.unlinkSync('./config/users.yml');
			fs.writeFile('./config/users.yml', yaml.dump(users), function (err) {
			  if (err) throw err;
			});
		},

		check: function(){
			if(typeof this.infos.username !== 'undefined' && typeof this.infos.password !== 'undefined')
			{
				try 
				{
				  var users = yaml.safeLoad(fs.readFileSync('./config/users.yml', 'utf8'));
				  for(var i = 0; i<users.length; i++)
				  {
				  	if(users[i].username == this.infos.username && users[i].password == this.infos.password)
				  	{
				  		this.trusted = true;
				  		this.infos.username = users[i].username;
				  		this.infos.password = users[i].password;
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

	if(typeof socket != 'undefined')
	{
		user.socket = socket;

		user.socket.on("logIn",function(data){

			user.infos.username = data.username;
			user.setPassword(data.password);
			user.check();

			if(user.trusted)
			{
				user.socket.emit("logIn",{status:"ok",username:user.infos.username});
			}
			else
			{
				user.socket.emit("logIn",{status:"bad",username:user.infos.username});
			}
		});
	}
	return user;
}