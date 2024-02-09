// Kutsuu funktioita jotka tuovat sivupaneelin näytölle ja päivittävät sen tiedot
// Parametrit: valitun junan numero
function sivuPaneeli(junanNumero) {
    // sivupaneeli näkyville
    naytaPaneeli();
    // päivitetään junan tiedot vastaamaan valittua junaa
    paivitaTiedotOsio(junanNumero);
    // päivitetään aikataulu ja se korkeus vastaamaan valittua junaa
    naytaAikataulu(junanNumero);
}

// kutsuu funktiota joka muodostaa aikataulun ja laskee tämän jälkeen aikataulun
// maksimikorkeutta suhteessa sivupaneelin korkeuteen
// Parametrit: valitun junan numero
function naytaAikataulu(junanNumero) {
    // nollataan aikataulun vanha maksimikorkeus
    document.querySelector('#aikataulu').style.maxHeight = '';

    // muodostetaan paneeliin uusi aikataululista
    haeAsemaTiedot(etsiJunaTaulukosta(junanNumero));

    // jos paneeli on isolla näytöllä tai tietyssä tilanteessa pienellä näytöllä, vähennetään aikataulun korkeudesta 10
    let lisa = 10;
    // haetaan paneelin ja aikataulu-osan mitat
    let paneelinMitat = document.querySelector('#paneeli').getBoundingClientRect();
    let aikataulunMitat = document.querySelector('#aikataulu').getBoundingClientRect();

    // onko paneeli pienellä näytöllä ja aikataulun korkeus ei ylitä paneelin maksimikorkeutta --> lisää ei tarvita
    if (onkoPieniNaytto() && aikataulunMitat.top + aikataulunMitat.height < paneelinMitat.bottom) lisa = 0;

    // lasketaan aikataulu-osan uusi korkeus ja asetetaan se aikataulun maxHeightiksi
    let aikataulunUusiKorkeus = Math.round(aikataulunMitat.height + paneelinMitat.bottom - aikataulunMitat.bottom - lisa);
    document.querySelector('#aikataulu').style.maxHeight = aikataulunUusiKorkeus + 'px';
}

// tuo vasemmasta laidasta näytölle paneelin, jossa esitetään junan tiedot ja aikataulu
function naytaPaneeli() {
    document.querySelector('#paneeli').style.left = '0px';
    document.querySelector('#pienenna').classList.remove('kaanna');
}

// testaa onko käytössä pieni näyttö samoilla arvoilla, jotka ovat käytössä css-tiedostossa
// Palauttaa: true, jos käytössä on pieni näyttö (leveys max. 700 tai korkeus max. 600 pikseliä) tai false, jos käytössä ei ole pieni näyttö
function onkoPieniNaytto() {
    // vastaako media query pienen näytön arvoja?
    return window.matchMedia('(max-width: 700px), (max-height: 600px)').matches;
}

// laskee paneelin maksimikorkeuden näytön kokoon suhteutettuna
function laskePaneelinKorkeus() {
    // haetaan laskennassa tarvittavat tiedot
    let marginaalit = onkoPieniNaytto() ? 10 : 20;
    let paneeli = document.querySelector('#paneeli');
    let ylareuna = parseInt(window.getComputedStyle(paneeli).top.replace('px', ''));

    // päivitetään paneelin maksimikorkeus
    paneeli.style.maxHeight = window.innerHeight - ylareuna - marginaalit + 'px';

    // onko paneeli pienennettynä ja ikkunan koko vaihtui pienestä isoksi?
    // tuodaan sivupaneeli tällöin näkyville
    if (window.getComputedStyle(paneeli).left != '0px' && window.getComputedStyle(paneeli).left != '-400px') {
        paneeli.style.left = '0px';
        document.querySelector('#pienenna').classList.remove('kaanna');
    }
}

// "pienentää" paneelin vasempaan sivuun, käytössä vain "pienillä" näytöillä
function pienennaPaneeli() {
    let paneeli = document.querySelector('#paneeli');
    // onko paneeli kokonaan esillä?
    if (paneeli.style.left == '0px') {
        // kyllä, paneeli on kokonaan esillä, joten pienennetään se sivuun
        // käännetään pienennysnappia 180 astetta
        document.querySelector('#pienenna').classList.add('kaanna');
        paneeli.style.left = '-236px';
    } else {
        // ei, paneeli on jo pienennettynä, tuodaan se kokonaan esille
        // poistetaan pienennysnapin kääntö
        document.querySelector('#pienenna').classList.remove('kaanna');
        paneeli.style.left = '0px';
    }
}

// sulkee paneelin
function suljePaneeli() {
    // poistetaan valitun junan valinta
    poistaValinta();
    // siirretään paneeli pois näkyvistä
    document.querySelector('#paneeli').style.left = '-400px';
}


function paivitaTiedotOsio(junanNumero) {
 
    let indeksi=  etsiJunaTaulukosta(junanNumero);
   
    // Junan nimi
   
   document.querySelector("#junannimi").innerHTML = junat[indeksi].tiedot.nimi;
   
   // Operaattori
   
   document.querySelector("#operaattori").innerHTML = junat[indeksi].tiedot.operaattori;
   
   // Lähtöpaikka ja Määränpää
   
   document.querySelector("#lahtopaikkaJaMaaranpaa").innerHTML = junat[indeksi].tiedot.lahtopaikka + ' - ' + junat[indeksi].tiedot.maaranpaa;
   
   // Nopeus
   
   document.querySelector("#nopeus").innerHTML = 'Nopeus: ' + junat[indeksi].tiedot.nopeus + ' km/h';
   
   // Aikaero
   
   
   if(junat[indeksi].tiedot.aikaero < -1) {
   document.querySelector("#aikaEro").innerHTML = Math.abs(junat[indeksi].tiedot.aikaero) + ' minuuttia etuajassa';
   }
   if(junat[indeksi].tiedot.aikaero == -1) {
     document.querySelector("#aikaEro").innerHTML = 'Minuutin etuajassa';
   }
     if(junat[indeksi].tiedot.aikaero == 0) {
       document.querySelector("#aikaEro").innerHTML = 'Aikataulussa';
     }
   
     if(junat[indeksi].tiedot.aikaero == 1) {
       document.querySelector("#aikaEro").innerHTML = 'Minuutin myöhässä';
     } 
    
     if(junat[indeksi].tiedot.aikaero > 1) {
       document.querySelector("#aikaEro").innerHTML = junat[indeksi].tiedot.aikaero + ' minuuttia myöhässä';
     } 
   
     // Seuraava asema
   document.querySelector("#seuraavaAsema").innerHTML = seuraavaAsema(indeksi);
   }

   const aikaElement = document.querySelector(".aika");
const pvmElement = document.querySelector(".paivam");

/**
 * @param {Date} pvm
 */
function formatTime(pvm) {
  const hours24 = pvm.getHours() % 24 || 24;
  const minutes = pvm.getMinutes();
  const isAm = pvm.getHours() < 24;

  return `${hours24.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${isAm ? "" : ""}`;
}

/**
 * @param {Date} pvm
 */
function formatDate(pvm) {
  const Paivat = [
    "Sunnuntai",
    "Maanantai",
    "Tiistai",
    "Keskiviikko",
    "Torstai",
    "Perjantai",
    "Lauantai"
  ];
  const Kuukaudet = [
    "tammikuuta",
    "helmikuuta",
    "maaliskuuta",
    "huhtikuuta",
    "toukokuuta",
    "kesäkuuta",
    "heinäkuuta",
    "elokuuta",
    "syyskuuta",
    "lokakuuta",
    "marraskuuta",
    "joulukuuta"
  ];

  return `${Paivat[pvm.getDay()]} ${pvm.getDate()}. ${Kuukaudet[pvm.getMonth()]
    }  `;
}


setInterval(() => {
  const now = new Date();

  aikaElement.textContent = formatTime(now);
  pvmElement.textContent = formatDate(now);
}, 200);


function haeAsemaTiedot(indeksi) {
    // Tallennetaan html tiedostossa oleva div elementti muuttujaan
    let aikataulu = document.getElementById('aikataulu');
    // Varmistetaan, jos on aikaisempia aikataulutietoja, että ne poistetaan.
    aikataulu.innerHTML = '';
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    // Apumuuttuja, jolla seurataan missä kohtaa aikataulua ollaan menossa while silmukassa.
    let i = 0;
    // Jos juna on saanut aikataulutiedon.
    if (element.akt != null) {
        // Käydään aikataulu läpi while silmukassa.
        while (i < element.akt.timeTableRows.length) {
            // Jos asema on ensimmäinen asema aikataulussa
            if (i == 0) {
                // Haetaan aseman nimi, lähtöaika ja raide numero listaan
                let tiedot = arrivalTiedot(element.akt.timeTableRows[i]);
                // Asetetaan tiedot sivupaneeliin (näytetään ainoastaan lähtöaika)
                rakennaTiedotSivupaneeliinLahto(tiedot);
                // Kasvatetaan apumuuttujaa yhdellä
                i++;
                // Hypätään loput vaiheet tästä while silmukan kierroksesta ja mennään seuraavaan.
                continue;
            }
            // Jos asema on viimeinen asema aikataulussa
            if (i == element.akt.timeTableRows.length - 1) {
                // Haetaan aseman nimi, saapumisaika ja raide numero listaan
                let tiedot = arrivalTiedot(element.akt.timeTableRows[i]);
                // Asetetaan tiedot sivupaneeliin (näytetään ainoastaan saapumisaika)
                rakennaTiedotSivupaneeliinTulo(tiedot);
                // Kasvatetaan apumuuttujaa yhdellä
                i++;
                // Hypätään loput vaiheet tästä while silmukan kierroksesta ja mennään seuraavaan.
                continue;
                // Jos asema ei ole ensimmäinen eikä viimeinen, ja asema on sellainen, jossa pysähdytään.
            } else if (element.akt.timeTableRows[i].commercialStop == true) {
                // Haetaan aseman nimi, lähtöaika, saapumisaika ja raidenumero listaan
                // tiedot haetaan kahdesta seuraavasta aikataulu tiedosta, koska tarvitaan saapumis ja lähtöaika
                let tiedot = arrivalDepartedTiedot(element.akt.timeTableRows[i], element.akt.timeTableRows[i + 1]);
                // Asetetaan tiedot sivupaneeliin (näytetään molemmat lähtö- ja saapumisaika)
                rakennaTiedotSivupaneeliin(tiedot);
                // Kasvatetaan apumuuttujaa kahdella
                i = i + 2;
                // Hypätään loput vaiheet tästä while silmukan kierroksesta ja mennään seuraavaan.
                continue;
            }
            // Kasvatetaan apumuuttujaa yhdellä jos kyseessä on esim sellainen asema jossa ei pysähdytä
            i++;
        }
    }
}
// Kerätään aseman nimi, lähtöaika tai tuloaika riippuen mitä asemaa käydään läpi ja raidenumero
// tiedot asetetaan listaan ja palautetaan lista
function arrivalTiedot(asema) {
    let lista = [];
    let asemaNimi = etsiAsemanNimi(asema.stationUICCode);
    let lahtoaika = new Date(asema.scheduledTime).toLocaleTimeString();
    let raideNro = asema.commercialTrack;
    lista.push(asemaNimi, lahtoaika, raideNro);
    return lista;
}
// Kerätään aseman nimi, lähtöaika, tuloaika (lähtöaika ja tuloaika otetaan kahdesta eri asematiedosta)
// ja raidenumero. Tiedot asetetaan listaan ja palautetaan lista
function arrivalDepartedTiedot(tulo, lahto) {
    let lista = [];
    let asemaNimi = etsiAsemanNimi(tulo.stationUICCode);
    let tuloaika = new Date(tulo.scheduledTime).toLocaleTimeString();
    let lahtoaika = new Date(lahto.scheduledTime).toLocaleTimeString();
    let raideNro = tulo.commercialTrack;
    lista.push(asemaNimi, tuloaika, lahtoaika, raideNro);
    return lista;
}
// Rakennetaan tiedot sivupaneeliin (sisältää lähtö- ja saapumisajan)
function rakennaTiedotSivupaneeliin(lista) {
    // Haetaan html tiedostosta div elementti, jonka id on aikataulu ja asetetaan se muuttujaan
    let aikataulu = document.getElementById('aikataulu');
    // Luodaan div elementti aikataulu boxille ja asetetaan se muuttujaan
    let divContainer = document.createElement('div');
    // Luodaan div elementti nimelle ja raidenumerolle (vasen puoli)ja asetetaan se muuttujaan
    let divAsemaNimi = document.createElement('div');
    // Luodaan div elementti lähtö ja saapumisajalle (oikea puoli) ja asetetaan se muuttujaan
    let divAjat = document.createElement('div');
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divContainer.className = 'mycontainer';
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divAsemaNimi.className = 'asemaNimi';
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divAjat.className = 'ajat';
    // Asetetaan aseman nimi ja laiturin numero div elementtiin
    divAsemaNimi.innerHTML = '<p><b>' + lista[0] + '</b><br />Laituri ' + lista[3] + '</p>';
    // Asetetaan junan lähtö- ja saapumisaika div elementtiin
    divAjat.innerHTML = '<p>' + lista[1] + '<br />' + lista[2] + '</p>';
    // Asetetaan asema nimi div elementti aikataulu boxi div elementin sisälle
    divContainer.appendChild(divAsemaNimi);
    // Asetetaan lähtö- ja saapumisaika div elementti aikataulu boxi div elementin sisälle
    divContainer.appendChild(divAjat);
    // Asetetaan aikataulu boxi div elementti aikataulu div elementin sisälle
    aikataulu.appendChild(divContainer);
}
// Rakennetaan tiedot sivupaneeliin (sisältää lähtöajan)
function rakennaTiedotSivupaneeliinLahto(lista) {
    // Haetaan html tiedostosta div elementti, jonka id on aikataulu ja asetetaan se muuttujaan
    let aikataulu = document.getElementById('aikataulu');
    // Luodaan div elementti aikataulu boxille ja asetetaan se muuttujaan
    let divContainer = document.createElement('div');
    // Luodaan div elementti nimelle ja raidenumerolle (vasen puoli)ja asetetaan se muuttujaan
    let divAsemaNimi = document.createElement('div');
    // Luodaan div elementti lähtöajalle (oikea puoli) ja asetetaan se muuttujaan
    let divAjat = document.createElement('div');
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divContainer.className = 'mycontainer';
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divAsemaNimi.className = 'asemaNimi';
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divAjat.className = 'ajat';
    // Asetetaan aseman nimi ja laiturin numero div elementtiin
    divAsemaNimi.innerHTML = '<p><b>' + lista[0] + '</b><br />Laituri ' + lista[2] + '</p>';
    // Asetetaan junan lähtöaika div elementtiin
    divAjat.innerHTML = '<p><br />' + lista[1] + '</p>';
    // Asetetaan asema nimi div elementti aikataulu boxi div elementin sisälle
    divContainer.appendChild(divAsemaNimi);
    // Asetetaan lähtöaika div elementti aikataulu boxi div elementin sisälle
    divContainer.appendChild(divAjat);
    // Asetetaan aikataulu boxi div elementti aikataulu div elementin sisälle
    aikataulu.appendChild(divContainer);
}
// Rakennetaan tiedot sivupaneeliin (sisältää tuloajan)
function rakennaTiedotSivupaneeliinTulo(lista) {
    // Haetaan html tiedostosta div elementti, jonka id on aikataulu ja asetetaan se muuttujaan
    let aikataulu = document.getElementById('aikataulu');
    // Luodaan div elementti aikataulu boxille ja asetetaan se muuttujaan
    let divContainer = document.createElement('div');
    // Luodaan div elementti nimelle ja raidenumerolle (vasen puoli)ja asetetaan se muuttujaan
    let divAsemaNimi = document.createElement('div');
    // Luodaan div elementti tuloajalle (oikea puoli) ja asetetaan se muuttujaan
    let divAjat = document.createElement('div');
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divContainer.className = 'mycontainer';
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divAsemaNimi.className = 'asemaNimi';
    // Annetaan div elementille class nimi, jolla voidaan esim. antaa elementille muotoiluja
    divAjat.className = 'ajat';
    // Asetetaan aseman nimi ja laiturin numero div elementtiin
    divAsemaNimi.innerHTML = '<p><b>' + lista[0] + '</b><br />Laituri ' + lista[2] + '</p>';
    // Asetetaan junan tuloaika div elementtiin
    divAjat.innerHTML = '<p>' + lista[1] + '<br /></p>';
    // Asetetaan asema nimi div elementti aikataulu boxi div elementin sisälle
    divContainer.appendChild(divAsemaNimi);
    // Asetetaan tuloaika div elementti aikataulu boxi div elementin sisälle
    divContainer.appendChild(divAjat);
    // Asetetaan aikataulu boxi div elementti aikataulu div elementin sisälle
    aikataulu.appendChild(divContainer);
}

// Avataan ja suljetaan asetukset valikko
function openSettings() {
    if (options.style.display === 'none') {
        options.style.display = 'block';
    } else {
        options.style.display = 'none';
    }
}

// Suljetaan asetukset valikko jos klikataan peruuta nappia
function klikattiinPeruuta() {
    options.style.display = 'none';
}

// Tallennetaan asetukset pääohjelmaan jos klikataan tallenna nappia ja suljetaan asetukset valikko
function klikattiinTallenna() {
    seuraaMerkkia = seuraaJunaa.checked;
    zoomaaLahemmas = zoomaus.checked;
    piirraTarkkuus = tarkkusympyra.checked;
    maxTarkkuus = tarkkusympyraTarkkuus.value;
    options.style.display = 'none';
}
