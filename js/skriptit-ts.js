function tietojenHaku(indeksi) {
    let element = junat[indeksi];
    let operaattoriLista = mt.operaattorit.tiedot;
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
    };
    let nimiParit = Object.entries(junatyypit);
    if (element.akt != null) {
        element.tiedot.lahtopaikka = etsiAsemanNimi(element.akt.timeTableRows[0].stationUICCode);
        element.tiedot.maaranpaa = etsiAsemanNimi(element.akt.timeTableRows[element.akt.timeTableRows.length - 1].stationUICCode);
        operaattoriLista.forEach((operaattori) => {
            if (operaattori.operatorShortCode == element.akt.operatorShortCode) {
                element.tiedot.operaattori = operaattori.operatorName;
            }
        });
        element.tiedot.nimi = element.akt.trainType;
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
