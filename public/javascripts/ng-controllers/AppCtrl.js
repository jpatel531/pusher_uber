angular.module('PusherUber', ['pusher-angular']).controller('AppCtrl', ['$scope', '$http', '$pusher', function($scope, $http, $pusher){

	// Pusher Setup

	var client = new Pusher('fa15651bc1ad6c916fc7');
	var pusher = $pusher(client);

	// Pusher Channels

	var nearbyCabsChannel = pusher.subscribe('nearby-cabs');
	nearbyCabsChannel.bind('new-cabs', function(data){
		console.log("Receiving nearby cabs");
		$scope.cabsByTime = data;
	});

	var cabPricesChannel = pusher.subscribe('cab-prices');
	cabPricesChannel.bind('new-price', function(data){
		console.log("Receiving cab prices");
		$scope.cabsByPrice = data;
	});

	var tflJourneysChannel = pusher.subscribe('tfl-journeys');
	tflJourneysChannel.bind('new-journey', function(data){
		console.log(data);
		console.log("Receiving new TFL journeys");
		$scope.tflJourneys = data;
	});

	// Geolocation

	GMaps.geolocate({
		success: function(position){
			$scope.showInput = true;
			$scope.latitude = position.coords.latitude;
			$scope.longitude = position.coords.longitude;
			console.log($scope.longitude + "," + $scope.latitude)
			$http.post('/api/times', {start_latitude: $scope.latitude, start_longitude: $scope.longitude}).success(function(data){
				$scope.cabsByTime = data
			});	
		},
	});

	var postCoordinates = function(){
		GMaps.geocode({
			address: $scope.destination,
			callback: function(results, status){
				var latlng = results[0].geometry.location;
				$scope.toLatitude = latlng.lat();
				$scope.toLongitude = latlng.lng();
				var locationData = {start_latitude: $scope.latitude, start_longitude: $scope.longitude, end_latitude: $scope.toLatitude, end_longitude: $scope.toLongitude}
				console.log(locationData);
				$http.post('/api/prices', locationData).success(function(data){
					$scope.cabsByPrice = data
				});


				$http.post('/api/tfl_journeys', locationData).success(function(data){
					// console.log(data);
					$scope.tflJourneys = data;
				});


			}
		});
	};

	$scope.submit = function(event){
		if (event.keyCode === 13) {
			postCoordinates()
		}
	};


}]);

angular.module('PusherUber').filter('secondsToMinutes', function(){
	return function(input){
		var minutes = Math.floor(input/60);
		var seconds = Math.floor(input % 60);

		return minutes + " minutes and " + seconds + " seconds"
	}
});