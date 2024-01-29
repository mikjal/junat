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
        // milloin olio on luotu
        this.luotu = new Date();
        // milloin viimeisin päivitys tietoihin
        this.paivitettyViimeksi = null;
        // lasketaan montako kertaa sama paikkatieto tulee peräkkäin
        this.paikkatietolaskuri = 0;
        // piirretäänkö karttamerkki vai ei
        this.piirraMerkki = true;
        // voiko karttamerkin valita kartalta (klikkaus/kosketus)
        this.merkkiValittavissa = false;
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

function paivitaKarttamerkki(indeksi) {
    
    // heataan viittaus junaan
    let juna = junat[indeksi];

    // saako karttamerkin piirtaa kartalle
    if (juna.piirraMerkki) {
        // tarkistetaan onko merkki jo olemassa
        if (juna.karttamerkki) {
            // merkki on jo olemassa, siirretään sitä
            juna.karttamerkki.setLatLng([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]]);

        } else {
            // merkkiä ei vielä ole kartalla, lisätään se
            // varmistetaan ensin että paikkatieto on olemassa
            if (juna.pkt) {
                let uusiKarttamerkki = L.marker([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]])
                .bindTooltip(juna.numero.toString())
                .addTo(kartta);
        
                // jos junalla ei ole aikataulutietoja, muutetaan sen harmaaksi
                if (juna.akt == null) {
                    uusiKarttamerkki._icon.classList.add('harmaa');
                    juna.merkkiValittavissa = false;
                }
                // karttamerkin sijoitus junaan
                juna.karttamerkki = uusiKarttamerkki;
        
            }
        } 
    } else { // jos junalla on merkki kartalla, poistetaan se
        if (juna.karttamerkki) poistaKarttamerkki(indeksi);
    }// if juna.piirramerkki

    // jos junan merkin saa piirtää ja junalla on aikataulu, paikkatieto sekä karttamerkki
    if (juna.piirraMerkki && juna.akt && juna.pkt && juna.karttamerkki) {
        
        // jos merkki on harmaan, poistetaan sen määrittelevä luokka
        if (juna.karttamerkki._icon.classList.contains('harmaa')) {
            juna.karttamerkki._icon.classList.remove('harmaa');
        }

        // muodostetaan tooltip
        if (juna.tiedot.nimi) {
            let tooltipTeksti = (juna.tiedot.nimi) ? '<strong>'+juna.tiedot.nimi+'</strong>' : juna.numero.toString();
            tooltipTeksti += (juna.tiedot.lahtopaikka && juna.tiedot.maaranpaa) ? '<br>' + juna.tiedot.lahtopaikka + ' - ' + juna.tiedot.maaranpaa : '';
            //tooltipTeksti += (juna.tiedot.operaattori) ? '<br>' + juna.tiedot.operaattori : '';
            tooltipTeksti += '<br>'+seuraavaAsema(indeksi);
            if (juna.tiedot.aikaero != null) {
                tooltipTeksti +=    (juna.tiedot.aikaero < -1) ? '<br>'+Math.abs(juna.tiedot.aikaero)+' minuuttia etuajassa' : 
                                    (juna.tiedot.aikaero == -1) ? '<br>Minuutin etuajassa' : 
                                    (juna.tiedot.aikaero == 0) ? '<br>Aikataulussa' : 
                                    (juna.tiedot.aikaero == 1) ? '<br>Minuutin myöhässä' : '<br>'+juna.tiedot.aikaero+' minuuttia myöhässä';
            }
            tooltipTeksti += (juna.tiedot.nopeus != null) ? '<br>Nopeus: ' + juna.tiedot.nopeus + ' km/h' : '';
            tooltipTeksti += (juna.pkt.accuracy) ? '<br>Merkin tarkkuus: ' + juna.pkt.accuracy + ' m' : '';
            tooltipTeksti += (juna.pkt) ? '<br><small>Päivitetty '+(new Date(juna.pkt.timestamp)).toLocaleTimeString()+'</small>' : '';

            juna.karttamerkki.setTooltipContent(tooltipTeksti);
        }
    
        // jos junan tiedoissa on että juna ei ole valittavissa, muutetaan se
        if (!juna.merkkiValittavissa) {
            juna.merkkiValittavissa = true;
            juna.karttamerkki.on('click',() => {
                // tänne tulee funktiokutsu jolla näytetään junan aikataulu
                console.log('Klikattiin junan',juna.numero,'merkkiä.');
                console.log(juna);
                sivuPaneeli(juna.numero);
                });
        }
    }
        
}

function poistaKarttamerkki(indeksi) {
    // jos junalle on tallennettu karttamerkki, poistetaan se kartalta ja merkataan merkki nulliksi junan tietoihin
    if (junat[indeksi].karttamerkki) {
        junat[indeksi].karttamerkki.removeFrom(kartta);
        junat[indeksi].karttamerkki = null;
    }
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
            // kyseessä on paikkatieto: tarkistetaan löytyykä vanha paikkatieto
            if (juna.pkt) { // juna.pkt != null
                // löytyy vanha paikkatieto, verrataan tietojen aikaleimoja:
                if (new Date(JSONtieto.timestamp) < new Date(juna.pkt.timestamp)) {
                    // uusi paikkatieto on vanhempi kuin jo tallennettu, poistutaan funktiosta
                    return
                }
            }

            // vanhaa paikkatietoa ei ole tai se on vanhempi kuin uusi tieto, tallennetaan uusi paikkatieto
            juna.pkt = JSONtieto;
            juna.tiedot.nopeus = JSONtieto.speed;
            
        }  // tarkistetaan onko tiedoissa version, jolloin kyseessä on muut junan tiedot
        else if (JSONtieto.hasOwnProperty('version')) {
            // käsitellään junan tiedot

            // jos juna löytyy päivitysjonosta, poistetaan se
            if (paivitysjono.indexOf(JSONtieto.trainNumber) != -1 ) paivitysjono.splice(paivitysjono.indexOf(JSONtieto.trainNumber),1);
            // lisätään juna päivitysjonon perälle
            paivitysjono.push(JSONtieto.trainNumber);

            // tarkistetaan löytyykö vanha tieto
            if (juna.akt) {
                // löytyy vanha tieto, verrataan versionumeroa:
                if (JSONtieto.version < juna.akt.version) {
                    // uuden tiedon versionumero on pienempi kuin jo tallennetun, poistutaan funktiosta
                    return
                }
                
                // päivitetään junan tiedot
                juna.akt = JSONtieto;
                // päivitetään tieto siitä onko juna aikataulussa vai etuajassa/myöhässä
                aikatauluTarkistus(junanIndeksi);
            } else {
                // vanhoja tietoja ei löydy
                juna.akt = JSONtieto;
                // kutsutaan funktiota joka luo junalle perustiedot
                tietojenHaku(junanIndeksi);
                // päivitetän aikataulun ja toteutuneen ajan ero (--> .tieto.aikaero)
                aikatauluTarkistus(junanIndeksi);
            }
        }

        // pävitetään viimeisen päivityksen aika
        juna.paivitettyViimeksi = new Date();
        // tarkistetaan voiko merkin piirtää kartalle
        juna.piirraMerkki = piirretaankoKarttamerkki(junanIndeksi);
        // piirretään karttamerkki
        paivitaKarttamerkki(junanIndeksi);

    } 
}

function poistaJuna(junanNumero) {
    let indeksi = etsiJunaTaulukosta(junanNumero);
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


// tarkistaa voidaanko karttamerkki näyttää kartalla
// palauttaa true jos voidaan ja false jos merkki pitää piilottaa
function piirretaankoKarttamerkki(indeksi) {
    let nyt = new Date();
    let juna = junat[indeksi];

    // onko junalla paikkatieto, jos on, onko se yli 2 minuuttia vanhaa?
    if (juna.pkt) {
        if (nyt - new Date(juna.pkt.timestamp) >= 1000*60*2) {
            return false;
        }
    }

    // onko junalla paikkatieto, mutta ei muita tietoja ja onko juna luotu yli 2 minuuttia sitten
    if (juna.pkt != null && juna.akt == null && (nyt - new Date(juna.luotu) >= 1000*60*2)) {
        return false;
    }

    // onko junalla aikataulutieto ja onko juna ollut perillä jo yli 3 minuuttia
    if (juna.akt) {
        let perilla = onkoPerilla(indeksi);
        if (perilla) {
            if (nyt - new Date(perilla) >= 1000*60*3) {
                return false;
            }
        }
    }

    // jos mikään edellisistä ei toteutunut palautetaan tosi eli karttamerkin voi näyttää
    return true;

}

function ajastettuPaivitys() {
    paivitysLaskuri += 1;
    if (paivitysLaskuri == 6) {
        // joka 6. kerta haetaan manuaalisesti kaikkien junien paikkatiedot 
        // ja tarkistetaan karttamerkkien piirrettävyys ja poistettavat junat
        paivitysLaskuri = 0;

        haeJSON('https://rata.digitraffic.fi/api/v1/train-locations/latest/', (virhekoodi, vastaus) => {
            if (virhekoodi) console.warn('Virhe haettaessa kaikkien junien paikkatietoja!\n', virhekoodi);
            else {
                pysaytaPaivitys = true;
                vastaus.forEach((rivi) => {
                    paivitaJunanTiedot(rivi);
                });
                pysaytaPaivitys = false;
            }
        });

        let nyt = new Date();
        
        // käydään läpi kaikki junat
        junat.forEach((juna,indeksi) => {
    
            // tarkistetaan piirretäänkö merkki kartalle
            let tarkistus = piirretaankoKarttamerkki(indeksi);
            
            if (juna.piirraMerkki != tarkistus) {
                juna.piirraMerkki = tarkistus;
                paivitaKarttamerkki(indeksi);
            } 
        
            // jos junan tietoja ei ole päivitetty 10 minuuttiin poistetaan se
            if (nyt - new Date(juna.paivitettyViimeksi) >= 1000*60*10) {
                console.log('Poistetaan juna',juna.numero);
                poistaJuna(juna.numero);
            }
        })
    
    } else {
        // otetaan päivitysjonosta max. 10 ensimmäistä junaa ja haetaan niille tiedot
        let paivitystenMaara = (paivitysjono.length >= 10) ? 10 : paivitysjono.length;
        // leikataan junien numerot pois päivitysjonosta
        let kasiteltavat = paivitysjono.splice(0, paivitystenMaara);
        for (let i=0; i<kasiteltavat.length; i++) {
            if (typeof kasiteltavat[i] === 'number') {
                haeJSON('https://rata.digitraffic.fi/api/v1/trains/latest/'+kasiteltavat[i], (virhekoodi, vastaus) => {
                    if (virhekoodi) console.warn('Virhe haettaessa junan',kasiteltavat[i],'tietoja!\n', virhekoodi);
                    else {
                        if (vastaus.length > 0) {
                            paivitaJunanTiedot(vastaus[0]);
                        } 
                        /*
                        else {
                            console.log('Junalle ei löydy tietoja:',kasiteltavat[i]);
                            //tarkistaPoistetaankoJuna(kasiteltavat[i]);
                        } */
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
