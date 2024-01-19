function etsiLahtoJaMaaranpaa() {
    mt.junat.tiedot.forEach((element) => {
        console.log('Lähtö: ' + etsiAsemanNimi(element.timeTableRows[0].stationUICCode));
        console.log('Määränpää: ' + etsiAsemanNimi(element.timeTableRows[element.timeTableRows.length - 1].stationUICCode));
    });
}
