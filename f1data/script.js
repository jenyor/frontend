const LIMIT = 1000;
const WIKIPEDIA_IMG_API =
  "https://en.wikipedia.org/w/api.php?&origin=*&action=query&prop=pageimages&format=json&piprop=original&redirects=&titles=";
const F1_LOGO_URL =
  "https://purepng.com/public/uploads/large/purepng.com-formula-1-logoformula-1logonew2018-21529676510t61kq.png";

async function getXmlCache(name, fallbackUrl) {
  const cache = localStorage.getItem(name);
  if (!cache) {
    const response = await fetch(fallbackUrl);
    const responseText = await response.text();
    localStorage.setItem(name, responseText);
  }
  return new window.DOMParser().parseFromString(
    localStorage.getItem(name),
    "text/xml",
  );
}

async function loadSeasonsList() {
  const select = document.getElementById("championships-list");
  const data = await getXmlCache(
    "ListOfSeasons",
    `https://ergast.com/api/f1/seasons?limit=${LIMIT}`,
  );

  const seasons = data.getElementsByTagName("Season");
  for (let i = seasons.length - 1; i >= 0; i--) {
    const content = seasons[i].textContent;
    const url = seasons[i].getAttribute("url");
    const option = new Option(content);
    option.setAttribute("url", url);
    select.add(option);
  }

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let year = urlParams.get("year");
  if (!year) {
    year = "2023";
  }
  document.querySelector("#championships-list").value = year;

  await loadSeasonContent();
}

async function loadRacesTable(year) {
  const body = document
    .getElementById("season-races")
    .getElementsByTagName("tbody")[0];
  body.innerHTML = "";
  const data = await getXmlCache(
    `RacesIn${year}`,
    `https://ergast.com/api/f1/${year}?limit=${LIMIT}`,
  );

  const races = data.getElementsByTagName("Race");
  for (let i = 0; i < races.length; i++) {
    let newRow = body.insertRow();

    const raceName = races[i].getElementsByTagName("RaceName")[0].innerHTML;
    const raceUrl = races[i].getAttribute("url");
    const circuit = races[i].getElementsByTagName("CircuitName")[0].innerHTML;
    const circuitUrl = races[i]
      .getElementsByTagName("Circuit")[0]
      .getAttribute("circuitId");
    const date = races[i].getElementsByTagName("Date")[0].innerHTML;

    newRow.innerHTML = `\
<td>${i + 1}</td>
<td>${raceName}</td>
<td><a href="circuits.html?circuit=${circuitUrl}">${circuit}</a></td>
<td>${date}</td>
    `;
  }
}

async function loadDriversTable(year) {
  const body = document
    .getElementById("driver-standings")
    .getElementsByTagName("tbody")[0];
  body.innerHTML = "";
  const data = await getXmlCache(
    `DriversIn${year}`,
    `https://ergast.com/api/f1/${year}/driverStandings?limit=${LIMIT}`,
  );

  const drivers = data.getElementsByTagName("DriverStanding");
  for (let i = 0; i < drivers.length; i++) {
    let newRow = body.insertRow();

    const driver =
      drivers[i].getElementsByTagName("GivenName")[0].innerHTML +
      " " +
      drivers[i].getElementsByTagName("FamilyName")[0].innerHTML;
    const driverId = drivers[i]
      .getElementsByTagName("Driver")[0]
      .getAttribute("driverId");
    const wins = drivers[i].getAttribute("wins");
    const points = drivers[i].getAttribute("points");
    const url = drivers[i]
      .getElementsByTagName("Driver")[0]
      .getAttribute("url");

    newRow.innerHTML = `\
<td>${i + 1}</td>
<td><a href="drivers.html?driver=${driverId}">${driver}</a></td>
<td>${wins}</td>
<td>${points}</td>
    `;
  }
}

async function loadConstructorsTable(year) {
  const body = document
    .getElementById("constructor-standings")
    .getElementsByTagName("tbody")[0];
  body.innerHTML = "";
  const data = await getXmlCache(
    `ConstructorsIn${year}`,
    `https://ergast.com/api/f1/${year}/constructorStandings?limit=${LIMIT}`,
  );

  const constructors = data.getElementsByTagName("ConstructorStanding");
  for (let i = 0; i < constructors.length; i++) {
    let newRow = body.insertRow();

    const constructor =
      constructors[i].getElementsByTagName("Name")[0].innerHTML;
    const wins = constructors[i].getAttribute("wins");
    const points = constructors[i].getAttribute("points");
    const link = constructors[i]
      .getElementsByTagName("Constructor")[0]
      .getAttribute("url");

    newRow.innerHTML = `\
<td>${i + 1}</td>
<td>${constructor}</td>
<td>${wins}</td>
<td>${points}</td>
    `;
  }
}

async function loadSeasonContent() {
  const year = document.getElementById("championships-list").value;
  const url = document
    .querySelector("#championships-list")
    .selectedOptions[0].getAttribute("url");
  console.log(`loading ${year} content`);
  Promise.all([
    loadWikipediaImage(url),
    loadRacesTable(year),
    loadDriversTable(year),
    loadConstructorsTable(year),
  ]);
}

async function loadWikipediaImage(wikiUrl) {
  const wikiName = wikiUrl.split("/").pop();
  const url = `${WIKIPEDIA_IMG_API}${wikiName}`;
  console.log(`Wikipedia article url: ${wikiUrl}`);
  console.log(`Wikipedia article name: ${wikiName}`);
  console.log(`Get Url: ${url}`);

  const response = await fetch(url).then((r) => r.json());
  try {
    const imgSrc = Object.values(response.query.pages)[0].original.source;
    document.querySelector("blockquote img").src = imgSrc;
  } catch {
    console.log(`No wikipedia image for ${wikiName}. Loading default F1 logo.`);
    document.querySelector("blockquote img").src = F1_LOGO_URL;
  }
}

async function loadDriverContent() {
  const inputDriverId = document.getElementById("driver-input").value;
  const selected = document.querySelector(
    `#drivers option[value="${inputDriverId}"]`,
  );
  const driverId = selected.getAttribute("driverId");
  const wikiUrl = selected.getAttribute("url");
  console.log(`loading ${driverId} content`);
  await Promise.all([
    loadWikipediaImage(wikiUrl),
    loadDriverRaces(driverId),
    loadDriverStatistics(driverId),
  ]);
}

async function loadDriverRaces(driverId) {
  const body = document
    .getElementById("driver-races")
    .getElementsByTagName("tbody")[0];
  body.innerHTML = "";
  const data = await getXmlCache(
    `${driverId}Races`,
    `https://ergast.com/api/f1/drivers/${driverId}/results?limit=${LIMIT}`,
  );

  const races = data.getElementsByTagName("Race");
  for (let i = races.length - 1; i >= 0; i--) {
    let newRow = body.insertRow();

    const season = races[i].getAttribute("season");
    const round = races[i].getAttribute("round");
    const circuit = races[i].getElementsByTagName("CircuitName")[0].innerHTML;
    const circuitId = races[i]
      .getElementsByTagName("Circuit")[0]
      .getAttribute("circuitId");
    const constructor = races[i].getElementsByTagName("Name")[0].innerHTML;
    const grid = races[i].getElementsByTagName("Grid")[0].innerHTML;
    const points = races[i]
      .getElementsByTagName("Result")[0]
      .getAttribute("points");
    const pos = races[i]
      .getElementsByTagName("Result")[0]
      .getAttribute("position");

    newRow.innerHTML = `\
<td>${i + 1}</td>
<td>${season}</td>
<td>${round}</td>
<td><a href="circuits.html?circuit=${circuitId}">${circuit}</a></td>
<td>${constructor}</td>
<td>${grid}</td>
<td>${pos}</td>
<td>${points}</td>
    `;
  }
}

async function loadDriverStatistics(driverId) {
  const body = document
    .getElementById("driver-stats")
    .getElementsByTagName("tbody")[0];
  body.innerHTML = "";
  const data = await getXmlCache(
    `${driverId}Races`,
    `https://ergast.com/api/f1/drivers/${driverId}/results?limit=${LIMIT}`,
  );

  const res = {
    wins: 0,
    runnerUp: 0,
    third: 0,
    top10: 0,
    noTop10: 0,
    all: 0,
  };
  const races = data.getElementsByTagName("Race");
  for (let i = 0; i < races.length; i++) {
    const pos = races[i]
      .getElementsByTagName("Result")[0]
      .getAttribute("position");
    res.all += 1;
    if (pos == 1) res.wins += 1;
    else if (pos == 2) res.runnerUp += 1;
    else if (pos == 3) res.third += 1;
    else if (pos <= 10) res.top10 += 1;
    else res.noTop10 += 1;
  }
  body.innerHTML = `\
<tr><th>Wins</th><td>${res.wins}</td></tr>
<tr><th>Runner-up</th><td>${res.runnerUp}</td></tr>
<tr><th>Third</th><td>${res.third}</td></tr>
<tr><th>Top10</th><td>${res.top10}</td></tr>
<tr><th>No points</th><td>${res.noTop10}</td></tr>
<tr><th>All</th><td>${res.all}</td></tr>
  `;
}

async function loadDriversList() {
  const select = document.getElementById("drivers");
  const data = await getXmlCache(
    "ListOfDrivers",
    `https://ergast.com/api/f1/drivers?limit=${LIMIT}`,
  );

  const drivers = data.getElementsByTagName("Driver");
  const id_to_name = new Map();
  for (let i = 0; i < drivers.length; i++) {
    const content =
      drivers[i].getElementsByTagName("GivenName")[0].innerHTML +
      " " +
      drivers[i].getElementsByTagName("FamilyName")[0].innerHTML;
    const url = drivers[i].getAttribute("url");
    const id = drivers[i].getAttribute("driverId");
    const option = new Option(content, content);
    option.setAttribute("url", url);
    option.setAttribute("driverId", id);
    select.appendChild(option);
    id_to_name.set(id, content);
  }
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let driverId = urlParams.get("driver");
  if (!driverId) {
    driverId = "leclerc";
  }
  document.querySelector('input[list="drivers"]').value =
    id_to_name.get(driverId);

  await loadDriverContent();
}

async function loadCircuitsList() {
  const select = document.getElementById("circuits");
  const data = await getXmlCache(
    "ListOfCircuits",
    `https://ergast.com/api/f1/circuits?limit=${LIMIT}`,
  );

  const circuits = data.getElementsByTagName("Circuit");
  const id_to_name = new Map();
  for (let i = 0; i < circuits.length; i++) {
    const name = circuits[i].getElementsByTagName("CircuitName")[0].innerHTML;
    const url = circuits[i].getAttribute("url");
    const id = circuits[i].getAttribute("circuitId");
    const option = new Option(name, name);
    option.setAttribute("url", url);
    option.setAttribute("circuitId", id);
    select.appendChild(option);
    id_to_name.set(id, name);
  }
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let circuitId = urlParams.get("circuit");
  if (!circuitId) {
    circuitId = "monza";
  }
  document.querySelector('input[list="circuits"]').value =
    id_to_name.get(circuitId);

  await loadCircuitContent();
}

async function loadCircuitContent() {
  const inputCircuitId = document.getElementById("circuit-input").value;
  const selected = document.querySelector(
    `#circuits option[value="${inputCircuitId}"]`,
  );
  const circuit = selected.getAttribute("circuitid");
  const wikiUrl = selected.getAttribute("url");
  console.log(`loading ${circuit} content`);
  await Promise.all([loadWikipediaImage(wikiUrl), loadCircuitPage(circuit)]);
}

async function loadCircuitPage(circuitId) {
  const body = document
    .getElementById("circuits-table")
    .getElementsByTagName("tbody")[0];
  body.innerHTML = "";
  const data = await getXmlCache(
    `${circuitId}Races`,
    `https://ergast.com/api/f1/circuits/${circuitId}/races?limit=${LIMIT}`,
  );

  const races = data.getElementsByTagName("Race");
  const id_to_name = new Map();
  const winsCount = new Map();
  for (let i = races.length - 1; i >= 0; i--) {
    let newRow = body.insertRow();

    const season = races[i].getAttribute("season");
    const round = races[i].getAttribute("round");
    const raceName = races[i].getElementsByTagName("RaceName")[0].innerHTML;
    const results = await getXmlCache(
      `ResultsOf${season}/${round}`,
      `https://ergast.com/api/f1/${season}/${round}/results?limit=${LIMIT}`,
    );
    const winnerRaw = results.getElementsByTagName("Result")[0];
    const winner = {
      name:
        winnerRaw.getElementsByTagName("GivenName")[0].innerHTML +
        " " +
        winnerRaw.getElementsByTagName("FamilyName")[0].innerHTML,
      id: winnerRaw.getElementsByTagName("Driver")[0].getAttribute("driverId"),
      constructor: winnerRaw.getElementsByTagName("Name")[0].innerHTML,
    };
    id_to_name.set(winner.id, winner.name);
    let numWins = winsCount.get(winner.id);
    winsCount.set(winner.id, numWins ? numWins + 1 : 1);

    newRow.innerHTML = `\
<td>${i + 1}</td>
<td><a href="index.html?year=${season}">${season}</a></td>
<td>${round}</td>
<td>${raceName}</td>
<td><a href="drivers.html?driver=${winner.id}">${winner.name}</a></td>
<td>${winner.constructor}</td>
    `;
  }

  const sorted = new Map([...winsCount.entries()].sort((a, b) => b[1] - a[1]));
  const winnersStat = document
    .getElementById("wins-count")
    .getElementsByTagName("tbody")[0];
  winnersStat.innerHTML = "";
  sorted.forEach((value, key) => {
    const newRow = winnersStat.insertRow();
    const name = id_to_name.get(key);
    newRow.innerHTML = `\
<td><a href="drivers.html?driver=${key}">${name}</a></td>
<td>${value}</td>
    `;
  });
}

window.loadSeasonContent = loadSeasonContent;
window.loadSeasonsList = loadSeasonsList;
window.loadDriversList = loadDriversList;
window.loadDriverContent = loadDriverContent;
window.loadCircuitsList = loadCircuitsList;
window.loadCircuitContent = loadCircuitContent;
