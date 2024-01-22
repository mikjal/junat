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


class junaOlio {
    constructor(junanro) {
        // junan numero
        this.numero = junanro;
        // paikkatieto
        this.pkt = null;

        /*
            this.pkt:
            {
                "trainNumber": 8686,
                "departureDate": "2024-01-19",
                "timestamp": "2024-01-19T13:52:44.000Z",
                "location": {
                    "type": "Point",
                    "coordinates": [
                        24.861881,
                        60.248733
                    ]
                },
                "speed": 64,
                "accuracy": 5
            }
        */

        // aikataulu
        this.akt = null;

        /*
            this.akt:
            {
                "trainNumber": 276,
                "departureDate": "2024-01-21",
                "operatorUICCode": 10,
                "operatorShortCode": "vr",
                "trainType": "PYO",
                "trainCategory": "Long-distance",
                "commuterLineID": "",
                "runningCurrently": true,
                "cancelled": false,
                "version": 287462008896,
                "timetableType": "REGULAR",
                "timetableAcceptanceDate": "2023-08-17T06:37:35.000Z",
                "timeTableRows": [
                    ...
                ]
            }
        */

        // karttamerkki
        this.karttamerkki = null;
        // usein tarvittavia tietoja
        this.tiedot = {
            nimi: null,
            lahtopaikka: null,
            maaranpaa: null,
            nopeus: null,
            aikaero: null
        }
    }
}


/*
class junaolio {
    constructor(junanro) {
        this.numero = junanro;
        // paikkatieto
        this.pkt = null;

        // aikataulu
        this.akt = null;
    

        // karttamerkki
        this.karttamerkki = null;
    }


    paivitaAikataulu(uusiTieto) {
        // tarkistetaan onko vanhaa tietoa olemassa
        if (this.akt) {
            // vanhat aikataulutiedot on olemassa, verrataan versionumeroita
            // jos uuden tiedon versionumero on pienempi kuin jo tallennetun
            // uutta tietoa ei tallenneta
            if (uusiTieto.version > this.akt.version) {
                this.akt = uusiTieto;
                console.log('Aikataulun päivitys',uusiTieto.trainNumber);
            }
        } else {
            this.akt = uusiTieto;
            console.log('Uusi aikataulu',uusiTieto.trainNumber);
        }

        if (this.pkt) this.piirraMerkki();
    }

    paivitaPaikkatieto(uusiPaikkatieto) {
        // tarkistetaan onko vanha paikkatieto olemassa
        if (this.pkt) { // this.pkt != null
            // vanha paikkatieto on olemassa, verrataan aikaleimoja
            // jos uuden paikkatiedon aikaleima on pienempi (=aiempi) kuin jo tallennetun, 
            // uutta paikkatietoa ei tallenneta
            if (new Date(this.pkt.timestamp) < new Date(uusiPaikkatieto.timestamp)) {
                // vanhan paikkatiedon aikaleima on vanhempi kuin uuden, päivitetään paikkatieto
                this.pkt = uusiPaikkatieto;
                // siirretään merkkiä kartalla uuden paikkatiedon mukaisesti
                this.piirraMerkki();
            }
        } else {
            // vanhaa paikkatietoa ei ole olemassa
            this.pkt = uusiPaikkatieto;
            this.piirraMerkki();
        }
    }

    piirraMerkki() {
        // tarkistetaan onko merkki jo olemassa
        if (this.karttamerkki) {
            // merkki on jo olemassa, siirretään sitä
            this.karttamerkki = this.karttamerkki.setLatLng([this.pkt.location.coordinates[1],this.pkt.location.coordinates[0]]);

            if (this.akt) {
                if (this.karttamerkki._icon.classList.contains('harmaa')) {
                    this.karttamerkki._icon.classList.remove('harmaa');
                }
            }
        } else {
            // merkkiä ei vielä ole kartalla, lisätään se
            this.karttamerkki = L.marker([this.pkt.location.coordinates[1],this.pkt.location.coordinates[0]])
                                .bindTooltip(this.numero.toString())
                                .addTo(kartta);
            this.karttamerkki.on('click',() => {
                // tänne tulee funktiokutsu jolla näytetään junan aikataulu
                console.log('Klikattiin junan',this.numero,'merkkiä. Junan nopeus: ',this.pkt.speed);
            });

            if (this.akt == null) this.karttamerkki._icon.classList.add('harmaa');

        }
    }
}
*/

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
    
    let juna = junat[indeksi];

    // tarkistetaan onko merkki jo olemassa
    if (juna.karttamerkki) {
        // merkki on jo olemassa, siirretään sitä
        junat[indeksi].karttamerkki = juna.karttamerkki.setLatLng([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]]);

    } else {
        // merkkiä ei vielä ole kartalla, lisätään se
        let uusiKarttamerkki = L.marker([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]])
        .bindTooltip(juna.numero.toString())
        .addTo(kartta);

        uusiKarttamerkki.on('click',() => {
        // tänne tulee funktiokutsu jolla näytetään junan aikataulu
        console.log('Klikattiin junan',juna.numero,'merkkiä.');
        });

        junat[indeksi].karttamerkki = uusiKarttamerkki;
    }
        
}

function paivitaJunanPaikkatieto(uusiPaikkatieto) {
    // tarkistetaan löytyykö juna jo taulukosta
    let indeksiTaulukossa = etsiJunaTaulukosta(uusiPaikkatieto.trainNumber);

    if (indeksiTaulukossa == -1) {
        // junaa ei löydy taulukosta, luodaan se
        let uusiJuna = new junaOlio(uusiPaikkatieto.trainNumber);
        indeksiTaulukossa = junat.push(uusiJuna) - 1;
    }

    //junat[indeksiTaulukossa].paivitaPaikkatieto(paikkatieto);
    let vanhaPaikkatieto = junat[indeksiTaulukossa].pkt;

    // tarkistetaan löytyykö vanha paikkatieto
    if (vanhaPaikkatieto) {
        // vanha paikkatieto on olemassa, verrataan aikaleimoja
        // jos uuden paikkatiedon aikaleima on pienempi (=aiempi) kuin jo tallennetun, 
        // uutta paikkatietoa ei tallenneta
        if (new Date(vanhaPaikkatieto.timestamp) < new Date(uusiPaikkatieto.timestamp)) {
                // vanhan paikkatiedon aikaleima on vanhempi kuin uuden, päivitetään paikkatieto
                junat[indeksiTaulukossa].pkt = uusiPaikkatieto;
        } 
    } else {
            // vanhaa paikkatietoa ei ole olemassa
            junat[indeksiTaulukossa].pkt = uusiPaikkatieto;
        }

    piirraKarttamerkki(indeksiTaulukossa);
}

function paivitaJunanAikataulu(tieto) {
    // tarkistetaan löytyykö juna jo taulukosta
    let indeksiTaulukossa = etsiJunaTaulukosta(tieto.trainNumber);

    if (indeksiTaulukossa == -1) {
        // junaa ei löydy taulukosta, luodaan se
        let uusiJuna = new junaOlio(tieto.trainNumber);
        indeksiTaulukossa = junat.push(uusiJuna) - 1;
    }

    //junat[indeksiTaulukossa].paivitaAikataulu(tieto);
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
    // tarkistetaan onko saapunut tieto junan paikkatieto
    // vai junan tieto (sisältäen mm. aikataulun)
    if (kohdetieto.includes('train-locations')) {
        // junan paikkatieto
        paivitaJunanPaikkatieto(JSONtieto);
    } else if (kohdetieto.includes('trains')) {
        // tieto junasta (mm. junan tyyppi, operaattori, aikataulu)
        //console.log('Junan nro',JSONtieto.trainNumber,'tiedot');
        paivitaJunanAikataulu(JSONtieto);
    }
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
