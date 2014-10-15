var express = require('express');
var router = express.Router();
var pusher = require('../config/pusherConfig');
var uber = require('../config/uberConfig');
var _ = require('underscore');


var startingLocation = {};
var journeyLocations = {};
var nearbyCabs = [];

router.post('/times', function(req, res) {
	startingLocation = req.body
	uber.estimates.time(startingLocation, function(err, cabs){
		res.json(cabs.times);
	});
});

router.post('/prices', function(req, res){
	journeyLocations = req.body
	uber.estimates.price(journeyLocations, function(err, cabs){
		res.json(cabs.prices);
	});
});


module.exports = router;

// Getting nearby cabs and cab prices

var sendNearbyCabs = function(){
	uber.estimates.time(startingLocation, function(err, cabs){
		console.log("Triggering nearby cabs event...")
		pusher.trigger('nearby-cabs', 'new-cabs', cabs.times);
		getCabData("nearby");	
	});
};

var sendCabPrices = function(){
	uber.estimates.price(journeyLocations, function(err, cabs){
		console.log("Triggering cab prices event");
		pusher.trigger('cab-prices', 'new-price', cabs.prices);
		getCabData("price");
	});
};

var getCabData = function(criterion){
	setTimeout(function(){
		try{
			(criterion === "nearby") ? sendNearbyCabs() : (criterion === "price") ? sendCabPrices() : false
		} catch(e){
			getCabData(criterion);
		}
	}, 5000);
};

getCabData("nearby");
getCabData("price");

// Getting cab prices


