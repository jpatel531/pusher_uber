var Pusher = require("pusher");
var secrets = require('./secrets')

var pusher = new Pusher({
  appId: secrets.pusherId,
  key: secrets.pusherKey,
  secret: secrets.pusherSecret
});

module.exports = pusher;