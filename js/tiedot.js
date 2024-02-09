let MQTTyhteys, 
    pysaytaPaivitys = false, // varmistus että MQTT:n kautta saadut päivitykset eivät sotke ajastettua päivitystä
    paivitysLaskuri = 0, // laskuri jonka avulla ajastetaan kaikkien junien paikkatietojen haku
    seuraaMerkkia = true, // seurataanko valitun junan merkkiä
    piirraTarkkuus = true, // piirretäänkö junan karttamerkin ympärille tarkkuusympyrä
    zoomaaLahemmas = true, // zoomataanko tarvittaaessa lähemmäs kun juna valitaan
    maxTarkkuus = 0; // halutaanko tarkkuusympyrän kokoa rajoittaa, 0 = ei rajoitusta

// metatiedot
const mt = {
    operaattorit: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/operators',
        tiedot: null,
    },
    liikennepaikat: {
        osoite: 'https://rata.digitraffic.fi/api/v1/metadata/stations',
        tiedot: null,
    }
};

// käynnistetään metatietojen lataaminen
for (let nimi in mt) {
    haeJSON(mt[nimi].osoite, (virhekoodi, vastaus) => {
        if (virhekoodi) console.warn('Virhe haettaessa metatietoja: ' + nimi + '\n', virhekoodi);
        else {
            mt[nimi].tiedot = vastaus;
        }
    });
}

// haetaan JSON-tieto annetusta osoitteesta
// Parametrit: osoite josta JSON-tiedot haetaan ja paluufunktio jota kutsutaan kun vastaus saapuu
// Palauttaa: virhekoodin ja null, jos tapahtui virhe tai null ja vastauksen jos vastaus saatiin onnistuneesti
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

// asettaa MQTT-kuuntelijan joka käsittelee tilattuja tietoja
// käyttää ulkopuolista Eclipse Paho MQTT-koodia
function asetaMQTTkuuntelija() {
    MQTTyhteys = new Paho.MQTT.Client('rata.digitraffic.fi', 443, 'myclientid_' + parseInt(Math.random() * 10000, 10));

    // Mitä tapahtuu jos yhteys katkeaa:
    MQTTyhteys.onConnectionLost = function (responseObject) {
        console.warn('MQTT-yhteys katkesi: ' + responseObject.errorMessage);
    };

    // Mitä tehdään kun viesti saapuu:
    MQTTyhteys.onMessageArrived = function (message) {
        if (!pysaytaPaivitys) paivitaJunanTiedot(JSON.parse(message.payloadString));
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

    // muodostetaan yhteys
    MQTTyhteys.connect(maaritykset);
}

// etsii metatiedoista asemalle selkokielisen nimen
// Parametrit: aseman uic-koodi
// Palauttaa: aseman selkokielisen nimen tai null jos nimeä ei löydy
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
            // palautetaan asemanimi
            return asemanimi;
        }
    }
    // Jos metatietoja ei ole tai jos asemaa ei parametrinä annetun uic:n perusteella löytynyt, palautetaan null
    return null;
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


// viiden sekunnin välein ajettava päivitys, joka 6. kerta haetaan ja päivitetään kaikkien junien paikkatiedot
// muilla kerroilla haetaan ja päivitetään päivitysjonosta max. 10 ensimmäisen junan tiedot
function ajastettuPaivitys() {
    paivitysLaskuri += 1;
    // onko 6. kerta?
    if (paivitysLaskuri == 6) {
        // joka 6. kerta haetaan manuaalisesti kaikkien junien paikkatiedot 
        // ja tarkistetaan karttamerkkien piirrettävyys ja poistettavat junat
        paivitysLaskuri = 0;

        haeJSON('https://rata.digitraffic.fi/api/v1/train-locations/latest/', (virhekoodi, vastaus) => {
            // jos virhekoodi on jotain muuta kuin null, tapahtui virhe joten ilmoitetaan siitä
            if (virhekoodi) console.warn('Virhe haettaessa kaikkien junien paikkatietoja!\n', virhekoodi);
            else {
                // virhekoodi=null eli ei virhettä, päivitetään kaikkien vastauksessa olevien junien paikkatiedot
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
            
            // onko tarkistuksen lopputulos eri kuin tallenttu tulos?
            if (juna.piirraMerkki != tarkistus) {
                juna.piirraMerkki = tarkistus;
                paivitaKarttamerkki(indeksi);
            } 
        
            // jos junan tietoja ei ole päivitetty 10 minuuttiin poistetaan se
            if (nyt - new Date(juna.paivitettyViimeksi) >= 1000*60*10) {
                poistaJuna(juna.numero);
            }
        })
    
    } else {
        // otetaan päivitysjonosta max. 10 ensimmäistä junaa ja haetaan niille tiedot
        let paivitystenMaara = (paivitysjono.length >= 10) ? 10 : paivitysjono.length;
        // "leikataan" junien numerot pois päivitysjonosta
        let kasiteltavat = paivitysjono.splice(0, paivitystenMaara);
        for (let i=0; i<kasiteltavat.length; i++) {
            if (typeof kasiteltavat[i] === 'number') {
                // haetaan junan tiedot
                haeJSON('https://rata.digitraffic.fi/api/v1/trains/latest/'+kasiteltavat[i], (virhekoodi, vastaus) => {
                    // jos virhekoodi on jotain muuta kuin null, tapahtui virhe
                    if (virhekoodi) console.warn('Virhe haettaessa junan',kasiteltavat[i],'tietoja!\n', virhekoodi);
                    else {
                        // tarkistetaan että junalle saatiin tiedot ja päivitetään ne
                        if (vastaus.length > 0) {
                            paivitaJunanTiedot(vastaus[0]);
                        } 
                    }
                });
            }
        }
    }
}

