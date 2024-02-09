// Asetusten säätö elementti:
// Haetaan kellon vieressä oleva rattaan kuva elementti ja asetetaan se muuttujaan
let settings = document.getElementById('settings');
// Haetaan asetukset elementti ja asetetaan se muuttujaan
let options = document.getElementById('options');
// Haetaan checkboxi, jolla voidaan valita halutaanko seurata junaa vai ei, kun se valitaan
let seuraaJunaa = document.getElementById('seuraaJunaa');
// Haetaan checkboxi, jolla voidaan valita halutaanko zoomata junaa vai ei, kun se valitaan
let zoomaus = document.getElementById('zoomaus');
// Haetaan checkboxi, jolla voidaan valita halutaanko näyttää tarkuusympyrä vai ei, kun se valitaan
let tarkkusympyra = document.getElementById('tarkkusympyra');
// Haetaan kohta, jolla voidaan valita mikä on tarkkuusympyrän maksimi koko
let tarkkusympyraTarkkuus = document.getElementById('tarkkusympyraTarkkuus');
// Haetaan peruuta nappi
let peruuta = document.getElementById('peruuta');
// Haetaan tallenna nappi
let tallenna = document.getElementById('tallenna');
// Asetetaan kuuntelija rattaan kuva elementtiin, joka laukaisee funktion jos elementtiä painetaan
settings.addEventListener('click', openSettings);
// Asetetaan kuuntelija peruuta nappiin, joka laukaisee funktion jos sitä painetaan
peruuta.addEventListener('click', klikattiinPeruuta);
// Asetetaan kuuntelija tallenna nappiin, joka laukaisee funktion jos sitä painetaan
tallenna.addEventListener('click', klikattiinTallenna);
// Asetukset valikko on oletuksena pois näkyvistä
options.style.display = 'none';
// Tuodaan oletus asetukset pääohjelmasta
seuraaJunaa.checked = seuraaMerkkia;
zoomaus.checked = zoomaaLahemmas;
tarkkusympyra.checked = piirraTarkkuus;
tarkkusympyraTarkkuus.value = maxTarkkuus;


// kun sivu on saatu ladattua luodaan kartta, lasketaan paneelin korkeus nykyisellä selainikkunan korkeudella,
// asetetaan MQTT-kuuntelija ja ajastetaan päivitykset
window.onload = () => {

    luoKartta();
    laskePaneelinKorkeus();

    window.onresize = () => { 
        laskePaneelinKorkeus();
        if (valittuJuna != -1) naytaAikataulu(valittuJuna);
    };

    asetaMQTTkuuntelija();

    setInterval(ajastettuPaivitys, 5000);
};
