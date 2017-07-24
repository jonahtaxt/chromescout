var nsUrl = '';
chrome.webNavigation.onCompleted.addListener(function(details){
	chrome.storage.sync.get({
		"nightscoutUrl" : 'https://<yoursite>.azurewebsites.net/'
	}, function(items) {
		if(items.nightscoutUrl === 'https://<yoursite>.azurewebsites.net/') {
			$('#setupExtension').css('display','block');
			$('#bgData').css('display','none');
		} else {
			nsUrl = items.nightscoutUrl;
			$('#setupExtension').css('display','none');
			$('#bgData').css('display','block');
		}
	});
});