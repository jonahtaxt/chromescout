var self = this;

self.nsVars = {};
self.nsGetDataAlarmName = 'refreshNSData';

self.setBGReadingIconColor = function (currentBGPoint) {
	var currentIconColor = '';

	if (currentBGPoint <= self.nsVars.thresholds.bgLow || currentBGPoint >= self.nsVars.thresholds.bgHigh) {
		currentIconColor = 'logored.png';
	} else if ((currentBGPoint > self.nsVars.thresholds.bgLow && currentBGPoint <= self.nsVars.thresholds.bgTargetBottom) ||
		(currentBGPoint >= self.nsVars.thresholds.bgTargetTop && currentBGPoint < self.nsVars.thresholds.bgHigh)) {
		currentIconColor = 'logoyellow.png';
	} else {
		currentIconColor = 'logo.png';
	}
	return currentIconColor;
};

self.setIconTitle = function () {
	var newIconTitle = self.nsVars.lastBGReadingInfo.sgv.toString() + ' (';

	if (self.nsVars.delta >= 0) {
		newIconTitle += '+ ' + self.nsVars.delta.toString();
	} else {
		newIconTitle += self.nsVars.delta.toString();
	}

	newIconTitle += ')';

	chrome.browserAction.setTitle({
		title: newIconTitle
	});
};

self.getLastBGReading = function () {
	$.get(self.nsVars.nsUrl + 'api/v1/entries.json?count=2', function (data) {
		self.nsVars.lastBGReadingInfo = data[0];
		self.nsVars.priorBGReadingInfo = data[1];
		self.nsVars.currentBGReading = self.nsVars.lastBGReadingInfo.sgv;
		self.nsVars.delta = self.nsVars.lastBGReadingInfo.sgv - self.nsVars.priorBGReadingInfo.sgv;
		self.nsVars.dataLoaded = true;

		chrome.storage.sync.set({
			"extensionVars": self.nsVars
		});

		self.setIconTitle();

		chrome.browserAction.setIcon({
			path: '../img/' + setBGReadingIconColor(self.nsVars.currentBGReading)
		});
	});
};

self.getCurrentStatus = function (items) {
	if (!(items.nightscoutUrl === 'https://<yoursite>.azurewebsites.net/')) {
		self.nsVars.nsUrl = items.nightscoutUrl;
		$.get(self.nsVars.nsUrl + 'api/v1/status.json', function (data) {
			self.nsVars.currentSystemStatus = data;
			self.nsVars.thresholds = self.nsVars.currentSystemStatus.settings.thresholds;
			self.getLastBGReading();
		});
	}
};

self.initialize = function () {
	self.nsVars = {
		nsUrl: null,
		currentSystemStatus: null,
		thresholds: null,
		lastBGReadingInfo: null,
		priorBGReadingInfo: null,
		currentBGReading: null,
		delta: null,
		dataLoaded: false
	};

	chrome.storage.sync.get({
		"nightscoutUrl": "https://<yoursite>.azurewebsites.net/"
	}, function (items) {
		if (items.nightscoutUrl !== "https://<yoursite>.azurewebsites.net/") {
			self.getCurrentStatus(items);
		}
	});
};

document.addEventListener('DOMContentLoaded', function () {
	chrome.alarms.clear(nsGetDataAlarmName, function (wasCleared) {

		chrome.alarms.create(nsGetDataAlarmName, {
			delayInMinutes: 5,
			periodInMinutes: 5
		});

		chrome.alarms.onAlarm.addListener(function (alarm) {
			if (alarm.name === nsGetDataAlarmName) {
				self.initialize();
			}
		});

		self.initialize();
	});
});
