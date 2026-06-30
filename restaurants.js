const SUPABASE_URL = "https://lgqtgsjktccvplmkxwzk.supabase.co";
const SUPABASE_KEY = "sb_publishable_dPPLqeAATNdMrcwsIsG2ZQ_iK1k_EPI";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const restaurantList = document.getElementById("restaurant-list");
const restaurantPagination = document.getElementById("restaurantPagination");
const restaurantSearchInput = document.getElementById("restaurantSearchInput");
const restaurantSearchBtn = document.getElementById("restaurantSearchBtn");

const RESTAURANTS_PER_PAGE = 4;

let allRestaurants = [];
let currentRestaurantPage = 1;
let lastFilteredRestaurants = [];

function restaurantCardHTML(item) {
    const imageSrc = item.image_url || "placeholder-dish.svg";

    return `
        <div class="card">
            <img class="card-image" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null; this.src='placeholder-dish.svg';">
            <h3>${escapeHtml(item.name)}</h3>
            <p>
                <strong>${pick("ქალაქი:", "City:")}</strong>
                ${escapeHtml(item.city)}
            </p>
            <p>
                <strong>${pick("მისამართი:", "Address:")}</strong>
                ${escapeHtml(item.address)}
            </p>
            <p>
                <strong>${pick("სამზარეულო:", "Cuisine:")}</strong>
                ${escapeHtml(item.cuisine_type)}
            </p>
        </div>
    `;
}

function showRestaurants(restaurants) {
    restaurantList.innerHTML = "";

    if (restaurants.length === 0) {
        restaurantList.innerHTML = `<p class="section-note">${pick("რესტორანი არ მოიძებნა.", "No restaurants found.")}</p>`;
        restaurantPagination.innerHTML = "";
        return;
    }

    const start = (currentRestaurantPage - 1) * RESTAURANTS_PER_PAGE;
    const pageItems = restaurants.slice(start, start + RESTAURANTS_PER_PAGE);

    pageItems.forEach(function (item) {
        restaurantList.innerHTML += restaurantCardHTML(item);
    });

    renderRestaurantPagination(restaurants.length);
}

function renderRestaurantPagination(totalItems) {
    restaurantPagination.innerHTML = "";

    const totalPages = Math.ceil(totalItems / RESTAURANTS_PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = "page-btn" + (i === currentRestaurantPage ? " active" : "");
        btn.textContent = i;
        btn.addEventListener("click", function () {
            currentRestaurantPage = i;
            showRestaurants(lastFilteredRestaurants);
        });
        restaurantPagination.appendChild(btn);
    }
}

function searchRestaurants() {
    const searchText = restaurantSearchInput.value.trim().toLowerCase();

    let filtered = allRestaurants;

    if (searchText !== "") {
        filtered = allRestaurants.filter(function (item) {
            const name = (item.name || "").toLowerCase();
            const city = (item.city || "").toLowerCase();
            return name.includes(searchText) || city.includes(searchText);
        });
    }

    currentRestaurantPage = 1;
    lastFilteredRestaurants = filtered;
    showRestaurants(filtered);
}

async function loadRestaurants() {
    const { data, error } = await supabaseClient
        .from("restaurants")
        .select("*");

    if (error) {
        console.log(error);
        return;
    }

    allRestaurants = data;
    lastFilteredRestaurants = data;
    showRestaurants(allRestaurants);
}

// i18n.js-ში updatePageText ჯერ ცარიელია — აქ ვუთვალისწინებთ ამ გვერდის
// საკუთარ ტექსტს.
function updatePageText() {
    document.getElementById("restaurantsHeading").textContent = pick("რესტორნები", "Restaurants");
    restaurantSearchInput.placeholder = pick("მოძებნე რესტორანი სახელით", "Search restaurants by name");
    restaurantSearchBtn.textContent = pick("ძიება", "Search");
    searchRestaurants();
}

restaurantSearchBtn.addEventListener("click", searchRestaurants);

restaurantSearchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        searchRestaurants();
    }
});

loadRestaurants();