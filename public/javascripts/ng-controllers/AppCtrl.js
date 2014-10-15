angular.module('PusherUber', ['pusher-angular']).controller('AppCtrl', ['$scope', '$http', '$pusher', function($scope, $http, $pusher){

	var client = new Pusher('fa15651bc1ad6c916fc7');
	var pusher = $pusher(client);

	var nearbyCabsChannel = pusher.subscribe('nearby-cabs');

	nearbyCabsChannel.bind('new-cabs', function(data){
		console.log("Receiving nearby cabs");
		$scope.cabsByTime = data;
	});

	var cabPricesChannel = pusher.subscribe('cab-prices')
	cabPricesChannel.bind('new-price', function(data){
		console.log("Receiving cab prices");
		$scope.cabsByPrice = data;
	});

	GMaps.geolocate({
		success: function(position){
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
				var uberData = {start_latitude: $scope.latitude, start_longitude: $scope.longitude, end_latitude: $scope.toLatitude, end_longitude: $scope.toLongitude}
				console.log(uberData);
				$http.post('/api/prices', uberData).success(function(data){
					console.log(data);
					$scope.cabsByPrice = data
				});
			}
		});
	};

	// $scope.$watch('destination', function(){
	// 	if($scope.destination) getCoordinates();
	// });

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