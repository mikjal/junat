let kartta,
    MQTTyhteys,
    debug = false,
    junat = [],
    paivitysjono = [],
    pysaytaPaivitys = false,
    valittuJuna = -1,
    paivitysLaskuri = 0;

// metatiedot
const mt = {
    operaattorit: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/operators',
        tiedot: null,
    },
/*
    junatyypit: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/train-types',
        tiedot: null,
    },
*/
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
/*
    junat: {
        osoite: 'https://rata.digitraffic.fi/api/v1/live-trains',
        tiedot: null,
    },
*/
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
// Parametrit: etsittävän junan numero
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

        if (juna.akt && juna.tiedot.nimi) {
            if (juna.karttamerkki._icon.classList.contains('harmaa')) {
                juna.karttamerkki._icon.classList.remove('harmaa');
            }

            let tooltipTeksti = (juna.tiedot.nimi) ? '<strong>'+juna.tiedot.nimi+'</strong>' : juna.numero.toString();
            tooltipTeksti += (juna.tiedot.lahtopaikka && juna.tiedot.maaranpaa) ? '<br>' + juna.tiedot.lahtopaikka + ' - ' + juna.tiedot.maaranpaa : '';
            tooltipTeksti += (juna.tiedot.operaattori) ? '<br>' + juna.tiedot.operaattori : '';
            if (juna.tiedot.aikaero != null) {
                tooltipTeksti += (juna.tiedot.aikaero < 0) ? '<br>'+Math.abs(juna.tiedot.aikaero)+' minuuttia etuajassa' : (juna.tiedot.aikaero == 0) ? '<br>Aikataulussa' : '<br>'+juna.tiedot.aikaero+' minuuttia myöhässä';
            }
            tooltipTeksti += (juna.tiedot.nopeus != null) ? '<br>Nopeus: ' + juna.tiedot.nopeus + ' km/h' : '';
            tooltipTeksti += (juna.pkt) ? '<br>Päivitetty '+(new Date(juna.pkt.timestamp)).toLocaleTimeString() : '';

            juna.karttamerkki.setTooltipContent(tooltipTeksti);
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

    if (juna.akt == null && juna.tiedot.nimi == null) {
        juna.karttamerkki._icon.classList.add('harmaa');
    }
        
}

function poistaKarttamerkki(indeksi) {
    if (junat[indeksi].karttamerkki) junat[indeksi].karttamerkki.removeFrom(kartta);
}

function paivitaJunanTiedot(JSONtieto) {
    // tarkistetaan että tiedoissa on junan numero
    if (JSONtieto.hasOwnProperty('trainNumber')) {
        // junan numero löytyy, selvitetään onko juna jo taulukossa
        let junanIndeksi = etsiJunaTaulukosta(JSONtieto.trainNumber)

        // jos junaIndeksi == -1, junaa ei löytynyt taulukosta
        if (junanIndeksi == -1) {
            // junaa ei löydy taulukosta, lisätään se
            let uusiJuna = new junaPohja(JSONtieto.trainNumber);
            junanIndeksi = junat.push(uusiJuna) - 1;
            // lisätään juna aikataulutietojen päivitysjonoon
            paivitysjono.unshift(JSONtieto.trainNumber);
        }

        // luodaan viittaus junat-taulukossa olevaan juna-olioon
        let juna = junat[junanIndeksi];

        // onko kysessä paikkatieto (paikkatieto sisältää timestampin)?
        if (JSONtieto.hasOwnProperty('timestamp')) {
            // käsitellään paikkatieto
            // tarkistetaan löytyykä vanha paikkatieto
            if (juna.pkt) { // juna.pkt != null
                // löytyy vanha paikkatieto, verrataan tietojen aikaleimoja:
                // jos uuden paikkatiedon aikaleima on pienempi (= vanhempi) tai yhtäsuuri
                // kuin jo tallennetun, niin paikkatietoa ei tarvitse tallentaa
                if (new Date(JSONtieto.timestamp) <= new Date(juna.pkt.timestamp)) {
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

        }  // tarkistetaan onko tiedoissa version, jolloin kyseessä on muut junan tiedot
        else if (JSONtieto.hasOwnProperty('version')) {
            // käsitellään junan tiedot

            // päivitetään junan tietoja päivitysjonossa
            paivitysjono.splice(paivitysjono.indexOf(JSONtieto.trainNumber),1);
            paivitysjono.push(JSONtieto.trainNumber);

            // tarkistetaan löytyykö vanha tieto
            if (juna.akt) {
                // löytyy vanha tieto, verrataan versionumeroa:
                // jos uuden tiedon versionumero on pienempi kuin vanhan
                // uutta tietoa ei tallenneta
                if (JSONtieto.version <= juna.akt.version) {
                    // uuden tiedon versionumero on pienempi kuin jo tallennetun, poistutaan funktiosta
                    return
                }
                
                // päivitetään junan tiedot
                juna.akt = JSONtieto;
                // päivitetään tieto siitä onko juna aikataulussa vai etuajassa/myöhässä
                aikatauluTarkistus(junanIndeksi);


            } else {
                // vanhoja tietoja ei löydy
                // kutsutaan funktiota joka luo junalle perustiedot
                juna.akt = JSONtieto;
                tietojenHaku(junanIndeksi);
                aikatauluTarkistus(junanIndeksi);
            }


            // piirretään karttamerkki
            piirraKarttamerkki(junanIndeksi);

        }
    }
}

function poistaJuna(junanNumero) {
    let indeksi = etsiJunaTaulukosta(junanNumero);

    if (indeksi != -1) {

        let poista = false;

        if (junat[indeksi].pkt) {
            let edellinenPaivitysaika = new Date(junat[indeksi].pkt.timestamp);
            let nyt = new Date();

            if (nyt-edellinenPaivitysaika > 60000) poista = true;
            
        } else poista = true;

        if (poista) {
            poistaKarttamerkki(indeksi);
            junat.splice(indeksi,1);
            paivitysjono = paivitysjono.filter((numero) => {
                return numero != junanNumero;
            });

            if (valittuJuna == junanNumero) {
                valittuJuna = -1;
                // funktiokutsu, jolla suljetaan sivupaneeli
            }
    
        }
    }
}

function paivitaKaikkiPaikkatiedot() {
    
    // lisätään kaikki junat poistettavien listalle
    let poistettavat = []
    junat.forEach((juna) => {
        poistettavat.push(juna.numero);
    });

    haeJSON('https://rata.digitraffic.fi/api/v1/train-locations/latest/', (virhekoodi, vastaus) => {
        if (virhekoodi) console.warn('Virhe haettaessa kaikkien junien paikkatietoja!\n', virhekoodi);
        else {
            pysaytaPaivitys = true;
            vastaus.forEach((rivi) => {
                paivitaJunanTiedot(rivi);
                poistettavat = poistettavat.filter((numero) => {
                    return numero != rivi.trainNumber;
                })
            });
            pysaytaPaivitys = false;
            console.log('Poistettavat junat: ',poistettavat);
            if (poistettavat.length > 0) {
                poistettavat.forEach((numero) => {
                    poistaJuna(numero);
                })
            }
        }
    });

}

function ajastettuPaivitys() {
    paivitysLaskuri += 1;
    if (paivitysLaskuri == 6) {
        paivitysLaskuri = 0;
        paivitaKaikkiPaikkatiedot();
    } else {
        let paivitystenMaara = (paivitysjono.length >= 10) ? 10 : paivitysjono.length;
        for (let i=0; i<paivitystenMaara; i++) {
            if (typeof paivitysjono[i] === 'number') {
                haeJSON('https://rata.digitraffic.fi/api/v1/trains/latest/'+paivitysjono[i], (virhekoodi, vastaus) => {
                    if (virhekoodi) console.warn('Virhe haettaessa junan',paivitysjono[i],'tietoja!\n', virhekoodi);
                    else {
                        paivitaJunanTiedot(vastaus[0]);
                    } 
                });
            } // if
        } // for
    } // else
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


/*
function kasitteleMQTTJSON(kohdetieto,JSONtieto) {

    // tarkistetaan onko kyseessä paikkatieto, jos on onkoPaikkatieto=true,
    // jos ei ole paikkatieto, tarkistetaan onko kyseessä junan tiedot, 
    // jos on junan tiedot onkoPaikkatieto=false,
    // jos ei ole paikkatieto eikä junan tieto niin palautetaan null
    let onkoPaikkatieto = (kohdetieto.includes('train-locations')) ? true : (kohdetieto.includes('trains')) ? false : null;

    // jos onkoPaikkatieto on jotain muuta kuin null, päivitetään junan tiedot
    if (onkoPaikkatieto != null) paivitaJunanTiedot(onkoPaikkatieto, JSONtieto);
}
*/

function asetaMQTTkuuntelija() {
    MQTTyhteys = new Paho.MQTT.Client('rata.digitraffic.fi', 443, 'myclientid_' + parseInt(Math.random() * 10000, 10));

    // Mitä tapahtuu jos yhteys katkeaa:
    MQTTyhteys.onConnectionLost = function (responseObject) {
        console.warn('MQTT-yhteys katkesi: ' + responseObject.errorMessage);
    };

    // Mitä tehdään kun viesti saapuu:
    MQTTyhteys.onMessageArrived = function (message) {
        if (!pysaytaPaivitys) paivitaJunanTiedot(JSON.parse(message.payloadString));
        else console.log('MQTT-päivitys ohitettu');
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
            //asemanimi = asemanimi.replace('tavara', '(tavara)');
            //asemanimi = asemanimi.replace('lajittelu', '(lajittelu)');
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

    setInterval(ajastettuPaivitys, 5000);
};
