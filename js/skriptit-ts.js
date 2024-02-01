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
        // Verrataan junan operaattori lyhennettä ja jos se on sama lyhenne asetetaan operaattorin nimi junat olioon
        operaattoriLista.forEach((operaattori) => {
            if (operaattori.operatorShortCode == element.akt.operatorShortCode) {
                element.tiedot.operaattori = operaattori.operatorName;
            }
        });
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

function haeSyyluokat(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    let syyluokat = mt.syyluokat.tiedot;
    if (element.akt != null) {
        element.akt.timeTableRows.forEach((asema) => {
            syyluokat.forEach((syyluokka) => {
                if (asema.causes) {
                    asema.causes.forEach((syy) => {
                        if (syy.categoryCode == syyluokka.categoryCode) {
                            return syyluokka.categoryName;
                        }
                    });
                }
            });
        });
    }
}
function haeSyykoodit(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    let syykoodit = mt.syykoodit.tiedot;
    if (element.akt != null) {
        element.akt.timeTableRows.forEach((asema) => {
            syykoodit.forEach((syykoodi) => {
                if (asema.causes) {
                    asema.causes.forEach((syy) => {
                        if (syy.detailedCategoryCode == syykoodi.detailedCategoryCode) {
                            return syykoodi.detailedCategoryName;
                        }
                    });
                }
            });
        });
    }
}
function haeKolmastaso(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    let kolmastaso = mt.kolmastaso.tiedot;
    if (element.akt != null) {
        element.akt.timeTableRows.forEach((asema) => {
            kolmastaso.forEach((taso) => {
                if (asema.causes) {
                    asema.causes.forEach((syy) => {
                        if (syy.thirdCategoryCode == taso.thirdCategoryCode) {
                            return taso.thirdCategoryName;
                        }
                    });
                }
            });
        });
    }
}

function haeAsemaTiedot(indeksi) {
    // Tallennetaan junat olio muuttujaan
    let element = junat[indeksi];
    let asemaNimi = null;
    let raideNro = null;
    let saapumisaika = null;
    let lahtoaika = null;
    if (element.akt != null) {
        element.akt.timeTableRows.forEach((asema) => {
            let lista = [];
            if (asema.commercialStop == true) {
                if (asema.type == 'ARRIVAL') {
                    saapumisaika = new Date(asema.scheduledTime).toLocaleTimeString();
                } else if (asema.type == 'DEPARTURE') {
                    lahtoaika = new Date(asema.scheduledTime).toLocaleTimeString();
                }
                if (asema.stationUICCode) {
                    asemaNimi = etsiAsemanNimi(asema.stationUICCode);
                }
                if (asema.commercialTrack) {
                    raideNro = asema.commercialTrack;
                }
            }
            lista.push(asemaNimi, saapumisaika, lahtoaika, raideNro);
            console.log(lista);
            return lista;
        });
    }
}
