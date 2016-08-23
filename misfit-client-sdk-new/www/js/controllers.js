app.controller('DashCtrl', ['$scope', '$ionicPopup', '$localstorage', '$timeout', function($scope, $ionicPopup, $localstorage, $timeout) {


	var deviceToPair;
	$scope.availableDevices = [];

	var getDeviceToPairKey = function() {
		return "device-to-pair";
	}

	$timeout(function() {
		$scope.$evalAsync(function() {
			//$scope.pair();
		});
	}, 20000);

	$scope.scan = function() {
		$scope.availableDevices = [];
		if (!$scope.scanning) {
			$scope.scanning = true;
			var success = function(result) {
				var list = result.devices;
				$scope.availableDevices = _.uniq(list, function(scanResult) {
					return scanResult.device.serialNumber;
				})
				$scope.$evalAsync(function() {
					$scope.scanning = false;
					$scope.scanResult = JSON.stringify(list);
				})
				if (list && list.length > 0) {
					//deviceToPair = list[0].device;
					//$localstorage.putObject(getDeviceToPairKey(), deviceToPair);
				}
			};
			var error = function(error) {
				$scope.scanning = false;
				$ionicPopup.alert({
					template: JSON.stringify(error)
				})
			};

			window.cordova.plugins.misfitPlugin.startScanning(success, error, 8000);
		}
	};

	$scope.pair = function(device) {
		if (!$scope.pairing) {
			$scope.pairing = true;
			var success = function(result) {
				$scope.$evalAsync(function() {
					$scope.pairing = false;
					$scope.pairResult = JSON.stringify(result);
					$localstorage.putObject(getDeviceToPairKey(), result.device);
					deviceToPair = $localstorage.getObject(getDeviceToPairKey());
				})
			};
			var error = function(error) {
				$scope.pairing = false;
				$ionicPopup.alert({
					template: JSON.stringify(error)
				})
			};
			window.cordova.plugins.misfitPlugin.pairDevice(success, error, device, 22000);
		}
	};



	// $scope.sync = function() {
	// 	if (!$scope.syncing) {
	// 		$scope.syncing = true;
	// 		var success = function(result) {
	// 			$scope.$evalAsync(function() {
	// 				$scope.syncing = false;
	// 				$scope.syncResult = JSON.stringify(result);
	// 			})
	// 		};
	// 		var error = function(error) {
	// 			$scope.syncing = false;
	// 			$ionicPopup.alert({
	// 				template: error
	// 			})
	// 		};
	// 		window.cordova.plugins.misfitPlugin.getData(success, error, deviceToPair, 22000);
	// 	}
	// };



	$scope.unpair = function() {
		$scope.unpairing = true;
		var success = function(result) {
			$scope.$evalAsync(function() {
				$localstorage.removeObject(getDeviceToPairKey());
				deviceToPair = null;
				$scope.unpairing = false;
				$scope.unpairResult = JSON.stringify(result);
			})
		};
		var error = function(error) {
			$scope.unpairing = false;
			$ionicPopup.alert({
				template: JSON.stringify(error)
			})
		};
		if (!deviceToPair) {
			deviceToPair = $localstorage.getObject(getDeviceToPairKey());
		}
		if (deviceToPair) {
			console.log("called cordova disconnect")
			window.cordova.plugins.misfitPlugin.unpairDevice(success, error, deviceToPair, 8000);
		}
	};

	$scope.activate = function() {
		var success = function(result) {
			$scope.$evalAsync(function() {
				$scope.activateResult = JSON.stringify(result);
			})
		};
		var error = function(error) {
			$ionicPopup.alert({
				template: JSON.stringify(error)
			})
		};
		if (!deviceToPair) {
			deviceToPair = $localstorage.getObject(getDeviceToPairKey());
		}
		if (deviceToPair) {
			window.cordova.plugins.misfitPlugin.activate(success, error, deviceToPair, 8000);
		}
	};

	$scope.animate = function() {
		if (!$scope.animating) {
			$scope.animating = true;
			var success = function(result) {
				$scope.animating = false;
				$scope.$evalAsync(function() {
					$scope.animateResult = JSON.stringify(result);
				})
			};
			var error = function(error) {
				$scope.animating = false;
				$ionicPopup.alert({
					template: JSON.stringify(error)
				})
			};
			if (!deviceToPair) {
				deviceToPair = $localstorage.getObject(getDeviceToPairKey());
			}
			if (deviceToPair) {
				window.cordova.plugins.misfitPlugin.animate(success, error, deviceToPair, 8000);
			}
		}
	};
}])



.controller('BlankCtrl', function($scope, $interval, $ionicPopup, $localstorage, $injector) {

	var deviceToPair;
	var getDeviceToPairKey = function() {
		return "device-to-pair";
	}

	$scope.steps = 0;
	var emptyDataCount = 0;
	var currentIndex = 0;
	var deviceToSync;

	/*--<DO NOT REMOVE: FOR MISFIT LOGGING - INJECTOR>//--*/

	//mockData
	var mockSyncData = {
		device: {
			familyCode: 2,
			firmwareVersion: "FL2.1.8r",
			modelNumber: "FL.2.0",
			serialNumber: "F00DZ012NC"
		},
		data: [{"points":0,"bipedalCount":0,"variance":44,"endTimestamp":1438821664,"startTimestamp":1438821605},{"points":0,"bipedalCount":0,"variance":225,"endTimestamp":1438821724,"startTimestamp":1438821665},{"points":0,"bipedalCount":0,"variance":511,"endTimestamp":1438821784,"startTimestamp":1438821725},{"points":0,"bipedalCount":0,"variance":511,"endTimestamp":1438821844,"startTimestamp":1438821785},{"points":1,"bipedalCount":4,"variance":511,"endTimestamp":1438821904,"startTimestamp":1438821845},{"points":1,"bipedalCount":4,"variance":511,"endTimestamp":1438821964,"startTimestamp":1438821905},{"points":0,"bipedalCount":0,"variance":511,"endTimestamp":1438822024,"startTimestamp":1438821965},{"points":0,"bipedalCount":2,"variance":511,"endTimestamp":1438822084,"startTimestamp":1438822025},{"points":0,"bipedalCount":0,"variance":511,"endTimestamp":1438822144,"startTimestamp":1438822085},{"points":6,"bipedalCount":24,"variance":10000,"endTimestamp":1438822204,"startTimestamp":1438822145},{"points":22,"bipedalCount":88,"variance":10000,"endTimestamp":1438822264,"startTimestamp":1438822205},{"points":19,"bipedalCount":74,"variance":10000,"endTimestamp":1438822324,"startTimestamp":1438822265},{"points":3,"bipedalCount":12,"variance":511,"endTimestamp":1438822384,"startTimestamp":1438822325},{"points":0,"bipedalCount":2,"variance":511,"endTimestamp":1438822444,"startTimestamp":1438822385},{"points":2,"bipedalCount":8,"variance":511,"endTimestamp":1438822504,"startTimestamp":1438822445},{"points":11,"bipedalCount":42,"variance":10000,"endTimestamp":1438822564,"startTimestamp":1438822505},{"points":0,"bipedalCount":0,"variance":88,"endTimestamp":1438822624,"startTimestamp":1438822565},{"points":0,"bipedalCount":0,"variance":322,"endTimestamp":1438822684,"startTimestamp":1438822625},{"points":0,"bipedalCount":0,"variance":464,"endTimestamp":1438822744,"startTimestamp":1438822685}]
	};

	var getDeviceToPairKey = function() {
		return "device-to-pair";
	}

	function sync(label) {
		$scope.percentage = 0;

		if (!$scope.isSyncing) {
			$scope.isSyncing = true;
			var success = function(result) {
				$scope.isSyncing = false;
				console.log("SyncStart raw data:" + JSON.stringify(result.data));

				var simpleData = [];
				var activities = _.each(result.data, function(activity) {
					var date = new Date(0);
					date.setUTCSeconds(activity.startTimestamp);
					if (activity.bipedalCount != 0) {
						simpleData.push({
							start: date.toLocaleString(),
							steps: activity.bipedalCount
						});
					}
				})
				$scope.$evalAsync(function() {
					$scope.syncResult = JSON.stringify(simpleData);
				});

				var syncData = result.data;
				var deviceInfo = result.device;

				//Saving to database
				/*--<DO NOT REMOVE: FOR MISFIT LOGGING - IMPLEMENTATION>//--*/
				/*LogMisFitService.log(syncData, label, deviceInfo)
				.then(
					function onSuccess(resp) {
						$ionicPopup.alert({
							template: "Sync completed and saved to parse."
						});
					},
					function onError(error) {
						$ionicPopup.alert({
							template: JSON.stringify(error)
						});
					}
				);*/
			};
			var error = function(error) {
				$scope.isSyncing = false;
				$ionicPopup.alert({
					template: JSON.stringify(error)
				})
			};

			if (!deviceToPair) {
				deviceToPair = $localstorage.getObject(getDeviceToPairKey());
			}
			if (deviceToPair) {
				console.log("called cordova startSyncing")
				window.cordova.plugins.misfitPlugin.getData(success, error, deviceToPair, 20000, 6000);
				//success(mockSyncData);
			}
		}
	};

	$scope.sync = function(){
		$scope.$evalAsync(function(){
			var defaultLabel = moment(new Date()).format("YYYYMMDD") + "-";
			var syncDataLabel = prompt("Please enter a label for the sync data", defaultLabel);

			if (syncDataLabel != null) {
				sync(syncDataLabel);
			}
		});
	};

	// $scope.syncStart = function() {
	// 	if (!$scope.syncStarting) {
	// 		$scope.syncStarting = true;
	// 		$scope.percentage = 0;
	// 		if (!$scope.isSyncing) {
	// 			var success = function(result) {
	// 				$scope.$evalAsync(function() {
	// 					$scope.syncStarting = false;
	// 					$scope.isSyncing = true;
	// 					$scope.syncStartResult = JSON.stringify(result);
	// 				})
	// 				startGetData();
	// 			};
	// 			var error = function(error) {
	// 				$scope.syncStarting = false;
	// 				$ionicPopup.alert({
	// 				template: JSON.stringify(error)
	// 				})
	// 			};

	// 			window.cordova.plugins.misfitPlugin.startSyncing(success, error, 8000);
	// 		}
	// 	}
	// };


	// $scope.syncStop = function() {
	// 	var success = function(result) {

	// 		$scope.$evalAsync(function() {
	// 			$scope.isSyncing = false;
	// 			$scope.syncStopResult = JSON.stringify(result);
	// 		})
	// 		emptyDataCount = 0;
	// 		currentIndex = 0;
	// 	};
	// 	var error = function(error) {
	// 		$scope.$evalAsync(function() {
	// 			$scope.isSyncing = false;
	// 			console.error(error);
	// 		})
	// 	};
	// 	stopGetData();

	// 	window.cordova.plugins.misfitPlugin.stopSyncing(success, error, 8000);
	// };


	// var startGetData = function() {

	// 	$scope.getDataInterval = $interval(function() {
	// 		$scope.getCurrentData()
	// 	}, 500);

	// }

	// var stopGetData = function() {
	// 	$interval.cancel($scope.getDataInterval);
	// 	$scope.getDataInterval = null;
	// }

	// $scope.getCurrentData = function() {

	// 	var success = function(result) {
	// 		console.error(result);
	// 		$scope.$evalAsync(function() {
	// 			var data = result.data;
	// 			if (!data || data.length == currentIndex) {
	// 				emptyDataCount++;
	// 				if (emptyDataCount > 20) {
	// 					$scope.syncStop();
	// 					$ionicPopup.alert({
	// 						template: "No new data."
	// 					})
	// 				}
	// 			}
	// 			console.error(currentIndex, data.length)
	// 			for (var i = currentIndex; i < data.length; i++) {
	// 				console.error(i, data[i]);
	// 				var item = data[i];
	// 				if (item.percentage == 1) {
	// 					$scope.syncStop();
	// 				}
	// 				$scope.percentage = item.percentage * 100;
	// 				if (item.syncResult) {
	// 					_.each(item.syncResult.mActivities, function(activity) {
	// 						console.error("activity", activity);
	// 						$scope.steps += activity.mBipedalCount;
	// 					})
	// 				}
	// 			}
	// 			currentIndex = data.length;
	// 			$scope.data = JSON.stringify(result);
	// 		})
	// 	};
	// 	var error = function(error) {
	// 		$ionicPopup.alert({
	// 			template: error
	// 		})
	// 	};
	// 	window.cordova.plugins.misfitPlugin.getCurrentData(success, error);
	// };
})