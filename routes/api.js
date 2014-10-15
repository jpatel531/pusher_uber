var express = require('express');
var router = express.Router();
var pusher = require('../config/pusherConfig');
var uber = require('./config/uberConfig');
var _ = require('underscore');

/* Articles JSON. */
router.get('/time', function(req, res) {
	res.json(nearbyCabs);
});

module.exports = router;

// NYT


var nearbyCabs = [];

var getCabs = function(){
	setTimeout(function(){
		uber.estimates.time
	}, 10000);
};
