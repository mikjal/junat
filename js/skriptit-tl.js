function paivitaTiedotOsio(junanNumero) {
 
 let indeksi=  etsiJunaTaulukosta(junanNumero);

 // Junan nimi
document.getElementById(junat[indeksi].tiedot.nimi);
document.querySelector("#junannimi").innerHTML = junat[indeksi].tiedot.nimi;

// Operaattori
document.getElementById(junat[indeksi].tiedot.operaattori);
document.querySelector("#operaattori").innerHTML = junat[indeksi].tiedot.operaattori;

// Lähtöpaikka ja Määränpää
document.getElementById(junat[indeksi].tiedot.lahtopaikka + junat[indeksi].tiedot.maaranpaa);
document.querySelector("#lahtopaikkaJaMaaranpaa").innerHTML = junat[indeksi].tiedot.lahtopaikka + ' - ' + junat[indeksi].tiedot.maaranpaa;

// Nopeus
document.getElementById(junat[indeksi].tiedot.nopeus);
document.querySelector("#nopeus").innerHTML = junat[indeksi].tiedot.nopeus + 'km/h';

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
    "tammikuuta",
    "helmikuuta",
    "maaliskuuta",
    "huhtikuuta",
    "toukokuuta",
    "kesäkuuta",
    "heinäkuuta",
    "elokuuta",
    "syyskuuta",
    "lokakuuta",
    "marraskuuta",
    "joulukuuta"
  ];

  return `${Paivat[pvm.getDay()]} ${pvm.getDate()}. ${Kuukaudet[pvm.getMonth()]
    }  `;
}


setInterval(() => {
  const now = new Date();

  aikaElement.textContent = formatTime(now);
  pvmElement.textContent = formatDate(now);
}, 200);

