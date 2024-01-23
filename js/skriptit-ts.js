function tietojenHaku(indeksi) {
    let element = junat[indeksi];
    let operaattoriLista = mt.operaattorit.tiedot;
    if (element.akt != null) {
        element.tiedot.lahtopaikka = etsiAsemanNimi(element.akt.timeTableRows[0].stationUICCode);
        element.tiedot.maaranpaa = etsiAsemanNimi(element.akt.timeTableRows[element.akt.timeTableRows.length - 1].stationUICCode);
        operaattoriLista.forEach((operaattori) => {
            if (operaattori.operatorShortCode == element.akt.operatorShortCode) {
                element.tiedot.operaattori = operaattori.operatorName;
            }
        });
    }
}
