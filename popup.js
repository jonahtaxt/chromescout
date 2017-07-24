var currentSystemStatus;
var thresholds;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateSleepTime(remainingPoints) {
	if(remainingPoints <= 25) {
		return 50;
	} else if (remainingPoints <= 10) {
		return 200;
	} else {
		return 10;
	}
}

function setBGReadingColor(currentBGPoint) {
	var currentColor = '';
	
	if(currentBGPoint <= thresholds.bgLow || currentBGPoint >= thresholds.bgHigh) {
		currentColor = '#F92121';
	} else if ((currentBGPoint > thresholds.bgLow && currentBGPoint <= thresholds.bgTargetBottom) ||
	(currentBGPoint >= thresholds.bgTargetTop && currentBGPoint < thresholds.bgHigh)) {
		currentColor = 'yellow';
	} else {
		currentColor = '#4cff00';
	}
	return currentColor;
}

async function animateLastBGReading(bgReadingSpan, bgReading){
	bgReadingSpan.text('0');
	for(var x = 0; x <= bgReading; x++) {
		bgReadingSpan.text(x.toString());
		bgReadingSpan.css('color', setBGReadingColor(x));		
		await sleep(calculateSleepTime(bgReading - x));
	}
}

function getLastBGReading() {
	var lastBGReadingSpan = $("#lastBGReading");
	var trendSpan = $("#trend");
	$.get('https://dpmns.azurewebsites.net/api/v1/entries.json?count=2', function(data){
		var lastBGReadingInfo = data[0];
		var priorBGReadingInfo = data[1];
		var currentBGReading = lastBGReadingInfo.sgv;
		var trend = lastBGReadingInfo.sgv - priorBGReadingInfo.sgv;
		animateLastBGReading(lastBGReadingSpan, currentBGReading);
		if(trend < 0) {
			trendSpan.text(trend.toString());			
		} else {
			trendSpan.text('+ ' + trend.toString());
		}
	});
}

function getSystemStatus() {
	$.get('https://dpmns.azurewebsites.net/api/v1/status.json', function(data) {
		currentSystemStatus = data;
		thresholds = currentSystemStatus.settings.thresholds;
		$("#userTitle").text(currentSystemStatus.settings.customTitle);
		getLastBGReading();
	});
}

document.addEventListener('DOMContentLoaded', function() {
	getSystemStatus();
});