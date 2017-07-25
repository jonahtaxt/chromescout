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

function initialize() {

    chrome.storage.sync.get({
        "extensionVars": null
    }, function (items) {
        backgroundVars = items.extensionVars;

        var setupExtensionDiv = $('#setupExtension');
        var retrieveDataDiv = $('#retrieveData');
        var bgDataDiv = $('#bgData');

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
                setupExtensionDiv.hide();
                retrieveDataDiv.hide();
                bgDataDiv.show();

                var lastBGReadingSpan = $("#lastBGReading");
                var trendSpan = $("#trend");
                animateLastBGReading(lastBGReadingSpan, backgroundVars.currentBGReading);
                if (backgroundVars.trend < 0) {
                    trendSpan.text(backgroundVars.trend.toString());
                } else {
                    trendSpan.text('+ ' + backgroundVars.trend.toString());
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initialize();
});