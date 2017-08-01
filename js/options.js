const nsGetDataAlarmName = 'refreshNSData';

function save_options() {
    var nsUrl = document.getElementById('nsUrl').value;
    var statusDiv = document.getElementById('status');

    if (nsUrl === 'https://<yoursite>.azurewebsites.net/') {
        statusDiv.textContent = 'Please enter your Nightscout website Url';
        setTimeout(function () {
            statusDiv.textContent = '';
        }, 2000);
        return;
    }

	chrome.permissions.request({
		permissions: ['tabs'],
		origins: [nsUrl]
	}, function(granted) {
		if(granted){
			chrome.storage.sync.set({
				"nightscoutUrl": nsUrl
			}, function () {
				chrome.alarms.create(nsGetDataAlarmName, { delayInMinutes: 5, periodInMinutes: 5 });
				var status = document.getElementById('status');
				status.textContent = 'Options saved.';
				setTimeout(function () {
					status.textContent = '';
				}, 2000);
			});
		} else {
			var status = document.getElementById('status');
			status.textContent = 'Please grant permissions to get access to your NS site';
			setTimeout(function() {
				status.textContent='';
			}, 2000);
		}
	});
}

function restore_options() {
    chrome.storage.sync.get({
        "nightscoutUrl": 'https://<yoursite>.azurewebsites.net/'
    }, function (items) {
        if (items.nightscoutUrl === 'https://<yoursite>.azurewebsites.net/') {
            document.getElementById('clear').disabled = true;
        } else {
            document.getElementById('clear').disabled = false;
        }
        document.getElementById('nsUrl').value = items.nightscoutUrl;
    });
}

function clear_options() {
    chrome.storage.sync.clear(function () {
        chrome.alarms.create(nsGetDataAlarmName, { delayInMinutes: 5, periodInMinutes: 5 });
		document.getElementById('nsUrl').value = 'https://<yoursite>.azurewebsites.net/';
		var status = document.getElementById('status');
		status.textContent = 'Options cleared.';
		setTimeout(function () {
			status.textContent = '';
		}, 2000);
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('clear').addEventListener('click', clear_options);