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
