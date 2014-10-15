var Uber = require('node-uber');
var secrets = require('./secrets')

var uber = new Uber({
	client_id: secrets.uber_client_id,
	client_secret: secrets.uber_client_secret,
	server_token: secrets.uber_server_token,
	redirect_uri: secrets.uber_redirect_uri,
  	name: exports.uber_app_name
});

module.exports = uber