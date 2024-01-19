function etsiLahtoJaMaaranpaa(junanNro) {
    mt.junat.tiedot.forEach((element) => {
        if (junanNro == element.trainNumber) {
            console.log('Lähtö: ' + etsiAsemanNimi(element.timeTableRows[0].stationUICCode));
            console.log('Määränpää: ' + etsiAsemanNimi(element.timeTableRows[element.timeTableRows.length - 1].stationUICCode));
        }
    });
}
