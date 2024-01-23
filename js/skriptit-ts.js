function tietojenHaku(indeksi) {
    let element = junat[indeksi];
    console.log(element);
    if (element.akt != null) {
        element.tiedot.lahtopaikka = etsiAsemanNimi(element.akt.timeTableRows[0].stationUICCode);
        element.tiedot.maaranpaa = etsiAsemanNimi(element.akt.timeTableRows[element.akt.timeTableRows.length - 1].stationUICCode);
        console.log('Lähtö: ' + etsiAsemanNimi(element.akt.timeTableRows[0].stationUICCode));
        console.log('Määränpää: ' + etsiAsemanNimi(element.akt.timeTableRows[element.akt.timeTableRows.length - 1].stationUICCode));
    }
}
