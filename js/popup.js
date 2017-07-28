var backgroundVars = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateSleepTime(remainingPoints) {
    if (remainingPoints <= 25) {
        return 50;
    } else if (remainingPoints <= 10) {
        return 200;
    } else {
        return 10;
    }
}

function setBGReadingColor(currentBGPoint) {
    var currentColor = '';

    if (currentBGPoint <= backgroundVars.thresholds.bgLow || currentBGPoint >= backgroundVars.thresholds.bgHigh) {
        currentColor = 'red';
    } else if ((currentBGPoint > backgroundVars.thresholds.bgLow && currentBGPoint <= backgroundVars.thresholds.bgTargetBottom) ||
        (currentBGPoint >= backgroundVars.thresholds.bgTargetTop && currentBGPoint < backgroundVars.thresholds.bgHigh)) {
        currentColor = 'yellow';
    } else {
        currentColor = '#4cff00';
    }
    return currentColor;
}

async function animateLastBGReading(bgReadingSpan, bgReading) {
    bgReadingSpan.text('0');
    for (var x = 0; x <= bgReading; x++) {
        bgReadingSpan.text(x.toString());
        bgReadingSpan.css('color', setBGReadingColor(x));
        await sleep(calculateSleepTime(bgReading - x));
    }
}

function openFullSite(e) {
	var tab = {
		url: backgroundVars.nsUrl
	};
	chrome.tabs.create(tab);
}

function openOptions(e) {
	var tab = {
		url: 'chrome://extensions/?options=' + chrome.runtime.id
	};
	chrome.tabs.create(tab);
}

function initialize() {

    chrome.storage.sync.get({
        "extensionVars": null
    }, function (items) {
        backgroundVars = items.extensionVars;

        var setupExtensionDiv = $('#setupExtension');
        var retrieveDataDiv = $('#retrieveData');
        var bgDataDiv = $('#bgData');
        var userTitleDiv = $('#userTitle');
        var bgUnitsDiv = $('#bgUnits');
        var timeAndDeltaDiv = $('#timeAndDelta');
		var openFullSiteButton = $('#openFullSite');
		var openSettingsButton = $('#openSettings');

        if (backgroundVars !== null) {
            if (backgroundVars.nsUrl === 'https://<yoursite>.azurewebsites.net/') {
                setupExtensionDiv.show();
                retrieveDataDiv.hide();
                bgDataDiv.hide();
                return;
            }

            if (!backgroundVars.dataLoaded) {
                setupExtensionDiv.hide();
                retrieveDataDiv.show();
                bgDataDiv.hide();
                return;
            }
            else {
				
				openFullSiteButton.click(openFullSite);
				openSettingsButton.click(openOptions);
				
                setupExtensionDiv.hide();
                retrieveDataDiv.hide();
                bgDataDiv.show();

                userTitleDiv.text(backgroundVars.currentSystemStatus.settings.customTitle);
                bgUnitsDiv.text(backgroundVars.currentSystemStatus.settings.units);
                var lastBGReadingSpan = $("#bgShow");
                var timeAndDeltaSpan = $("#timeAndDelta");

                animateLastBGReading(lastBGReadingSpan, backgroundVars.currentBGReading);

                var timeAndDeltaText = 'Time: ' + new Date(backgroundVars.lastBGReadingInfo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


                if (backgroundVars.delta < 0) {
                    timeAndDeltaText += ' Delta: ' + backgroundVars.delta.toString();
                } else {
                    timeAndDeltaText += ' Delta: + ' + backgroundVars.delta.toString();
                }

                timeAndDeltaDiv.text(timeAndDeltaText);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initialize();
});