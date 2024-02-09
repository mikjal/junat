let kartta; 

// luodaan kartta kartta-alueelle
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

// poistetaan junan karttamerkki juna-oliosta sekä kartalta
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

// Karttamerkin klikkauksen tai koskettamisen käsittelevä funktio
// Parametrit: klikatun/kosketetun (=valitun) junan numero
function klik(junanNumero) {
    // etsitään valittu juna junat-taulukosta
    let juna = junat[etsiJunaTaulukosta(junanNumero)];

    // tarkistetaan valittiinko sama juna uudelleen, jos valittiin, poistetaan valinta
    if (valittuJuna == junanNumero) {
        // poistetaan valitun junan valinta
        poistaValinta();
        // suljetaan paneeli
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
