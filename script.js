const SUPABASE_URL = "https://khdkidxttlfxlnpgxlxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_mZ1mTBsgmZQ-exwDHqB35Q_nubl6_hm";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const cardList = document.getElementById("card-list");
const topList = document.getElementById("top-list");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// კერძების კატეგორიები (ნაშრომი, 5.3): ხინკალი, ხაჭაპური, მწვადი, ქართული სუპი, სალათი, ღვინო
const CATEGORIES = ["ხინკალი", "ხაჭაპური", "მწვადი", "ქართული სუპი", "სალათი", "ღვინო"];

let allDishes = [];
let activeCategory = "all";

// კერძის საშუალო შეფასება არ ინახება ხელით შეყვანილი მნიშვნელობით,
// არამედ ითვლება მასთან დაკავშირებული პროფესიული შეფასებების (evaluations.total_score) საშუალოდან.
function computeAverageScore(dish) {
    const evals = dish.evaluations || [];
    if (evals.length === 0) return null;
    const sum = evals.reduce(function (acc, ev) { return acc + (ev.total_score || 0); }, 0);
    return sum / evals.length;
}

function renderCategoryFilter() {
    categoryFilter.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "category-btn active";
    allBtn.dataset.category = "all";
    allBtn.textContent = pick("ყველა", "All");
    categoryFilter.appendChild(allBtn);

    CATEGORIES.forEach(function (category) {
        const btn = document.createElement("button");
        btn.className = "category-btn";
        btn.dataset.category = category;
        btn.textContent = category;
        categoryFilter.appendChild(btn);
    });

    categoryFilter.querySelectorAll(".category-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            categoryFilter.querySelectorAll(".category-btn").forEach(function (b) {
                b.classList.remove("active");
            });
            btn.classList.add("active");
            activeCategory = btn.dataset.category;
            applyFilters();
        });
    });
}

function dishCardHTML(item) {
    const avg = computeAverageScore(item);
    const ratingText = avg === null ? "—" : avg.toFixed(1) + " / 10";
    const restaurantName = item.restaurants?.name || pick("რესტორანი", "Restaurant");
    const restaurantCity = item.restaurants?.city || "";

    return `
        <div class="card">
            <h3>${restaurantName}</h3>
            ${restaurantCity ? `<p class="card-location">${restaurantCity}</p>` : ""}
            <p><strong>${item.name}</strong></p>
            <p>${item.dish_type || ""}</p>
            <p>${item.price != null ? item.price + " ₾" : ""}</p>
            <div class="rating">${ratingText}</div>
        </div>
    `;
}

function showDishes(dishes) {
    cardList.innerHTML = "";

    if (dishes.length === 0) {
        cardList.innerHTML = `<p class="section-note">${pick("შედეგი არ მოიძებნა.", "No results found.")}</p>`;
        return;
    }

    dishes.forEach(function (item) {
        cardList.innerHTML += dishCardHTML(item);
    });
}

function applyFilters() {
    const searchText = searchInput.value.trim().toLowerCase();

    let filtered = allDishes;

    if (activeCategory !== "all") {
        filtered = filtered.filter(function (item) {
            return item.dish_type === activeCategory;
        });
    }

    if (searchText !== "") {
        filtered = filtered.filter(function (item) {
            const dishName = (item.name || "").toLowerCase();
            const dishType = (item.dish_type || "").toLowerCase();
            const restaurantName = (item.restaurants?.name || "").toLowerCase();

            return dishName.includes(searchText) ||
                   dishType.includes(searchText) ||
                   restaurantName.includes(searchText);
        });
    }

    showDishes(filtered);
}

async function loadDishes() {
    const { data, error } = await supabaseClient
        .from("dishes")
        .select(`
            *,
            restaurants(name, city),
            evaluations(total_score)
        `);

    if (error) {
        console.log("შეცდომა:", error);
        return;
    }

    allDishes = data;
    showDishes(allDishes);
    renderTopDishes();
}

function renderTopDishes() {
    const ranked = allDishes
        .map(function (item) {
            return { item: item, avg: computeAverageScore(item) };
        })
        .filter(function (entry) { return entry.avg !== null; })
        .sort(function (a, b) { return b.avg - a.avg; })
        .slice(0, 5);

    topList.innerHTML = "";

    if (ranked.length === 0) {
        topList.innerHTML = `<p class="section-note">${pick("შედეგი არ მოიძებნა.", "No results found.")}</p>`;
        return;
    }

    ranked.forEach(function (entry) {
        const restaurantName = entry.item.restaurants?.name || pick("რესტორანი", "Restaurant");
        const restaurantCity = entry.item.restaurants?.city || "";

        topList.innerHTML += `
            <div class="card">
                <h3>${entry.item.name}</h3>
                <p>${restaurantName}${restaurantCity ? " — " + restaurantCity : ""}</p>
                <p>${entry.item.dish_type || ""}</p>
                <div class="rating">${entry.avg.toFixed(1)} / 10</div>
            </div>
        `;
    });
}

async function loadStatistics() {
    const [restaurants, dishes, evaluationsCount, evaluationsInspectorIds] = await Promise.all([
        supabaseClient.from("restaurants").select("*", { count: "exact", head: true }),
        supabaseClient.from("dishes").select("*", { count: "exact", head: true }),
        supabaseClient.from("evaluations").select("*", { count: "exact", head: true }),
        // inspectors ცხრილზე public select policy განზრახ არ არსებობს (schema.sql) —
        // ანონიმურობა დაცულია ბაზის დონეზეც. ამიტომ შემფასებელთა რაოდენობას
        // ვითვლით საჯაროდ ღია evaluations.inspector_id-ის უნიკალური მნიშვნელობებიდან.
        supabaseClient.from("evaluations").select("inspector_id")
    ]);

    const uniqueInspectorIds = new Set(
        (evaluationsInspectorIds.data || []).map(function (row) { return row.inspector_id; })
    );

    document.getElementById("restaurantCount").textContent = restaurants.count ?? 0;
    document.getElementById("dishCount").textContent = dishes.count ?? 0;
    document.getElementById("inspectorCount").textContent = uniqueInspectorIds.size;
    document.getElementById("evaluationCount").textContent = evaluationsCount.count ?? 0;
}

// i18n.js-ში updatePageText ჯერ ცარიელია — აქ ვუთვალისწინებთ ამ გვერდის
// საკუთარ ტექსტს და ენის გადართვისას ხელახლა ვამუშავებთ ბარათებსაც.
function updatePageText() {
    document.getElementById("heroBadge").textContent = pick("პროფესიონალური შეფასება", "Professional Evaluation");
    document.getElementById("heroTitle1").textContent = pick("საქართველოს საუკეთესო", "Georgia's Finest");
    document.getElementById("heroTitleSpan").textContent = pick("კერძები", "Dishes");
    document.getElementById("heroSubtitle").textContent = pick(
        "პროფესიონალი შემფასებლების მიერ შეფასებული რესტორნები და კერძები.",
        "Restaurants and dishes evaluated by professional inspectors."
    );
    searchInput.placeholder = pick("მოძებნე კერძი ან რესტორანი", "Search for a dish or restaurant");
    searchBtn.textContent = pick("ძიება", "Search");

    document.getElementById("restaurantLabel").textContent = pick("რესტორანი", "Restaurants");
    document.getElementById("dishLabel").textContent = pick("კერძი", "Dishes");
    document.getElementById("inspectorLabel").textContent = pick("შემფასებელი", "Inspectors");
    document.getElementById("evaluationLabel").textContent = pick("შეფასება", "Evaluations");

    document.getElementById("top5Heading").textContent = pick("TOP 5 კერძი", "Top 5 Dishes");
    document.getElementById("bestRatedHeading").textContent = pick("საუკეთესო შეფასებული კერძები", "Best Rated Dishes");

    renderCategoryFilter();
    applyFilters();
    renderTopDishes();
}

searchBtn.addEventListener("click", applyFilters);

searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        applyFilters();
    }
});

renderCategoryFilter();
loadDishes();
loadStatistics();