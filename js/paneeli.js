// Kutsuu funktioita jotka tuovat sivupaneelin näytölle ja päivittävät sen tiedot
// Parametrit: valitun junan numero
function sivuPaneeli(junanNumero) {
    // sivupaneeli näkyville
    naytaPaneeli();
    // päivitetään junan tiedot vastaamaan valittua junaa
    paivitaTiedotOsio(junanNumero);
    // päivitetään aikataulu ja se korkeus vastaamaan valittua junaa
    naytaAikataulu(junanNumero);    
}

// kutsuu funktiota joka muodostaa aikataulun ja laskee tämän jälkeen aikataulun
// maksimikorkeutta suhteessa sivupaneelin korkeuteen
// Parametrit: valitun junan numero
function naytaAikataulu(junanNumero) {
    // nollataan aikataulun vanha maksimikorkeus
    document.querySelector('#aikataulu').style.maxHeight =  '';

    // muodostetaan paneeliin uusi aikataululista
    haeAsemaTiedot(etsiJunaTaulukosta(junanNumero));

    // jos paneeli on isolla näytöllä tai tietyssä tilanteessa pienellä näytöllä, vähennetään aikataulun korkeudesta 10
    let lisa = 10;
    // haetaan paneelin ja aikataulu-osan mitat
    let paneelinMitat = document.querySelector('#paneeli').getBoundingClientRect();
    let aikataulunMitat = document.querySelector('#aikataulu').getBoundingClientRect();
    
    // onko paneeli pienellä näytöllä ja aikataulun korkeus ei ylitä paneelin maksimikorkeutta --> lisää ei tarvita
    if (onkoPieniNaytto() && aikataulunMitat.top + aikataulunMitat.height < paneelinMitat.bottom ) lisa = 0;

    // lasketaan aikataulu-osan uusi korkeus ja asetetaan se aikataulun maxHeightiksi
    let aikataulunUusiKorkeus = Math.round(aikataulunMitat.height+paneelinMitat.bottom-aikataulunMitat.bottom-lisa);
    document.querySelector('#aikataulu').style.maxHeight =  aikataulunUusiKorkeus + 'px';
}

// tuo vasemmasta laidasta näytölle paneelin, jossa esitetään junan tiedot ja aikataulu
function naytaPaneeli() {
    document.querySelector('#paneeli').style.left = '0px';
    document.querySelector('#pienenna').classList.remove('kaanna');
}

// testaa onko käytössä pieni näyttö samoilla arvoilla, jotka ovat käytössä css-tiedostossa
// Palauttaa: true, jos käytössä on pieni näyttö (leveys max. 700 tai korkeus max. 600 pikseliä) tai false, jos käytössä ei ole pieni näyttö
function onkoPieniNaytto() {
    // vastaako media query pienen näytön arvoja?
    return window.matchMedia('(max-width: 700px), (max-height: 600px)').matches;
}

// laskee paneelin maksimikorkeuden näytön kokoon suhteutettuna
function laskePaneelinKorkeus() {
    // haetaan laskennassa tarvittavat tiedot
    let marginaalit = (onkoPieniNaytto()) ? 10 : 20;
    let paneeli = document.querySelector('#paneeli');
    let ylareuna = parseInt(window.getComputedStyle(paneeli).top.replace('px',''));
    
    // päivitetään paneelin maksimikorkeus
    paneeli.style.maxHeight = window.innerHeight - ylareuna - marginaalit + 'px';
    
    // onko paneeli pienennettynä ja ikkunan koko vaihtui pienestä isoksi?
    // tuodaan sivupaneeli tällöin näkyville
    if (window.getComputedStyle(paneeli).left != '0px' && window.getComputedStyle(paneeli).left != '-400px') {
        paneeli.style.left = '0px';
        document.querySelector('#pienenna').classList.remove('kaanna');
    }
}

// "pienentää" paneelin vasempaan sivuun, käytössä vain "pienillä" näytöillä
function pienennaPaneeli() {
    let paneeli = document.querySelector('#paneeli');
    // onko paneeli kokonaan esillä?
    if (paneeli.style.left == '0px') {
        // kyllä, paneeli on kokonaan esillä, joten pienennetään se sivuun
        // käännetään pienennysnappia 180 astetta
        document.querySelector('#pienenna').classList.add('kaanna');
        paneeli.style.left = '-236px';
    } else {
        // ei, paneeli on jo pienennettynä, tuodaan se kokonaan esille
        // poistetaan pienennysnapin kääntö
        document.querySelector('#pienenna').classList.remove('kaanna');
        paneeli.style.left = '0px';
    }
    
}

// sulkee paneelin 
function suljePaneeli() {
    // poistetaan valitun junan valinta
    poistaValinta();
    // siirretään paneeli pois näkyvistä
    document.querySelector('#paneeli').style.left = '-400px';
}
