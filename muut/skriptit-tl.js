function paivitaTiedotOsio(junanNumero) {
 
 let indeksi=  etsiJunaTaulukosta(junanNumero);

 // Junan nimi

document.querySelector("#junannimi").innerHTML = junat[indeksi].tiedot.nimi;

// Operaattori

document.querySelector("#operaattori").innerHTML = junat[indeksi].tiedot.operaattori;

// Lähtöpaikka ja Määränpää

document.querySelector("#lahtopaikkaJaMaaranpaa").innerHTML = junat[indeksi].tiedot.lahtopaikka + ' - ' + junat[indeksi].tiedot.maaranpaa;

// Nopeus

document.querySelector("#nopeus").innerHTML = 'Nopeus: ' + junat[indeksi].tiedot.nopeus + ' km/h';

// Aikaero


if(junat[indeksi].tiedot.aikaero < -1) {
document.querySelector("#aikaEro").innerHTML = Math.abs(junat[indeksi].tiedot.aikaero) + ' minuuttia etuajassa';
}
if(junat[indeksi].tiedot.aikaero == -1) {
  document.querySelector("#aikaEro").innerHTML = 'Minuutin etuajassa';
}
  if(junat[indeksi].tiedot.aikaero == 0) {
    document.querySelector("#aikaEro").innerHTML = 'Aikataulussa';
  }

  if(junat[indeksi].tiedot.aikaero == 1) {
    document.querySelector("#aikaEro").innerHTML = 'Minuutin myöhässä';
  } 
 
  if(junat[indeksi].tiedot.aikaero > 1) {
    document.querySelector("#aikaEro").innerHTML = junat[indeksi].tiedot.aikaero + ' minuuttia myöhässä';
  } 

  // Seuraava asema
document.querySelector("#seuraavaAsema").innerHTML = seuraavaAsema(indeksi);
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

