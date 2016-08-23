app.factory('Services', function() {
	return {};
})

.factory('$localstorage', ['$window', function($window) {
	return {
		put: function(key, value) {
			$window.localStorage[key] = value;
		},
		get: function(key, defaultValue) {
			return $window.localStorage[key] || defaultValue;
		},
		putObject: function(key, value) {
			console.log(JSON.stringify(value))
			$window.localStorage[key] = JSON.stringify(value);
		},
		getObject: function(key) {
			return JSON.parse($window.localStorage[key] || '{}');
		},
		removeObject: function(key) {
			$window.localStorage.removeItem(key);
		}
	}
}]);
