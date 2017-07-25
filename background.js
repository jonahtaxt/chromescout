var nsVars = {};
const nsGetDataAlarmName = "refreshNSData";

function getLastBGReading() {
    $.get(nsVars.nsUrl + 'api/v1/entries.json?count=2', function (data) {
        nsVars.lastBGReadingInfo = data[0];
        nsVars.priorBGReadingInfo = data[1];
        nsVars.currentBGReading = nsVars.lastBGReadingInfo.sgv;
        nsVars.trend = nsVars.lastBGReadingInfo.sgv - nsVars.priorBGReadingInfo.sgv;
        nsVars.dataLoaded = true;

        chrome.storage.sync.set({ "extensionVars": nsVars });
    });
}

function initialize() {
    nsVars = {
        nsUrl: null,
        currentSystemStatus: null,
        thresholds: null,
        lastBGReadingInfo: null,
        priorBGReadingInfo: null,
        currentBGReading: null,
        trend: null,
        dataLoaded: false
    };
}

function getSystemStatus() {
    chrome.storage.sync.get({
        "nightscoutUrl": 'https://<yoursite>.azurewebsites.net/'
    }, function (items) {
        initialize(items);
        if (!(items.nightscoutUrl === 'https://<yoursite>.azurewebsites.net/')) {
            nsVars.nsUrl = items.nightscoutUrl;
            $.get(nsVars.nsUrl + 'api/v1/status.json', function (data) {
                nsVars.currentSystemStatus = data;
                nsVars.thresholds = nsVars.currentSystemStatus.settings.thresholds;
                getLastBGReading();
            });
        }
    });
}

chrome.alarms.getAll(function (alarms) {
    var alarmExists = false;
    for (var i = 0; i < alarms.length; i++) {
        if (alarms[i].name === nsGetDataAlarmName) {
            alarmExists = true;
            break;
        }
    }
    if (!alarmExists) {
        getSystemStatus();
        chrome.alarms.create(nsGetDataAlarmName, { delayInMinutes: 5, periodInMinutes: 5 });
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === nsGetDataAlarmName) {
        getSystemStatus();
    }
});