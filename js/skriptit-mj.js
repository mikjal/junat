let kartta;

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
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap-kartoittajat</a> | Liikennetietojen lähde <a href="https://rata.digitraffic.fi">Fintraffic / digitraffic.fi, lisenssi CC 4.0 BY</a>',
    }).addTo(kartta);

    // Lisätään zoom-napit oikealle ylös
    L.control.zoom({
        position: 'topright'
        }).addTo(kartta);

}

function lataaJSON(urli, callback) {
    fetch(urli)
    .then(response => {
        if (!response.ok) {
            callback(response.status,null);
        }
        return response.json();
    })
    .then(response => {
        callback(null,response);
    })
    .catch(error => {
        callback(error,null);
    })
}

function haeJSON(osoite, paluufunktio) {
    fetch(osoite) // haetaan tiedot osoitteesta
    .then(vastaus => { // fetch palauttaa Promisen
        if (!vastaus.ok) {
            paluufunktio(vastaus.status,null);
        }
        return vastaus.json();
    }) 
    .then(vastaus => { // käsitellään seuraava Promise, jotta saadaan varsinainen vastaus
        paluufunktio(null,vastaus)
    })
    .catch(virhe => { // virhetilanne
        paluufunktio(virhe,null);
    });

}

window.onload = () => {
    luoKartta();

    haeJSON('https://rata.digitraffic.fi/api/v1/train-locations/latest/', (virhekoodi, vastaus) => {
        // jos virhekoodi on jotain muuta kuin null, ilmoitetaan virheestä
        if (virhekoodi) console.warn('Virhe haettaessa JSON-tietoja tai tietojen käsittelyssä',virhekoodi)
        else { // virhekoodi on null eli virheitä ei ole tapahtunut, vastaus sisältää JSON-tiedot
           
            // esim. ensimmäisenä junan tiedot
            console.log(vastaus[0]);

            // ensimmäisen junan numero
            console.log(vastaus[0].trainNumber);

            // ensimmäisen junan lähtöpäivä
            console.log(vastaus[0].departureDate);
        
        }
    })
}

/*
yhden junan tiedot, esim. vastaus[0]
{
    "trainNumber": 1,
    "departureDate": "2024-01-16",
    "timestamp": "2024-01-16T09:53:17.000Z",
    "location": {
        "type": "Point",
        "coordinates": [
            29.777991,
            62.601035
        ]
    },
    "speed": 0,
    "accuracy": 24
}
*/
