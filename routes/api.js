var express = require('express');
var router = express.Router();
var pusher = require('../config/pusherConfig');
var uber = require('../config/uberConfig');
var _ = require('underscore');
var request = require('request');

// Global variables

var startingLocation = {};
var journeyLocations = {};
var nearbyCabs = [];
var tflJourneyData = {}
var lastTflJourneys = []

// Request Handlers

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

router.post('/tfl_journeys', function(req, res){
	tflJourneyData = req.body
	getTflJourneys(tflJourneyData, function(journeys){
		res.json(journeys);
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
		setTimeout(function(){
			getCabData("price");
		}, 30000);
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

// TFL Journeys

var urlFromJourneyData = function(journeyData){
	var url = 'http://api.tfl.gov.uk/Journey/JourneyResults/%7Bfrom%7D/to/%7Bto%7D/via/%7Bvia%7D?'
	url += "from=" + journeyData.start_longitude + "%2C" + journeyData.start_latitude
	url += "&to=" + journeyData.end_longitude + "%2C" + journeyData.end_latitude
	url += '&via=&nationalSearch=False&date=&time=&timeIs=Departing&journeyPreference=&mode=&accessibilityPreference=&fromName=&toName=&viaName=&maxTransferMinutes=&maxWalkingMinutes=&walkingSpeed=&cyclePreference=&adjustment=&bikeProficiency=&alternativeCycle=False&alternativeWalking=True&applyHtmlMarkup=False&app_id=&app_key='
	return url
}

var getTflJourneys = function(journeyData, callback){
	var url = urlFromJourneyData(journeyData);
	request.get(url, function(err, res, body){
		var journeys = JSON.parse(body).journeys
		lastTflJourneys = journeys
		processedJourneys = processTflJourneys(journeys)
		callback(processedJourneys);
	});
};

var processTflJourneys = function(journeys){
	return _.map(journeys, function(journey){
		return {
			duration: journey.duration,
			startDateTime: journey.startDateTime,
			arrivalDateTime: journey.arrivalDateTime,
			instructions: _.map(journey.legs, function(leg){
				return [leg.instruction.summary, leg.instruction.detailed]
			})
		}
	});
};

var checkOutOfDateJourneys = function(){
	if (lastTflJourneys[0] && (Date.now() < Date.parse(lastTflJourneys[0].startDateTime))) {
		console.log("Journey set is out of date");
		getTflJourneys(tflJourneyData, function(journeys){
			console.log("Triggering new TFL journeys...");
			pusher.trigger('tfl-journeys', 'new-journey', journeys)
			setTimeout(function(){
				checkOutOfDateJourneys();
			}, 10000);
		});
	} else {
		setTimeout(function(){
			checkOutOfDateJourneys();
		}, 10000);
	}
};

checkOutOfDateJourneys();



