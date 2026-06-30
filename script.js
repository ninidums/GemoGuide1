const SUPABASE_URL = "https://lgqtgsjktccvplmkxwzk.supabase.co";
const SUPABASE_KEY = "sb_publishable_dPPLqeAATNdMrcwsIsG2ZQ_iK1k_EPI";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const cardList = document.getElementById("card-list");
const topList = document.getElementById("top-list");
const categoryFilter = document.getElementById("categoryFilter");
const dishPagination = document.getElementById("dishPagination");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// კერძების კატეგორიები (ნაშრომი, 5.3): ხინკალი, ხაჭაპური, მწვადი, ქართული სუპი, სალათი, ღვინო
const CATEGORIES = ["ხინკალი", "ხაჭაპური", "მწვადი", "წვნიანი", "სალათი"];

const DISHES_PER_PAGE = 4;

let allDishes = [];
let activeCategory = "all";
let currentDishPage = 1;
let lastFilteredDishes = [];

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
    const imageSrc = item.image_url || "placeholder-dish.svg";

    return `
        <div class="card">
            <img class="card-image" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null; this.src='placeholder-dish.svg';">
            <h3>${escapeHtml(restaurantName)}</h3>
            ${restaurantCity ? `<p class="card-location">${escapeHtml(restaurantCity)}</p>` : ""}
            <p><strong>${escapeHtml(item.name)}</strong></p>
            <p>${escapeHtml(item.dish_type)}</p>
            <p>${item.price != null ? item.price + " ₾" : ""}</p>
            <div class="rating">${ratingText}</div>
        </div>
    `;
}

function showDishes(dishes) {
    cardList.innerHTML = "";

    if (dishes.length === 0) {
        cardList.innerHTML = `<p class="section-note">${pick("შედეგი არ მოიძებნა.", "No results found.")}</p>`;
        dishPagination.innerHTML = "";
        return;
    }

    const start = (currentDishPage - 1) * DISHES_PER_PAGE;
    const pageItems = dishes.slice(start, start + DISHES_PER_PAGE);

    pageItems.forEach(function (item) {
        cardList.innerHTML += dishCardHTML(item);
    });

    renderDishPagination(dishes.length);
}

function renderDishPagination(totalItems) {
    dishPagination.innerHTML = "";

    const totalPages = Math.ceil(totalItems / DISHES_PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = "page-btn" + (i === currentDishPage ? " active" : "");
        btn.textContent = i;
        btn.addEventListener("click", function () {
            currentDishPage = i;
            showDishes(lastFilteredDishes);
        });
        dishPagination.appendChild(btn);
    }
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

    currentDishPage = 1;
    lastFilteredDishes = filtered;
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
    lastFilteredDishes = data;
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
        const imageSrc = entry.item.image_url || "placeholder-dish.svg";

        topList.innerHTML += `
            <div class="card">
                <img class="card-image" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(entry.item.name)}" onerror="this.onerror=null; this.src='placeholder-dish.svg';">
                <h3>${escapeHtml(entry.item.name)}</h3>
                <p>${escapeHtml(restaurantName)}${restaurantCity ? " — " + escapeHtml(restaurantCity) : ""}</p>
                <p>${escapeHtml(entry.item.dish_type)}</p>
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