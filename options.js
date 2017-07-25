function save_options() {
    var nsUrl = document.getElementById('nsUrl').value;
    var statusDiv = document.getElementById('status');

    if (nsUrl === 'https://<yoursite>.azurewebsites.net/') {
        statusDiv.textContent = 'Please enter your Nightscout website Url';
        setTimeout(function () {
            statusDiv.textContent = '';
        }, 1500);
        return;
    }

    chrome.storage.sync.set({
        "nightscoutUrl": nsUrl
    }, function () {
        document.getElementById('clear').disabled = false;
        statusDiv.textContent = 'Options saved.';
        setTimeout(function () {
            statusDiv.textContent = '';
        }, 1500);
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
        document.getElementById('nsUrl').value = 'https://<yoursite>.azurewebsites.net/';
        var status = document.getElementById('status');
        status.textContent = 'Options cleared.';
        setTimeout(function () {
            status.textContent = '';
        }, 1500);
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('clear').addEventListener('click', clear_options);