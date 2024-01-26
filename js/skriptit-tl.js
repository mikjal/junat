function piirraKarttamerkki(indeksi) {
    
  let juna = junat[indeksi];

  if (juna.karttamerkki) {
    juna.karttamerkki.setLatLng([juna.pkt.location.coordinates[1], juna.pkt.location.coordinates[0]]);

    if (juna.akt && juna.tiedot.nimi) {
      if (juna.karttamerkki._icon.classList.contains('harmaa')) {
        juna.karttamerkki._icon.classList.remove('harmaa');
      }

      let tooltipTeksti = (juna.tiedot.nimi) ? '<strong>' + juna.tiedot.nimi + '</strong>' : juna.numero.toString();
      tooltipTeksti += (juna.tiedot.lahtopaikka && juna.tiedot.maaranpaa) ? '<br>' + juna.tiedot.lahtopaikka + ' - ' + juna.tiedot.maaranpaa : '';
      tooltipTeksti += (juna.tiedot.operaattori) ? '<br>' + juna.tiedot.operaattori : '';
      if (juna.tiedot.aikaero != null) {
        tooltipTeksti += (juna.tiedot.aikaero < 0) ? '<br>' + Math.abs(juna.tiedot.aikaero) + ' minuuttia etuajassa' : (juna.tiedot.aikaero == 0) ? '<br>Aikataulussa' : '<br>' + juna.tiedot.aikaero + ' minuuttia myöhässä';
      }
      tooltipTeksti += (juna.tiedot.nopeus != null) ? '<br>Nopeus: ' + juna.tiedot.nopeus + ' km/h' : '';
      tooltipTeksti += (juna.pkt) ? '<br>Päivitetty ' + (new Date(juna.pkt.timestamp)).toLocaleTimeString() : '';

      juna.karttamerkki.setTooltipContent(tooltipTeksti);
    }

  } else {
    if (juna.pkt) {
      let uusiKarttamerkki = L.marker([juna.pkt.location.coordinates[1], juna.pkt.location.coordinates[0]])
        .addTo(kartta);

      uusiKarttamerkki.on('click', function () {
        console.log('Klikattiin junan', juna.numero, 'merkkiä.');
        let popupTeksti = '<strong>' + juna.tiedot.nimi + '</strong>' +
          '<br>' + juna.tiedot.lahtopaikka + ' - ' + juna.tiedot.maaranpaa +
          '<br>' + juna.tiedot.operaattori +
          '<br>' + (juna.tiedot.aikaero < 0 ? Math.abs(juna.tiedot.aikaero) + ' minuuttia etuajassa' :
            (juna.tiedot.aikaero == 0 ? 'Aikataulussa' : juna.tiedot.aikaero + ' minuuttia myöhässä')) +
          '<br>Nopeus: ' + juna.tiedot.nopeus + ' km/h' +
          '<br>Päivitetty ' + (new Date(juna.pkt.timestamp)).toLocaleTimeString();

        juna.karttamerkki.unbindPopup().bindPopup(popupTeksti).togglePopup();
      });

      juna.karttamerkki = uusiKarttamerkki;
    }
  }

  if (juna.akt == null && juna.tiedot.nimi == null) {
    juna.karttamerkki._icon.classList.add('harmaa');
  }
}

const aikaElement = document.querySelector(".aika");
const pvmElement = document.querySelector(".paivam");

/**
 * @param {Date} pvm
 */
function formatTime(pvm) {
  const hours24 = pvm.getHours() % 24 || 24;
  const minutes = pvm.getMinutes();
  const isAm = pvm.getHours() < 24;

  return `${hours24.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${isAm ? "" : ""}`;
}

/**
 * @param {Date} pvm
 */
function formatDate(pvm) {
  const Paivat = [
    "Sunnuntai",
    "Maanantai",
    "Tiistai",
    "Keskiviikko",
    "Torstai",
    "Perjantai",
    "Lauantai"
  ];
  const Kuukaudet = [
    "Tammikkuu",
    "Helmikuu",
    "Maaliskuu",
    "Huhtikuu",
    "Toukokuu",
    "Kesäkuu",
    "Heinäkuu",
    "Elokuu",
    "Syyskuu",
    "Lokakuu",
    "Marraskuu",
    "Joulukuu"
  ];

  return `${Paivat[pvm.getDay()]}, ${
    Kuukaudet[pvm.getMonth()]
  } ${pvm.getDate()} ${pvm.getFullYear()}`;
}

setInterval(() => {
  const now = new Date();

  aikaElement.textContent = formatTime(now);
  pvmElement.textContent = formatDate(now);
}, 200);

