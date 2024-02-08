// Selaimen tarkastamiseen liittyvä koodi tänne

var objappVersio = navigator.appVersion;
var selainAgent = navigator.userAgent;
var selainNimi = navigator.appName;
var selainVersio = '' + parseFloat(navigator.appVersion);
var Offset, OffsetVersion, ix;

if (typeof navigator !== 'undefined' && 'onLine' in navigator) {

	// Chrome 
	if ((OffsetVersion = selainAgent.indexOf("Chrome")) != -1) {
		selainNimi = "Chrome";
		selainVersio = selainAgent.substring(OffsetVersion + 7);

		if(parseFloat(selainVersio) < 41) {
			window.stop();
			alert('Selaimesi on vanhentunut, päivitä uudempaan versioon')
		}
	}

	// Opera

	if((OffsetVersion = selainAgent.indexOf("Opera")) != -1) {
		selainNimi = "Opera";
		selainVersio = selainAgent.substring(OffsetVersion + 7);
		if (parseFloat(selainVersio) < 17)
		window.stop();
	alert('Selaimesi on vanhentunut, päivitä uudempaan versioon')
	}

	// Microsoft internet explorer 
	else if ((OffsetVersion = selainAgent.indexOf("MSIE")) != -1) {
			window.stop();
	}

	// Firefox 
	else if ((OffsetVersion = selainAgent.indexOf("Firefox")) != -1) {
		selainNimi = "Firefox";
		selainVersio = selainAgent.substring(OffsetVersion + 7);
		if(parseFloat(selainVersio) < 44) {
			window.stop();
			alert('Selaimesi on vanhentunut, päivitä uudempaan versioon')
		}
	}

	// Safari 
	else if ((OffsetVersion = selainAgent.indexOf("Safari")) != -1) {
		selainNimi = "Safari";
		selainVersio = selainAgent.substring(OffsetVersion + 7);
		if ((OffsetVersion = selainAgent.indexOf("Version")) != -1)
			selainVersio = selainAgent.substring(OffsetVersion + 8);
		if(parseFloat(selainVersio) < 10) {
			window.stop();
			alert('Selaimesi on vanhentunut, päivitä uudempaan versioon')
		}
	}

	// Edge
	else if ((OffsetVersion = selainAgent.indexOf("Edge")) != -1) {
		selainNimi = "Edge";
		selainVersio = selainAgent.substring(OffsetVersion + 7);
	}
	if ((ix = selainVersio.indexOf(";")) != -1)
		selainVersio = selainVersio.substring(0, ix);
	if ((ix = selainVersio.indexOf(" ")) != -1)
		selainVersio = selainVersio.substring(0, ix);

	
}


