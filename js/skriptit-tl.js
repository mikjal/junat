
function sivuPaneeli() {
  var sidebar = L.control.sidebar('sidebar', {
    position: 'left'
  });

  kartta.addControl(sidebar);
  let uusiKarttamerkki = L.marker([])
  uusiKarttamerkki.on('click', function () {
    sidebar.toggle();
    document.getElementById('siderbar-content').innerHTML = '<h2>Test</h2>';
  });
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
    "Tammikkuuta",
    "Helmikuuta",
    "Maaliskuuta",
    "Huhtikuuta",
    "Toukokuuta",
    "Kesäkuuta",
    "Heinäkuuta",
    "Elokuuta",
    "Syyskuuta",
    "Lokakuuta",
    "Marraskuuta",
    "Joulukuuta"
  ];

  return `${Paivat[pvm.getDay()]}. ${pvm.getDate()} ${Kuukaudet[pvm.getMonth()]
    }  ${pvm.getFullYear()}`;
}


setInterval(() => {
  const now = new Date();

  aikaElement.textContent = formatTime(now);
  pvmElement.textContent = formatDate(now);
}, 200);

