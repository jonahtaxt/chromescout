var self = this;

self.nsVars = {};
self.nsGetDataAlarmName = 'refreshNSData';
self.warningAlarm = null;
self.urgentAlarm = null;
self.currentAlarm = '';
self.isAlarmSilenced = false;

self.setLastAndPriorBGReadings = function (data) {
  self.nsVars.lastBGReadingInfo = data[0];
  self.nsVars.priorBGReadingInfo = data[1];
  self.nsVars.dataLoaded = true;
  chrome.storage.sync.set({
    "extensionVars": self.nsVars
  });
};

self.setNewIconTitle = function () {
  var newIconTitle = self.nsVars.lastBGReadingInfo.sgv.toString() + ' (';
  var delta = self.nsVars.lastBGReadingInfo.sgv - self.nsVars.priorBGReadingInfo.sgv;
  if (delta >= 0) {
    newIconTitle += '+ ' + delta.toString();
  } else {
    newIconTitle += delta.toString();
  }
  newIconTitle += ')';
  chrome.browserAction.setTitle({
    title: newIconTitle
  });
};

self.fireAlarm = function () {
  self.urgentAlarm.pause();
  self.warningAlarm.pause();
  self.urgentAlarm.load();
  self.warningAlarm.load();

  if (!self.isAlarmSilenced) {
    switch (self.currentAlarm) {
      case "warning":
        self.warningAlarm.play();
        break;
      case "urgent":
        self.urgentAlarm.play();
        break;
      default:
        break;
    }
  }
};

self.setBGReadingIconColor = function (currentBGPoint) {
  var currentIconColor = '';

  if (currentBGPoint < self.nsVars.nsData.settings.thresholds.bgLow || currentBGPoint > self.nsVars.nsData.settings.thresholds.bgHigh) {
    currentIconColor = 'logored.png';
    self.currentAlarm = "urgent";
  } else if ((currentBGPoint > self.nsVars.nsData.settings.thresholds.bgLow && currentBGPoint < self.nsVars.nsData.settings.thresholds.bgTargetBottom) ||
  (currentBGPoint > self.nsVars.nsData.settings.thresholds.bgTargetTop && currentBGPoint < self.nsVars.nsData.settings.thresholds.bgHigh)) {
    currentIconColor = 'logoyellow.png';
    self.currentAlarm = "warning";
  } else {
    currentIconColor = 'logo.png';
    self.currentAlarm = "none";
  }

  self.fireAlarm();

  chrome.browserAction.setIcon({
    path: '../img/' + currentIconColor
  });
};

self.getLastAndPriorBGInformation = function (resolve, reject) {
  var promise = new Promise(function (resolve, reject) {
    $.get(self.nsVars.nsUrl + 'api/v1/entries.json?count=2')
    .done(function (data) {
      self.setLastAndPriorBGReadings(data);
      self.setNewIconTitle();
      self.setBGReadingIconColor(self.nsVars.lastBGReadingInfo.sgv);
      resolve();
    })
    .fail(function (errorMsg) {
      reject(errorMsg);
    });
  });

  return promise;
};

self.getNSCurrentStatus = function () {
  var promise = new Promise(function (resolve, reject) {
    $.get(self.nsVars.nsUrl + 'api/v1/status.json')
    .done(function (data) {
      self.nsVars.nsData = data;
      resolve();
    })
    .fail(function (errorMsg) {
      reject(errorMsg);
    });
  });

  return promise;
};

self.getBGData = function () {
  var promise = new Promise(function (resolve, reject) {
    self.clearNSData();
    chrome.storage.sync.get({
      "nightscoutUrl": "https://<yoursite>.azurewebsites.net/"
    }, function (extensionConfiguration) {
      if (extensionConfiguration.nightscoutUrl !== "https://<yoursite>.azurewebsites.net/") {
        self.nsVars.nsUrl = extensionConfiguration.nightscoutUrl;
        self.getNSCurrentStatus().then(function () {
          self.getLastAndPriorBGInformation().then(function () {
            resolve();
          }, function (errorMsg) {
            reject(errorMsg);
          });
        }, function (errorMsg) {
          reject(errorMsg);
        });
      } else {
        reject("No configuration found");
      }
    });
  });

  return promise;
};

self.clearNSData = function () {
  self.nsVars = {
    nsUrl: null,
    nsData: null,
    lastBGReadingInfo: null,
    priorBGReadingInfo: null,
    dataLoaded: false
  };
};

self.getNextBGReadingDelay = function () {
  var lastBGTime = moment(self.nsVars.lastBGReadingInfo.date);
  var nextBGTime = lastBGTime.clone().add(5, 'minutes');
  var currentTime = moment(new Date);
  var delayUntilNextReading = currentTime.diff(nextBGTime, 'minutes');

  return delayUntilNextReading <= 0 ? 1 : delayUntilNextReading;
};

self.silenceAlarm = function (request, sender, sendResponse) {
  if (request.silenceAlarm) {
    self.currentAlarm = 'none';
    self.fireAlarm();
    self.isAlarmSilenced = true;
    setTimeout(function () {
      self.isAlarmSilenced = false;
      chrome.runtime.sendMessage({fifteenMinutesComplete:true});
    }, 900000);
    sendResponse({ alarmSilenced: true });
  }
};

self.DOMContentLoaded = function () {

  self.warningAlarm = new Audio("../sound/alarm.mp3");
  self.urgentAlarm = new Audio("../sound/alarm2.mp3");
  self.warningAlarm.loop = true;
  self.urgentAlarm.loop = true;

  chrome.alarms.clear(nsGetDataAlarmName, function (wasCleared) {
    self.getBGData().then(function () {
      chrome.alarms.create(nsGetDataAlarmName, {
        delayInMinutes: self.getNextBGReadingDelay(),
        periodInMinutes: 6
      });
      chrome.alarms.onAlarm.addListener(function (alarm) {
        if (alarm.name === nsGetDataAlarmName) {
          self.getBGData()
          .catch(function (errorMsg) {
            console.log(errorMsg);
          });
        }
      });
      chrome.runtime.onMessage.addListener(self.silenceAlarm);
    }, function (errorMsg) {
      console.log(errorMsg);
    });
  });
};

document.addEventListener('DOMContentLoaded', self.DOMContentLoaded);
