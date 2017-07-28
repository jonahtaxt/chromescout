var nsVars = {};
var nsGetDataAlarmName = 'refreshNSData';

function getLastBGReading() {
    $.get(nsVars.nsUrl + 'api/v1/entries.json?count=2', function (data) {
        nsVars.lastBGReadingInfo = data[0];
        nsVars.priorBGReadingInfo = data[1];
        nsVars.currentBGReading = nsVars.lastBGReadingInfo.sgv;
        nsVars.delta = nsVars.lastBGReadingInfo.sgv - nsVars.priorBGReadingInfo.sgv;
        nsVars.dataLoaded = true;

        chrome.storage.sync.set({ "extensionVars": nsVars });
		
		var newIconTitle = nsVars.lastBGReadingInfo.sgv.toString() + ' (';
		
		if(nsVars.delta >= 0) {
			newIconTitle += '+ ' + nsVars.delta.toString();
		} else {
			newIconTitle += nsVars.delta.toString();
		}
		
		newIconTitle += ')';
		
		chrome.browserAction.setTitle({title: newIconTitle});
    });
}

function getCurrentStatus(items) {
	if (!(items.nightscoutUrl === 'https://<yoursite>.azurewebsites.net/')) {
		nsVars.nsUrl = items.nightscoutUrl;
		$.get(nsVars.nsUrl + 'api/v1/status.json', function (data) {
			nsVars.currentSystemStatus = data;
			nsVars.thresholds = nsVars.currentSystemStatus.settings.thresholds;
			getLastBGReading();
		});
	}
}

function initialize() {
    nsVars = {
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
        "nightscoutUrl": 'https://<yoursite>.azurewebsites.net/' 
    }, function(items) {
		getCurrentStatus(items);
	});
}

chrome.alarms.clear(nsGetDataAlarmName, function(wasCleared) {
	
	chrome.alarms.create(nsGetDataAlarmName, { delayInMinutes: 5, periodInMinutes: 5 });
	chrome.alarms.onAlarm.addListener(function (alarm) {
		if (alarm.name === nsGetDataAlarmName) {
			chrome.storage.sync.get({
				"nightscoutUrl": "https://<yoursite>.azurewebsites.net/"
			}, function (items) {
				initialize();
			});
		}
	});
});