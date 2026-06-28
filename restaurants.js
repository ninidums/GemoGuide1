const SUPABASE_URL = "https://khdkidxttlfxlnpgxlxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_mZ1mTBsgmZQ-exwDHqB35Q_nubl6_hm";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const restaurantList = document.getElementById("restaurant-list");
const restaurantSearchInput = document.getElementById("restaurantSearchInput");
const restaurantSearchBtn = document.getElementById("restaurantSearchBtn");

let allRestaurants = [];

function restaurantCardHTML(item) {
    return `
        <div class="card">
            <h3>${item.name}</h3>
            <p>
                <strong>${pick("ქალაქი:", "City:")}</strong>
                ${item.city || ""}
            </p>
            <p>
                <strong>${pick("მისამართი:", "Address:")}</strong>
                ${item.address || ""}
            </p>
            <p>
                <strong>${pick("სამზარეულო:", "Cuisine:")}</strong>
                ${item.cuisine_type || ""}
            </p>
        </div>
    `;
}

function showRestaurants(restaurants) {
    restaurantList.innerHTML = "";

    if (restaurants.length === 0) {
        restaurantList.innerHTML = `<p class="section-note">${pick("რესტორანი არ მოიძებნა.", "No restaurants found.")}</p>`;
        return;
    }

    restaurants.forEach(function (item) {
        restaurantList.innerHTML += restaurantCardHTML(item);
    });
}

function searchRestaurants() {
    const searchText = restaurantSearchInput.value.trim().toLowerCase();

    if (searchText === "") {
        showRestaurants(allRestaurants);
        return;
    }

    const filtered = allRestaurants.filter(function (item) {
        const name = (item.name || "").toLowerCase();
        const city = (item.city || "").toLowerCase();
        return name.includes(searchText) || city.includes(searchText);
    });

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