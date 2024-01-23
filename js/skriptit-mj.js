let kartta,
    MQTTyhteys,
    debug = false,
    junat = [];

// metatiedot
const mt = {
    operaattorit: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/operators',
        tiedot: null,
    },
    junatyypit: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/train-types',
        tiedot: null,
    },
    liikennepaikat: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/stations',
        tiedot: null,
    },
    syyluokat: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/cause-category-codes',
        tiedot: null,
    },
    syykoodit: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/detailed-cause-category-codes',
        tiedot: null,
    },
    kolmastaso: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/third-cause-category-codes',
        tiedot: null,
    },
    junat: {
        osoite: 'https://rata.digitraffic.fi/api/v1/live-trains',
        tiedot: null,
    },
};

class junaPohja {
    constructor(junanro) {
        // junan numero
        this.numero = junanro;
        // paikkatieto
        this.pkt = null;
        // aikataulu
        this.akt = null;
        // karttamerkki
        this.karttamerkki = null;
        // usein tarvittavia tietoja
        this.tiedot = {
            nimi: null,
            lahtopaikka: null,
            maaranpaa: null,
            nopeus: null,
            aikaero: null,
            operaattori: null
        }
    }
}

// Etsii junan indeksinumeron junat-taulukosta
// Paramterit: etsittävän junan numero
// Palauttaa: junan indeksinumeron junat-taulukossa tai -1 jos junaa ei löydy
function etsiJunaTaulukosta(junanNumero) {
    
    let indeksi = junat.findIndex((juna) => {
        return juna.numero == junanNumero;
    });

    return indeksi;

}

function piirraKarttamerkki(indeksi) {
    
    // heataan viittaus junaan
    let juna = junat[indeksi];

    // tarkistetaan onko merkki jo olemassa
    if (juna.karttamerkki) {
        // merkki on jo olemassa, siirretään sitä
        juna.karttamerkki.setLatLng([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]]);


        if (juna.akt) {
            if (juna.karttamerkki._icon.classList.contains('harmaa')) {
                juna.karttamerkki._icon.classList.remove('harmaa');
            }

            if (juna.tiedot.lahtopaikka && juna.tiedot.maaranpaa && juna.tiedot.operaattori) {
                juna.karttamerkki.setTooltipContent(juna.numero.toString()+'<br>'+juna.tiedot.lahtopaikka+' - '+juna.tiedot.maaranpaa+'<br>'+juna.tiedot.operaattori);
            }
        }

    } else {
        // merkkiä ei vielä ole kartalla, lisätään se
        // varmistetaan ensin että paikkatieto on olemassa
        if (juna.pkt) {
            let uusiKarttamerkki = L.marker([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]])
            .bindTooltip(juna.numero.toString())
            .addTo(kartta);
    
            uusiKarttamerkki.on('click',() => {
            // tänne tulee funktiokutsu jolla näytetään junan aikataulu
            console.log('Klikattiin junan',juna.numero,'merkkiä.');
            });
    
            juna.karttamerkki = uusiKarttamerkki;
    
        }
    }

    if (juna.akt == null) juna.karttamerkki._icon.classList.add('harmaa');
        
}

function paivitaJunanTiedot(onkoPaikkatieto, JSONtieto) {
    // tarkistetaan että tiedoissa on junan numero
    if (JSONtieto.hasOwnProperty('trainNumber')) {
        // junan numero löytyy, selvitetään onko juna jo taulukossa
        let junanIndeksi = etsiJunaTaulukosta(JSONtieto.trainNumber)

        // jos junaIndeksi == -1, junaa ei löytynyt taulukosta
        if (junanIndeksi == -1) {
            // junaa ei löydy taulukosta, lisätään se
            let uusiJuna = new junaPohja(JSONtieto.trainNumber);
            junanIndeksi = junat.push(uusiJuna) - 1;
        }

        // luodaan viittaus junat-taulukossa olevaan juna-olioon
        let juna = junat[junanIndeksi];

        // tuplavarmistus: onko kysessä paikkatieto?
        if (onkoPaikkatieto && JSONtieto.hasOwnProperty('timestamp')) {
            // käsitellään paikkatieto
            // tarkistetaan löytyykä vanha paikkatieto
            if (juna.pkt) { // juna.pkt != null
                // löytyy vanha paikkatieto, verrataan tietojen aikaleimoja:
                // jos uuden paikkatiedon aikaleima on pienempi (= vanhempi)
                // kuin jo tallennetun, niin paikkatietoa ei tarvitse tallentaa
                if (new Date(JSONtieto.timestamp) < new Date(juna.pkt.timestamp)) {
                    // uusi paikkatieto on vanhempi kuin jo tallennettu, poistutaan funktiosta
                    return
                }
            }
            // vanhaa paikkatietoa ei ole tai se on vanhempi kuin uusi tieto
            // tallennetaan uusi paikkatieto
            juna.pkt = JSONtieto;
            juna.tiedot.nopeus = JSONtieto.speed;
            
            // piirretään karttamerkki
            piirraKarttamerkki(junanIndeksi);

        }  // onkoPaikkatieto == false, varmistetaan että JSON-tiedoista löytyy version
        else if (JSONtieto.hasOwnProperty('version')) {
            // käsitellään junan tiedot
            // tarkistetaan löytyykö vanha tieto
            if (juna.akt) {
                // löytyy vanha tieto, verrataan versionumeroa:
                // jos uuden tiedon versionumero on pienempi kuin vanhan
                // uutta tietoa ei tallenneta
                if (JSONtieto.version < juna.akt.version) {
                    // uuden tiedon versionumero on pienempi kuin jo tallennerun, poistutaan funktiosta
                    return
                }
                juna.akt = JSONtieto;
            } else {
                // vanhoja tietoja ei löydy
                // kutsutaan funktiota joka luo junalle perustiedot
                juna.akt = JSONtieto;
                tietojenHaku(junanIndeksi);
            }
            
            // piirretään karttamerkki
            piirraKarttamerkki(junanIndeksi);

        }
    }
}


function luoKartta() {
    // Luodaan kartta ilman zoomausnappuloita (tulevat oletuksena ylös vasemmalle)
    kartta = new L.map('kartta-alue', {
        zoomControl: false,
        center: [62.95772, 26.05957],
        zoom: 7,
    });

    // Lisätään rasteri-kerroksena karttakuvat
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap-kartoittajat</a> | Liikennetietojen lähde <a href="https://rata.digitraffic.fi">Fintraffic / digitraffic.fi, lisenssi CC 4.0 BY</a>',
    }).addTo(kartta);

    // Lisätään zoom-napit oikealle ylös
    L.control
        .zoom({
            position: 'topright',
        })
        .addTo(kartta);
}

function haeJSON(osoite, paluufunktio) {
    fetch(osoite) // haetaan tiedot osoitteesta
        .then((vastaus) => {
            // fetch palauttaa Promisen
            if (!vastaus.ok) {
                paluufunktio(vastaus.status, null);
            }
            return vastaus.json();
        })
        .then((vastaus) => {
            // käsitellään seuraava Promise, jotta saadaan varsinainen vastaus
            paluufunktio(null, vastaus);
        })
        .catch((virhe) => {
            // virhetilanne
            paluufunktio(virhe, null);
        });
}


function kasitteleMQTTJSON(kohdetieto,JSONtieto) {

    // tarkistetaan onko kyseessä paikkatieto, jos on onkoPaikkatieto=true,
    // jos ei ole paikkatieto, tarkistetaan onko kyseessä junan tiedot, 
    // jos on junan tiedot onkoPaikkatieto=false,
    // jos ei ole paikkatieto eikä junan tieto niin palautetaan null
    let onkoPaikkatieto = (kohdetieto.includes('train-locations')) ? true : (kohdetieto.includes('trains')) ? false : null;

    // jos onkoPaikkatieto on jotain muuta kuin null, päivitetään junan tiedot
    if (onkoPaikkatieto != null) paivitaJunanTiedot(onkoPaikkatieto, JSONtieto);

    /*
    if (kohdetieto.includes('train-locations')) {
        // junan paikkatieto
        paivitaJunanPaikkatieto(JSONtieto);
    } else if (kohdetieto.includes('trains')) {
        // tieto junasta (mm. junan tyyppi, operaattori, aikataulu)
        //console.log('Junan nro',JSONtieto.trainNumber,'tiedot');
        paivitaJunanAikataulu(JSONtieto);
    }
    */
}

function asetaMQTTkuuntelija() {
    MQTTyhteys = new Paho.MQTT.Client('rata.digitraffic.fi', 443, 'myclientid_' + parseInt(Math.random() * 10000, 10));

    // Mitä tapahtuu jos yhteys katkeaa:
    MQTTyhteys.onConnectionLost = function (responseObject) {
        console.warn('MQTT-yhteys katkesi: ' + responseObject.errorMessage);
    };

    // Mitä tehdään kun viesti saapuu:
    MQTTyhteys.onMessageArrived = function (message) {
        kasitteleMQTTJSON(message.destinationName,JSON.parse(message.payloadString));
    };

    let maaritykset = {
        useSSL: true,
        timeout: 3,
        onSuccess: function () {
            // Yhteyden muodostuessa tilataan junien paikkatieto
            MQTTyhteys.subscribe('train-locations/#', { qos: 0 });
            // Sekä junien tiedot
            MQTTyhteys.subscribe('trains/#', { qos: 0 });
        },
        onFailure: function (message) {
            // Yhteyden muodostaminen epäonnistui
            console.warn('MQTT-yhteyden muodostaminen epäonnistui: ' + message.errorMessage);
        },
    };

    MQTTyhteys.connect(maaritykset);
}

// käynnistetään metatietojen lataaminen
for (let nimi in mt) {
    haeJSON(mt[nimi].osoite, (virhekoodi, vastaus) => {
        if (virhekoodi) console.warn('Virhe haettaessa metatietoja: ' + nimi + '\n', virhekoodi);
        else {
            mt[nimi].tiedot = vastaus;
            if (debug) console.log('Haettu metatiedot:', nimi, vastaus);
        }
    });
}

function etsiAsemanNimi(uic) {
    // Tarkistetaan onko liikennepaikkojen metatiedot käytettävissä
    if (mt.liikennepaikat.tiedot) {
        // Käydään läpi kaikki liikennepaikat ja etsitään löytyykö paikka jossa 
        // stationUICCode on sama kuin parametrina annettu uic
        let indeksi = mt.liikennepaikat.tiedot.findIndex((asema) => {
            return uic == asema.stationUICCode;
        });
        // Jos indeksi = -1 liikennepaikkaa ei löytynyt. Jos indeksi on jotain 
        // muuta, se sisältää paikan taulukossa josta liikennepaikka löytyi
        if (indeksi != -1) {
            // asetetaan asemanimeksi stationName
            let asemanimi = mt.liikennepaikat.tiedot[indeksi].stationName;
            // poistetaan asema-sana, jos sellainen löytyy
            asemanimi = asemanimi.replace(' asema', '');
            asemanimi = asemanimi.replace('tavara', '(tavara)');
            asemanimi = asemanimi.replace('lajittelu', '(lajittelu)');
            // palautetaan asemanimi
            return asemanimi;
        }
    }
    // Jos metatietoja ei ole tai jos asemaa ei parametrinä annetun uic:n perusteella löytynyt, palautetaan null
    return null;
}

window.onload = () => {
    luoKartta();

    asetaMQTTkuuntelija();

};
