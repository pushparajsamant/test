app.factory('LogMisFitService', function($q, $timeout) {

	var ClassName = {
		Raw: "SyncData",
		Detail: "SyncDetails"
	}

	//MisFit Parse configurations
	var MFPARSE = {
		APPID: "lVW3VD2d4puLvrtPaTcdJjl0zMyDKxqJyoaqhY9m",
		CLIENTKEY: "AeYm8FvnIQfR91XJZbaeUFILwieaCCaraRSVJSI2",
		JAVASCRIPTKEY: "HLYoIP7HUU3yOW3vGfadMkbU5WvGdf3htcxQnTfL",
		MASTERKEY: "KLHVR2K3JIwy15vFIEcFOeTAqGm27cNyTM5iiCYx",
		RESTKEY: "mW9PX11a2Crff884JubvBXdvANc1x2fCC1zrJ6Ep",
		APPURL: "https://misfitdev.parseapp.com"
	}

	function createDetailJson(classname, rawDataJson, label, syncDate, pointerId) {
		var syncData = null;
		if(pointerId){
			syncData = {
				"__type": "Pointer",
				"className":"SyncData",
				"objectId": pointerId
			}
		}

		var data = {
			"method": "POST",
			"path": "/1/classes/" + classname,
			"body": {
				"syncDate": syncDate,
				"label": label,
				"points": rawDataJson.points,
				"bipedalCount": rawDataJson.bipedalCount,
				"variance": rawDataJson.variance,
				"startTimestamp": rawDataJson.startTimestamp,
				"endTimestamp": rawDataJson.endTimestamp,
				"utcStartTimestampUTC": moment.unix(rawDataJson.startTimestamp).utc().format("YYYY-MM-DDTHH:mm:ss.ms"), //2015-07-13T06:44:01.000Z
				"utcEndTimestampUTC": moment.unix(rawDataJson.endTimestamp).utc().format("YYYY-MM-DDTHH:mm:ss.ms"),
				"syncData" : syncData
				/*"utcStartTimestampUTC": {
					"__type": "Date",
					"iso": moment.unix(rawDataJson.startTimestamp).utc().format("YYYY-MM-DDThh:mm:ss.ms") + "Z" 	//2015-07-13T06:44:01.000Z
				},
				"utcEndTimestampUTC": {
					"__type": "Date",
					"iso": moment.unix(rawDataJson.endTimestamp).utc().format("YYYY-MM-DDThh:mm:ss") + "Z"
				}*/
			}
		};
		return data;
	}

	function createRawJson(rawDataFileName, rawJson, label, syncDate, deviceInfo) {
		var rawFile = null;
		if(rawDataFileName){
			rawFile = {
				"__type": "File",
				"name": rawDataFileName
			}
		}

		var truncData = JSON.stringify(rawJson).substring(0,50000) + (rawJson.length > 50000 ? "....." : "");

		var data = {
			"syncDate": syncDate,
			"label": label,
			"truncData": truncData,
			"deviceInfo" : JSON.stringify(deviceInfo),
			"dataFile" : rawFile
		};
		return data;
	}

	return {
		log: function(activities, label, deviceInfo) {
			var dfd = $q.defer();
			var self = this;
			try {
				var syncDate = moment(new Date()).format("YYYY-MM-DD");
				if(!activities){
					console.log("LogMisFitService [error] : No activities");
					return $q.reject("No activities");
				}
				label = label ? label : "";
				deviceInfo = deviceInfo ? deviceInfo : "";

				return self.saveData(activities, label, syncDate, deviceInfo)
					.then(
						function onSuccess(resp) {
							if(!resp.error){
								var pointerId = resp.objectId;
								return self.saveDetails(activities, label, syncDate, pointerId);
							}
						},
						function onError(error) {
							return $q.reject(error);
						}
					);
			} catch (err) {
				console.error("LogMisFitService [Exception]:", err);
			}
		},
		sendXHRFile: function(filename, file, callback) {
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "https://api.parse.com/1/files/" + filename, true);
			xhr.setRequestHeader("X-Parse-Application-Id", MFPARSE.APPID);
			xhr.setRequestHeader("X-Parse-REST-API-Key", MFPARSE.RESTKEY);
			xhr.setRequestHeader("Content-Type", "text/plain");

			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					var resp = JSON.parse(xhr.responseText);
					callback(resp);
				}
			}
			
			xhr.send(file);
		},
		sendXHR: function(classname, jsonString, callback) {
			var xhr = new XMLHttpRequest();

			if (classname)
				xhr.open("POST", "https://api.parse.com/1/classes/" + classname, true);
			else
				xhr.open("POST", "https://api.parse.com/1/batch", true);
			xhr.setRequestHeader("X-Parse-Application-Id", MFPARSE.APPID);
			xhr.setRequestHeader("X-Parse-REST-API-Key", MFPARSE.RESTKEY);
			xhr.setRequestHeader("Content-Type", "application/json");

			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					var resp = JSON.parse(xhr.responseText);
					callback(resp);
				}
			}
			var data = JSON.stringify(jsonString);
			xhr.send(data);
		},
		saveData: function(activities, label, syncDate, deviceInfo) {
			console.log("MFSync Saving Raw...");
			var self = this;
			var dfd = $q.defer();
			var classname = ClassName.Raw;

			syncDate = syncDate ? syncDate : moment(new Date()).format("YYYY-MM-DD");

			var dataFile = new Blob([JSON.stringify(activities)], {type: 'text/plain'});
			self.sendXHRFile("syncDataFile.txt", dataFile, function(respFile) {
				console.log("Save File: " + JSON.stringify(respFile), respFile);
				var rawDataFileName = null;
				if(respFile.name){
					rawDataFileName = respFile.name;
				}else{
					console.log("Unable to upload raw data file");
				}
				var jsonString = createRawJson(rawDataFileName, activities, label, syncDate, deviceInfo);
				self.sendXHR(classname, jsonString, function(resp) {
					console.log("MFSync:Raw sync-save-success" + JSON.stringify(resp), resp);
					dfd.resolve(resp);
				});
			});

			return dfd.promise;
		},
		saveDetails: function(activities, label, syncDate, pointerId) {
			console.log("MFSync Saving Details...");
			var self = this;
			var dfd = $q.defer();
			var classname = ClassName.Detail;

			syncDate = syncDate ? syncDate : moment(new Date()).format("YYYY-MM-DD");
			var batches = [];
			var details = [];

			var count = 0;
			var ParseBatchLimit = 49;
			var batchInterval = 1500;

			console.log("activities.len", activities.length);
			_.each(activities, function(activity) {
				var detail = createDetailJson(classname, activity, label, syncDate, pointerId);
				details.push(detail);
				count++;

				if((count % ParseBatchLimit) == 0){
					batches.push(details);
					details = [];
				}
			});

			if(batches.length < (activities.length / ParseBatchLimit)){
				batches.push(details);
			}

			var batchIndex = 0;
			console.log("batches.len", batches.length);
			//Space out the request so that we don't hit the limit
			function sendBatch(){
				$timeout(function(){
					var jsonString = {
						"requests": batches[batchIndex]
					};

					self.sendXHR(null, jsonString, function(resp) {
						console.log("MFSync:Details sync-save-success" + JSON.stringify(resp), resp);
						if(batchIndex == (batches.length - 1)){
							console.log("last... : ", batchIndex);
							if (resp.length > 0 && resp[0].error) {
								dfd.reject(resp[0].error);
							} else {
								dfd.resolve(resp);
							}
						}else{
							batchIndex++;
							sendBatch();
						}
					});
				}, batchInterval);
			}
			if(batches.length > 0){
				sendBatch();
			}

			return dfd.promise;
		}
	};
});
