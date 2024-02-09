function tietojenHaku(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    // Tallennetaan operaattoreista lista muuttujaan
    let operaattoriLista = mt.operaattorit.tiedot;
    // Määritellään junatyypeistä lyhenne ja kokonimi
    let junatyypit = {
        HSM: 'Taajamajuna',
        HDM: 'Taajamajuna',
        IC: 'InterCity',
        MUS: 'Museojuna',
        MV: 'Kalustonsiirtojuna (kaukoliikenne)',
        P: 'Pikajuna',
        PYO: 'Yöpikajuna',
        S: 'Pendolino',
        AE: 'Allegro',
        PVV: 'Pikajuna (Venäjä)',
        HL: 'Lähijuna',
        HV: 'Kalustonsiirtojuna (lähiliikenne)',
        HLV: 'Veturivetoinen (lähiliikenne)',
        PAI: 'Vaihtotyö',
        T: 'Tavarajuna',
        LIV: 'Radantarkastusvaunu',
        MUV: 'Museojuna (vaihtotyö)',
        PAI: 'Päivystäjä (veturi)',
        SAA: 'Saatto',
        TYO: 'Työjuna',
        VET: 'Veturijuna',
        VEV: 'Veturijuna',
        VLI: 'Lisäveturi (vaihtotyö veturina)',
        W: 'Vaihtotyö',
    };
    // Tehdään junatyypeistä nimiparit (Saadaan sekä lyhenne, että nimi käyttöön)
    let nimiParit = Object.entries(junatyypit);
    // Jos aikataulut löytyvät junat oliosta...
    if (element.akt != null) {
        // Käydään hakemassa kyseisen junan lähtöpaikka aikatauluista ja asetetaan se junat olioon
        element.tiedot.lahtopaikka = etsiAsemanNimi(element.akt.timeTableRows[0].stationUICCode);
        // Käydään hakemassa kyseisen junan määränpää aikatauluista ja asetetaan se junat olioon
        element.tiedot.maaranpaa = etsiAsemanNimi(element.akt.timeTableRows[element.akt.timeTableRows.length - 1].stationUICCode);
        // Tarkistetaan löytyykö operaattori lista
        if (operaattoriLista) {
            // Verrataan junan operaattori lyhennettä ja jos se on sama lyhenne asetetaan operaattorin
            // nimi junat olioon
            operaattoriLista.forEach((operaattori) => {
                if (operaattori.operatorShortCode == element.akt.operatorShortCode) {
                    element.tiedot.operaattori = operaattori.operatorName;
                }
            });
            // Jos operaattori listaa ei löydy annetaan virheilmoitus konsoliin
        } else {
            console.log('Operaattori listaa ei löydy!');
        }
        // Asetetaan junan lyhenne ja numero siltävaralta, että junaa ei löydy nimipari listasta
        element.tiedot.nimi = element.akt.trainType + element.numero;
        // Käydään nimiparit lista läpi ja jos kyseessä on lähijuna asetetaan nimeksi Lähijuna + junan kirjain
        // ja jos on kyseessä muu juna asetetaan junan nimi + junan numero
        nimiParit.map(([key, val] = entry) => {
            if (element.akt.trainType == key) {
                if (val == 'Lähijuna') {
                    element.tiedot.nimi = val + ' ' + element.akt.commuterLineID;
                } else {
                    element.tiedot.nimi = val + ' ' + element.numero;
                }
            }
        });
    }
}

function aikatauluTarkistus(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    // Tehdään muuttuja
    let aikaero = null;
    // Käydään aikataulu läpi ja jos juna on saapunut asemalle tallennetaan tieto siitä onko juna myöhässä (luku positiivinen)
    // vai etuajassa (luku negatiivinen) tieto aina ylikirjoitetaan samaan muuttujaan, joten viimeinen arvo
    // jää muuttujan arvoksi ja se asetetaan junat olioon.
    element.akt.timeTableRows.forEach((asema) => {
        if (asema.actualTime !== undefined) {
            aikaero = asema.differenceInMinutes;
        }
    });
    element.tiedot.aikaero = aikaero;
}

function onkoPerilla(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    // Katsotaan onko aikatauluissa oleva viimeinen asema saanut saapumisaikaa ja jos on niin palautetaan
    // se ja jos ei niin palautetaan null.
    if (element.akt.timeTableRows[element.akt.timeTableRows.length - 1].actualTime !== undefined) {
        return element.akt.timeTableRows[element.akt.timeTableRows.length - 1].actualTime;
    } else {
        return null;
    }
}

function seuraavaAsema(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    // Luodaan teksti niminen muuttuja
    let teksti = '';
    // Luodaan teksti niminen muuttuja
    let aika;
    // Jos junalta löytyy aikataulu käydään sieltä asemat läpi ja asetetaan tekstimuuttujaan sopiva teksti riippuen
    // missä juna on menossa.
    if (element.akt != null) {
        element.akt.timeTableRows.forEach((asema, index) => {
            if (element.akt.timeTableRows[0].actualTime == undefined && element.pkt.speed == 0) {
                // jos juna on lähtöasemalla ja vielä paikallaan
                teksti = 'Lähtee klo ' + new Date(element.akt.timeTableRows[0].scheduledTime).toLocaleTimeString();
            }
            if (asema.actualTime !== undefined) {
                if (index == element.akt.timeTableRows.length - 1) {
                    // jos juna on pääteasemalla
                    teksti =
                        'Pääteasema ' +
                        etsiAsemanNimi(element.akt.timeTableRows[index].stationUICCode) +
                        ' (' +
                        new Date(element.akt.timeTableRows[index].actualTime).toLocaleTimeString() +
                        ')';
                } else if (element.akt.timeTableRows[index + 1]) {
                    if (element.akt.timeTableRows[index + 1].trainStopping == false) {
                        if (element.akt.timeTableRows[index + 1].liveEstimateTime) {
                            aika = new Date(element.akt.timeTableRows[index + 1].liveEstimateTime).toLocaleTimeString();
                        } else if (element.akt.timeTableRows[index + 1].scheduledTime) {
                            aika = new Date(element.akt.timeTableRows[index + 1].scheduledTime).toLocaleTimeString();
                        }
                        // Jos juna ei pysähdy seuraavalla asemalla
                        teksti = 'Seuraavana ohittaa aseman ' + etsiAsemanNimi(element.akt.timeTableRows[index + 1].stationUICCode) + ' (' + aika + ')';
                    } else {
                        if (element.akt.timeTableRows[index + 1].liveEstimateTime) {
                            aika = new Date(element.akt.timeTableRows[index + 1].liveEstimateTime).toLocaleTimeString();
                        } else if (element.akt.timeTableRows[index + 1].scheduledTime) {
                            aika = new Date(element.akt.timeTableRows[index + 1].scheduledTime).toLocaleTimeString();
                        }
                        // Jos juna pysähtyy seuraavalla asemalla
                        teksti = 'Seuraavana ' + etsiAsemanNimi(element.akt.timeTableRows[index + 1].stationUICCode) + ' (' + aika + ')';
                    }
                }
            }
        });
        return teksti;
    }
}

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
