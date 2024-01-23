// Selaimen tarkastamiseen liittyvä koodi tänne

	var objappVersion = navigator.appVersion; 
	var selainAgent = navigator.userAgent; 
	var selainNimi = navigator.appName; 
	var selainVersio = '' + parseFloat(navigator.appVersion); 
	var Offset, OffsetVersion, ix; 
	
	// Chrome 
	if ((OffsetVersion = selainAgent.indexOf("Chrome")) != -1) { 
		selainNimi = "Chrome"; 
		selainVersio = selainAgent.substring(OffsetVersion + 7); 
	} 
	
	// Microsoft internet explorer 
	else if ((OffsetVersion = selainAgent.indexOf("MSIE")) != -1) { 
		window.stop()
    
	} 
	
	// Firefox 
	else if ((OffsetVersion = selainAgent.indexOf("Firefox")) != -1) { 
		selainNimi = "Firefox"; 
	} 
	
	// Safari 
	else if ((OffsetVersion = selainAgent.indexOf("Safari")) != -1) { 
		selainNimi = "Safari"; 
		selainVersio = selainAgent.substring(OffsetVersion + 7); 
		if ((OffsetVersion = selainAgent.indexOf("Version")) != -1) 
			selainVersio = selainAgent.substring(OffsetVersion + 8); 
	} 
	
	// Muille selaimille
	else if ((Offset = selainAgent.lastIndexOf(' ') + 1) < 
		(OffsetVersion = selainAgent.lastIndexOf('/'))) { 
		selainNimi = selainAgent.substring(Offset, OffsetVersion); 
		selainVersio = selainAgent.substring(OffsetVersion + 1); 
		if (selainNimi.toLowerCase() == selainNimi.toUpperCase()) { 
			selainNimi = navigator.appName; 
		} 
	} 
	
	if ((ix = selainVersio.indexOf(";")) != -1) 
		selainVersio = selainVersio.substring(0, ix); 
	if ((ix = selainVersio.indexOf(" ")) != -1) 
		selainVersio = selainVersio.substring(0, ix); 
	
	
	

