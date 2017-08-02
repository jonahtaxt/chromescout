var self = this;
self.nsVars = null;

self.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

self.animateLastBGReading = async function(bgReadingSpan, bgReading) {
    bgReadingSpan.text('0');
    for (var x = 0; x <= bgReading; x++) {
        bgReadingSpan.text(x.toString());
        bgReadingSpan.css('color', setBGReadingColor(x));
        await self.sleep(calculateSleepTime(bgReading - x));
    }
};

self.calculateSleepTime = function(remainingPoints) {
    if (remainingPoints <= 25) {
        return 50;
    } else if (remainingPoints <= 10) {
        return 200;
    } else {
        return 10;
    }
};

self.setBGReadingColor = function(currentBGPoint) {
    var currentColor = '';

    if (currentBGPoint <= self.nsVars.nsData.settings.thresholds.bgLow || currentBGPoint >= self.nsVars.nsData.settings.thresholds.bgHigh) {
        currentColor = 'red';
    } else if ((currentBGPoint > self.nsVars.nsData.settings.thresholds.bgLow &&
            currentBGPoint <= self.nsVars.nsData.settings.thresholds.bgTargetBottom) ||
        (currentBGPoint >= self.nsVars.nsData.settings.thresholds.bgTargetTop &&
            currentBGPoint < self.nsVars.nsData.settings.thresholds.bgHigh)) {
        currentColor = 'yellow';
    } else {
        currentColor = '#4cff00';
    }
    return currentColor;
};

self.openFullSite = function(e) {
    chrome.tabs.create({
        url: self.nsVars.nsUrl
    });
};

self.openOptions = function(e) {
    chrome.tabs.create({
        url: 'chrome://extensions/?options=' + chrome.runtime.id
    });
};

self.getDOMElementReferences = function() {
    self.setupExtensionDiv = $('#setupExtension');
    self.retrieveDataDiv = $('#retrieveData');
    self.bgDataDiv = $('#bgData');
    self.userTitleDiv = $('#userTitle');
    self.bgUnitsDiv = $('#bgUnits');
    self.timeAndDeltaDiv = $('#timeAndDelta');
    self.openFullSiteButton = $('#openFullSite');
    self.openSettingsButton = $('#openSettings');
    self.lastBGReadingSpan = $("#bgShow");
    self.timeAndDeltaSpan = $("#timeAndDelta");
};

self.setTimeAndDeltaText = function() {
    var timeAndDeltaText = 'Time: ' +
        new Date(self.nsVars.lastBGReadingInfo.date).toLocaleTimeString([],
            { hour: '2-digit', minute: '2-digit' });

    var delta = self.nsVars.lastBGReadingInfo.sgv - self.nsVars.priorBGReadingInfo.sgv;

    if (delta < 0) {
        timeAndDeltaText += ' Delta: ' + delta.toString();
    } else {
        timeAndDeltaText += ' Delta: + ' + delta.toString();
    }

    self.timeAndDeltaDiv.text(timeAndDeltaText);
};

self.initialize = function() {

    chrome.storage.sync.get({
            "extensionVars": null
        },
        function(items) {
            self.nsVars = items.extensionVars;

            self.getDOMElementReferences();

            if (self.nsVars !== null) {

                if (!(self.nsVars.dataLoaded) && (self.nsVars.nsUrl !== 'https://<yoursite>.azurewebsites.net/')) {
                    self.setupExtensionDiv.hide();
                    self.retrieveDataDiv.show();
                    self.bgDataDiv.hide();
                    return;
                }

                if (self.nsVars.nsUrl === 'https://<yoursite>.azurewebsites.net/') {
                    self.setupExtensionDiv.show();
                    self.retrieveDataDiv.hide();
                    self.bgDataDiv.hide();
                    return;
                }

                self.openFullSiteButton.click(self.openFullSite);
                self.openSettingsButton.click(self.openOptions);

                self.setupExtensionDiv.hide();
                self.retrieveDataDiv.hide();
                self.bgDataDiv.show();

                self.userTitleDiv.text(self.nsVars.nsData.settings.customTitle);
                self.bgUnitsDiv.text(self.nsVars.nsData.settings.units);

                self.animateLastBGReading(self.lastBGReadingSpan, self.nsVars.lastBGReadingInfo.sgv);

                self.setTimeAndDeltaText();
            }
        });
};

document.addEventListener('DOMContentLoaded', function () {
    self.initialize();
});