const storageKey = "fries-reviews";
const reviewsContainer = document.querySelector("#reviews");
const form = document.querySelector("#review-form");
const clearButton = document.querySelector("#clear");
const template = document.querySelector("#review-template");
const mapFrame = document.querySelector("#map-frame");
const nameInput = document.querySelector("#name");
const ratingInput = document.querySelector("#rating");

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

function setMapByRestaurantName(name) {
  const encoded = encodeURIComponent(name.trim() || "Italia");
  mapFrame.src = `https://www.google.com/maps?q=${encoded}&output=embed`;
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
    card.querySelector(".meta").textContent = `${stars(review.rating)} (${review.rating}/5)`;
    reviewsContainer.appendChild(card);
  });
}

nameInput.addEventListener("input", () => {
  setMapByRestaurantName(nameInput.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const review = {
    name: nameInput.value.trim(),
    rating: Number(ratingInput.value),
  };

  const reviews = getReviews();
  reviews.unshift(review);
  saveReviews(reviews);
  renderReviews();
  form.reset();
  setMapByRestaurantName("Italia");
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderReviews();
});

renderReviews();
