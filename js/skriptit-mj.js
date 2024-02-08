let kartta,
    MQTTyhteys, 
    debug = false,
    junat = [], // junat-taulukko: sisältää kaikki juna-oliot
    paivitysjono = [], // päivitysjono junien tietojen ajastettua päivitystä varten
    pysaytaPaivitys = false, // varmistus että MQTT:n kautta saadut päivitykset eivät sotke ajastettua päivitystä
    valittuJuna = -1, // valittun junan numero, -1 = ei valittua junaa
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
        // tarkkuusympyrä
        this.tarkkuusympyra = null;
        // usein tarvittavia tietoja
        this.tiedot = {
            nimi: null,
            lahtopaikka: null,
            maaranpaa: null,
            nopeus: null,
            aikaero: null,
            operaattori: null
        }
        // luontiaika
        this.luotu = new Date();
        // milloin viimeisin päivitys tietoihin
        this.paivitettyViimeksi = null;
        // piirretäänkö karttamerkki vai ei
        this.piirraMerkki = true;
        // voiko karttamerkin valita kartalta (klikkaus/kosketus)
        this.merkkiValittavissa = false;
    }
}

function paikannaJuna(junanNumero) {
    let indeksi = etsiJunaTaulukosta(junanNumero);
    if (indeksi != -1) {
        let juna = junat[indeksi];
        console.log('Junan indeksi:',indeksi);
        console.log(junat[indeksi]);
        if (juna.pkt) kartta.setView([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]],12);

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

// luo, päivittää tai poistaa junan karttamerkin kartalle/kartalta, 
// lisäksi muodotetaan merkille tooltip sekä tarkkuusympyrä jos sellainen on sallittu
// Parametrit: junan indeksi junat-taulukossa
function paivitaKarttamerkki(indeksi) {
    
    // haetaan viittaus junaan
    let juna = junat[indeksi];

    // saako karttamerkin piirtää kartalle?
    if (juna.piirraMerkki) {
        // karttamerkin saa piirtää kartalle
        // tarkistetaan onko merkki jo olemassa
        if (juna.karttamerkki) {
            // onko junalla tarkkuusympyrä?
            if (juna.tarkkuusympyra) {
                // poistetaan vanha ympyrä
                juna.tarkkuusympyra.removeFrom(kartta);
                // piirretään uusi ympyrä jos sen piirtäminen on sallittu
                if (piirraTarkkuus) {
                    juna.tarkkuusympyra = L.circle([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]], {
                        radius: (maxTarkkuus != 0 && juna.pkt.accuracy > maxTarkkuus) ? maxTarkkuus : juna.pkt.accuracy,
                        opacity: 0.2,
                        fillOpacity: 0.2
                    }).addTo(kartta);
                }
            }
            
            // junan karttamerkki on jo olemassa, siirretään sitä
            juna.karttamerkki.setLatLng([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]]);

            // jos kyseessä on valittu juna ja seurataan merkkiä, keskitetään se ruudulle
            if (juna.numero == valittuJuna && seuraaMerkkia) {
                // otetaan huomioon sivupaneelin leveys, jos ollaan "isolla" näytöllä
                kartta.setView(laskeKeskitys([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]]));
            }

        } else {
            // karttamerkin saa piirtää kartalle, mutta merkkiä ei vielä ole kartalla, lisätään se
            // varmistetaan ensin että paikkatieto on olemassa
            if (juna.pkt) {
    
                // onko junalla tarkkuustieto ja onko tarkkuusympyrän piirto sallittu
                if (juna.pkt.accuracy && piirraTarkkuus) {
                    juna.tarkkuusympyra = L.circle([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]], {
                        radius: juna.pkt.accuracy,
                        opacity: 0.2,
                        fillOpacity: 0.2
                    }).addTo(kartta);
                }

                // luodaan junalle uusi karttamerkki, jonka tooltippiin tulee junan numero
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
    } else { 
        // karttamerkkiä ei saa piirtää kartalle
        // jos junalla on jo merkki kartalla, poistetaan se
        if (juna.karttamerkki) poistaKarttamerkki(indeksi);
        // jos juna on valittu juna, poistetaan valinta ja suljetaan sivupaneeli
        if (juna.numero == valittuJuna) {
            poistaValinta();
            suljePaneeli();
        }
    }// end if juna.piirramerkki

    // tarkistetaan saako junan merkin piirtää sekä onko junalla aikataulutieto, paikkatieto sekä karttamerkki
    if (juna.piirraMerkki && juna.akt && juna.pkt && juna.karttamerkki) {
        // kaikki tiedot löytyy
        // jos merkki on harmaa, poistetaan sen määrittelevä luokka jolloin se muuttuu siniseksi
        if (juna.karttamerkki._icon.classList.contains('harmaa')) {
            juna.karttamerkki._icon.classList.remove('harmaa');
        }

        // muodostetaan tooltip
        if (juna.tiedot.nimi) {
            // junan nimi
            let tooltipTeksti = (juna.tiedot.nimi) ? '<strong>' + juna.tiedot.nimi + '</strong>' : juna.numero.toString();
            // lähtöpaikka ja määränpää
            tooltipTeksti += (juna.tiedot.lahtopaikka && juna.tiedot.maaranpaa) ? '<br>' + juna.tiedot.lahtopaikka + ' - ' + juna.tiedot.maaranpaa : '';
            // aikaero eli onko juna myöhässä, ajoissa vai etuajassa
            if (juna.tiedot.aikaero != null) {
                tooltipTeksti +=    (juna.tiedot.aikaero < -1) ? '<br>'+Math.abs(juna.tiedot.aikaero)+' minuuttia etuajassa' : 
                                    (juna.tiedot.aikaero == -1) ? '<br>Minuutin etuajassa' : 
                                    (juna.tiedot.aikaero == 0) ? '<br>Aikataulussa' : 
                                    (juna.tiedot.aikaero == 1) ? '<br>Minuutin myöhässä' : '<br>'+juna.tiedot.aikaero+' minuuttia myöhässä';
            }
            // junan nopeus
            tooltipTeksti += (juna.tiedot.nopeus != null) ? '<br>Nopeus: ' + juna.tiedot.nopeus + ' km/h' : '';
            // merkkiin tarkkuus
            tooltipTeksti += (juna.pkt.accuracy) ? '<br>Merkin tarkkuus: ' + juna.pkt.accuracy + ' m' : '';
            // päivityksen kellonaika
            tooltipTeksti += (juna.pkt) ? '<br><small>Päivitetty '+(new Date(juna.pkt.timestamp)).toLocaleTimeString()+'</small>' : '';

            juna.karttamerkki.setTooltipContent(tooltipTeksti);
        }
    
        // jos junan tiedoissa on että juna ei ole valittavissa, muutetaan se
        if (!juna.merkkiValittavissa) {
            juna.merkkiValittavissa = true;
            juna.karttamerkki.on('click',() => {
                klik(juna.numero);
            });
        }

        /*
        if (juna.karttamerkki._events.click.length < 2) {
            console.log('Junan',juna.numero,'onclick korjattu');
            juna.karttamerkki.on('click',() => {
                klik(juna.numero);
            });
        }
        */
        
        if (valittuJuna == juna.numero) paivitaTiedotOsio(juna.numero);
    }
        
}

// Siirtää karttamerkin keskitystä oikealle riittävän isolla näytöllä, käytetään kun sivupaneeli on näytöllä
// Parametrit: LatLng-piste
// Palauttaa: alkuperäisen LatLng-pisteen jos "pieni" näyttö, muuten palauttaa oikealle siirretyn pisteen paikan
function laskeKeskitys(latlng) {

    if (onkoPieniNaytto()) {
        // "pieni" näyttö, keskitetään ilman "paddingia"
        return latlng
    } else {
        // "iso" näyttö, keskitetään karttamerkki enemmän oikealle
        let piste = kartta.project(latlng);
        piste.x -= 200;
        return kartta.unproject(piste);    
    }

}

// Karttamerkin klikkauksen tai koskettamisen käsittelevä funktio
// Parametrit: klikatun/kosketetun (=valitun) junan numero
function klik(junanNumero) {
    // etsitään valittu juna junat-taulukosta
    let juna = junat[etsiJunaTaulukosta(junanNumero)];

    // tarkistetaan valittiinko sama juna uudelleen, jos valittiin, poistetaan valinta
    if (valittuJuna == junanNumero) {
        poistaValinta();
        suljePaneeli();
    } else {
        // oliko jokin toinen juna ennestään valittuna, poistetaan sen valinta
        if (valittuJuna != -1) poistaValinta(valittuJuna);
        // muutetaan valitun junan karttamerkki punaiseksi
        juna.karttamerkki._icon.classList.add('punainen');
        // asetetaan valittuJuna-muuttujaan junan numero
        valittuJuna = juna.numero;

        // tarvitseeko zoomata ja onko zoomaus sallittu?
        if (kartta.getZoom() < 10 && zoomaaLahemmas) {
            // zoomataan lähemmäs valitun junan karttamerkkiä
            kartta.setView([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]],10);    
        } else if (seuraaMerkkia) { // onko seuraa valitun junan merkkiä päällä?
            // seuraus on päällä, asetetaan junan merkki enemmän oikealle, koska sivupaneeli tulee olemaan auki
            kartta.setView(laskeKeskitys([juna.pkt.location.coordinates[1],juna.pkt.location.coordinates[0]]))  
        }

        // Aukaistaan sivupaneli
        sivuPaneeli(junanNumero);
    }
}

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
    document.querySelector('#aikataulu').style.maxHeight =  '';

    // muodostetaan paneeliin uusi aikataululista
    haeAsemaTiedot(etsiJunaTaulukosta(junanNumero));

    // jos paneeli on isolla näytöllä tai tietyssä tilanteessa pienellä näytöllä, vähennetään aikataulun korkeudesta 10
    let lisa = 10;
    // haetaan paneelin ja aikataulu-osan mitat
    let paneelinMitat = document.querySelector('#paneeli').getBoundingClientRect();
    let aikataulunMitat = document.querySelector('#aikataulu').getBoundingClientRect();
    
    // onko paneeli pienellä näytöllä ja aikataulun korkeus ei ylitä paneelin maksimikorkeutta --> lisää ei tarvita
    if (onkoPieniNaytto() && aikataulunMitat.top + aikataulunMitat.height < paneelinMitat.bottom ) lisa = 0;

    // lasketaan aikataulu-osan uusi korkeus ja asetetaan se aikataulun maxHeightiksi
    let aikataulunUusiKorkeus = Math.round(aikataulunMitat.height+paneelinMitat.bottom-aikataulunMitat.bottom-lisa);
    document.querySelector('#aikataulu').style.maxHeight =  aikataulunUusiKorkeus + 'px';
}


function naytaPaneeli() {
    document.querySelector('#paneeli').style.left = '0px';
    document.querySelector('#pienenna').classList.remove('kaanna');
}

function onkoPieniNaytto() {
    // vastaako media query pienen äytön arvoja?
    return window.matchMedia('(max-width: 700px), (max-height: 600px)').matches;
}

function laskePaneelinKorkeus() {
    let marginaalit = (onkoPieniNaytto()) ? 10 : 20;
    let paneeli = document.querySelector('#paneeli');
    let ylareuna = parseInt(window.getComputedStyle(paneeli).top.replace('px',''));
    
    // päivitetään sivupaneelin maksimikorkeus
    paneeli.style.maxHeight = window.innerHeight - ylareuna - marginaalit + 'px';
    
    // onko sivupaneeli pienennettynä ja ikkunan koko vaihtui pienestä isoksi?
    // tuodaan sivupaneeli tällöin näkyville
    if (window.getComputedStyle(paneeli).left != '0px' && window.getComputedStyle(paneeli).left != '-400px') {
        paneeli.style.left = '0px';
        document.querySelector('#pienenna').classList.remove('kaanna');
    }
}

function pienennaPaneeli() {
    let paneeli = document.querySelector('#paneeli');
    if (paneeli.style.left == '0px') {
        document.querySelector('#pienenna').classList.add('kaanna');
        paneeli.style.left = '-236px';
    } else {
        document.querySelector('#pienenna').classList.remove('kaanna');
        paneeli.style.left = '0px';
    }
    
}

function suljePaneeli() {
    poistaValinta();
    document.querySelector('#paneeli').style.left = '-400px';
}

function poistaKarttamerkki(indeksi) {
    // jos junalle on tallennettu karttamerkki, poistetaan se kartalta ja merkataan merkki nulliksi junan tietoihin
    if (junat[indeksi].karttamerkki) {
        junat[indeksi].karttamerkki.removeFrom(kartta);
        junat[indeksi].karttamerkki = null;
    }
    // jos junalla on tarkkuusympyrä, poistetaan sekin
    if (junat[indeksi].tarkkuusympyra) {
        junat[indeksi].tarkkuusympyra.removeFrom(kartta);
        junat[indeksi].tarkkuusympyra = null;
    }
    // merkki on poistettu, joten se ei ole enää valittavissa
    junat[indeksi].merkkiValittavissa = false;

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

function poistaValinta() {
    if (valittuJuna != -1) {
        let indeksi = etsiJunaTaulukosta(valittuJuna);
        if (indeksi != -1) if (junat[indeksi].karttamerkki) junat[indeksi].karttamerkki._icon.classList.remove('punainen');
        valittuJuna = -1;
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
        poistaValinta();
        suljePaneeli();
    }

}


// tarkistaa voidaanko karttamerkki näyttää kartalla
// palauttaa true jos voidaan ja false jos merkki pitää piilottaa
function piirretaankoKarttamerkki(indeksi) {
    let nyt = new Date();
    let juna = junat[indeksi];

    // onko junalla paikkatieto, jos on, onko se yli 3 minuuttia vanhaa?
    if (juna.pkt) {
        if (nyt - new Date(juna.pkt.timestamp) >= 1000*60*3) {
            //console.log('Paikkatieto on yli 3 minuuttia vanha: ',juna.numero)
            return false;
        }
    }

    // onko junalla paikkatieto, mutta ei muita tietoja ja onko juna luotu yli 2 minuuttia sitten
    if (juna.pkt != null && juna.akt == null && (nyt - new Date(juna.luotu) >= 1000*60*2)) {
        //console.log('Junalla on paikkatieto, mutta ei muita tietoja ja se on luotu yli 2 minuuttia sitten: ',juna.numero)
        return false;
    }

    // onko junalla aikataulutieto ja onko juna ollut perillä jo yli 3 minuuttia
    if (juna.akt) {
        let perilla = onkoPerilla(indeksi);
        if (perilla) {
            if (nyt - new Date(perilla) >= 1000*60*3) {
                //console.log('Juna on ollut perillä yli 3 minuuttia: ',juna.numero)
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
    laskePaneelinKorkeus();

    window.onresize = () => { 
        laskePaneelinKorkeus();
        if (valittuJuna != -1) naytaAikataulu(valittuJuna);
    };

    asetaMQTTkuuntelija();

    setInterval(ajastettuPaivitys, 5000);
};
