let junat = [], // junat-taulukko: sisältää kaikki juna-oliot
    paivitysjono = [], // päivitysjono junien tietojen ajastettua päivitystä varten
    valittuJuna = -1; // valittun junan numero, -1 = ei valittua junaa

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

// päivitetään junan paikkatieto tai muut tiedot (mm. aikataulu)
// Parametrit: tieto JSON-muodossa
function paivitaJunanTiedot(JSONtieto) {
    // tarkistetaan että tiedoissa on junan numero, jos ei ole, ei päivitetä mitään
    if (JSONtieto.hasOwnProperty('trainNumber')) {
        // junan numero löytyy, selvitetään onko juna jo taulukossa
        let junanIndeksi = etsiJunaTaulukosta(JSONtieto.trainNumber)

        // jos junaIndeksi on -1, junaa ei löytynyt taulukosta
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
            
        }  
        // tarkistetaan onko tiedoissa version, jolloin kyseessä on muut junan tiedot
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

        // päivitetään viimeisen päivityksen aika
        juna.paivitettyViimeksi = new Date();
        // tarkistetaan voiko merkin piirtää kartalle
        juna.piirraMerkki = piirretaankoKarttamerkki(junanIndeksi);
        // piirretään karttamerkki
        paivitaKarttamerkki(junanIndeksi);

    } 
}

// poistetaan valittun junan valinta
function poistaValinta() {
    // varmistetaan että jokin juna on valittuna
    if (valittuJuna != -1) {
        // haetaan valitun junan indeksi junat-taulukossa
        let indeksi = etsiJunaTaulukosta(valittuJuna);
        // jos juna löytyi junat-taulukosta poistetaan sen karttamerkistä luokkamääritys, jolloin sen väri muuttuu takaisin siniseksi
        if (indeksi != -1) if (junat[indeksi].karttamerkki) junat[indeksi].karttamerkki._icon.classList.remove('punainen');
        // "nollataan" valinta
        valittuJuna = -1;
    }
}

// poistetaan junan karttamerkki ja juna-olio junat-taulukosta
// Parametrit: poistettavan junan numero
function poistaJuna(junanNumero) {
    // etsitään junan indeksi junat-taulukosta
    let indeksi = etsiJunaTaulukosta(junanNumero);
    // poistetaan junan karttamerkki
    poistaKarttamerkki(indeksi);
    // poistetaan juna junat-taulukosta
    junat.splice(indeksi,1);
    // poistetaan juna päivitysjonosta
    paivitysjono = paivitysjono.filter((numero) => {
        return numero != junanNumero;
    });

    // jos poistettava juna on valittuna, poistetaan valinta ja suljetaan paneeli
    if (valittuJuna == junanNumero) {
        poistaValinta();
        suljePaneeli();
    }
}


// tarkistaa voidaanko karttamerkki näyttää kartalla vai piilotettaanko se
// Palauttaa: true jos karttamerkin voi näyttää kartalla ja false jos merkki pitää piilottaa
function piirretaankoKarttamerkki(indeksi) {
    let nyt = new Date();
    let juna = junat[indeksi];

    // onko junalla paikkatieto ja jos on, onko se yli 3 minuuttia vanhaa?
    if (juna.pkt) {
        if (nyt - new Date(juna.pkt.timestamp) >= 1000*60*3) {
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


