function etsiLahtoJaMaaranpaa(indeksi) {
    junat.forEach((element, index) => {
        if (indeksi == index) {
            console.log(element.akt);
            if (element.akt != null) {
                // if (element.tiedot == null) {
                //     element.tiedot = '';
                //     element.tiedot.lahtopaikka = ''
                //     element.tiedot.maaranpaa = ''
                // }
                element.tiedot.lahtopaikka = etsiAsemanNimi(element.akt.timeTableRows[0].stationUICCode);
                element.tiedot.maaranpaa = etsiAsemanNimi(element.akt.timeTableRows[element.akt.timeTableRows.length - 1].stationUICCode);
                console.log('Lähtö: ' + etsiAsemanNimi(element.akt.timeTableRows[0].stationUICCode));
                console.log('Määränpää: ' + etsiAsemanNimi(element.akt.timeTableRows[element.akt.timeTableRows.length - 1].stationUICCode));
            }
        }
        // if (junanNro == element.trainNumber) {
        //     console.log('Lähtö: ' + etsiAsemanNimi(element.timeTableRows[0].stationUICCode));
        //     console.log('Määränpää: ' + etsiAsemanNimi(element.timeTableRows[element.timeTableRows.length - 1].stationUICCode));
        // }
    });
}
function nimeaJuna(indeksi) {
    junat.forEach((element, index) => {
        console.log(element);
    });
}
