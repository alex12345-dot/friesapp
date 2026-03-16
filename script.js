const storageKey = "fries-reviews";
const reviewsContainer = document.querySelector("#reviews");
const form = document.querySelector("#review-form");
const clearButton = document.querySelector("#clear");
const template = document.querySelector("#review-template");
const mapQueryInput = document.querySelector("#map-query");
const searchPlacesButton = document.querySelector("#search-places");
const placeResults = document.querySelector("#place-results");
const mapStatus = document.querySelector("#map-status");
const mapFrame = document.querySelector("#map-frame");
const nameInput = document.querySelector("#name");
const cityInput = document.querySelector("#city");

let foundPlaces = [];

function normalizeRestaurantName(item, fallbackQuery) {
  const primary = item.name || item.display_name?.split(",")[0] || fallbackQuery;
  return primary.trim();
}

function getReviews() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
}

function saveReviews(reviews) {
  localStorage.setItem(storageKey, JSON.stringify(reviews));
}

function stars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function setMapByQuery(query) {
  const encoded = encodeURIComponent(query);
  mapFrame.src = `https://www.google.com/maps?q=${encoded}&output=embed`;
}

function updateResultOptions(places) {
  placeResults.innerHTML = '<option value="">Seleziona un ristorante...</option>';
  places.forEach((place, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = place.display;
    placeResults.appendChild(option);
  });
}

function renderReviews() {
  const reviews = getReviews();
  reviewsContainer.innerHTML = "";

  if (!reviews.length) {
    reviewsContainer.innerHTML =
      '<p class="empty">Nessuna recensione ancora. Aggiungi la prima! 🍟</p>';
    return;
  }

  reviews.forEach((review) => {
    const card = template.content.cloneNode(true);
    card.querySelector(".title").textContent = review.name;
    card.querySelector(".meta").textContent = `${review.city} · ${stars(review.rating)} (${review.rating}/5)`;
    card.querySelector(".chips").textContent = `Tipo: ${review.type}`;
    card.querySelector(".comment").textContent = review.comment;
    reviewsContainer.appendChild(card);
  });
}

async function searchPlaces() {
  const query = mapQueryInput.value.trim() || nameInput.value.trim();
  if (!query) {
    mapStatus.textContent = "Inserisci il nome del ristorante da cercare.";
    return;
  }

  mapStatus.textContent = "Ricerca in corso...";

  try {
    const params = new URLSearchParams({
      q: `${query} restaurant`,
      format: "jsonv2",
      addressdetails: "1",
      limit: "8",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Errore nella ricerca");
    }

    const results = await response.json();
    foundPlaces = results.map((item) => ({
      name: normalizeRestaurantName(item, query),
      display: item.display_name,
      city:
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        "",
      lat: item.lat,
      lon: item.lon,
    }));

    if (!foundPlaces.length) {
      updateResultOptions([]);
      mapStatus.textContent = "Nessun risultato trovato. Prova a essere più specifico.";
      return;
    }

    updateResultOptions(foundPlaces);
    mapStatus.textContent = `Trovati ${foundPlaces.length} risultati. Selezionane uno.`;

    const first = foundPlaces[0];
    setMapByQuery(`${first.lat},${first.lon}`);
  } catch (error) {
    mapStatus.textContent = "Ricerca non disponibile al momento. Riprova tra poco.";
  }
}

placeResults.addEventListener("change", () => {
  const selected = foundPlaces[Number(placeResults.value)];
  if (!selected) {
    return;
  }

  setMapByQuery(`${selected.lat},${selected.lon}`);

  nameInput.value = selected.name;
  mapQueryInput.value = selected.name;
  cityInput.value = selected.city || cityInput.value;
  mapStatus.textContent = `Selezionato: ${selected.display}`;
});

searchPlacesButton.addEventListener("click", searchPlaces);

mapQueryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchPlaces();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const review = {
    name: data.get("name")?.toString() || nameInput.value.trim(),
    city: data.get("city")?.toString() || cityInput.value.trim(),
    rating: Number(data.get("rating") || document.querySelector("#rating").value),
    type: data.get("type")?.toString() || document.querySelector("#type").value,
    comment: data.get("comment")?.toString() || document.querySelector("#comment").value.trim(),
  };

  const reviews = getReviews();
  reviews.unshift(review);
  saveReviews(reviews);
  renderReviews();
  form.reset();
  placeResults.innerHTML = '<option value="">Nessun risultato selezionato</option>';
  foundPlaces = [];
  mapStatus.textContent = "";
  setMapByQuery("Italia");
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderReviews();
});

renderReviews();
