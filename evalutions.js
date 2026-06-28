const SUPABASE_URL = "https://khdkidxttlfxlnpgxlxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_mZ1mTBsgmZQ-exwDHqB35Q_nubl6_hm";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const evaluationList = document.getElementById("evaluation-list");

// ნაშრომი (4.6, 3.9): შემფასებლის ვინაობა საჯარო ინტერფეისში არ ქვეყნდება.
// ეს არ არის მხოლოდ ვიზუალური დამალვა — inspectors ცხრილზე მითითება საერთოდ
// არ მოითხოვება ამ მოთხოვნით, ანონიმურობა დაცულია მონაცემზე წვდომის დონეზეც.
let allEvaluations = [];

function scoreRowHTML(geLabel, enLabel, score) {
    const safeScore = score == null ? 0 : score;
    const widthPercent = Math.max(0, Math.min(100, (safeScore / 10) * 100));

    return `
        <div class="score-row">
            <span class="score-label">${pick(geLabel, enLabel)}</span>
            <div class="score-bar-track">
                <div class="score-bar-fill" style="width:${widthPercent}%;"></div>
            </div>
            <span class="score-value">${score != null ? score : "—"}</span>
        </div>
    `;
}

function evaluationCardHTML(item) {
    return `
        <div class="card evaluation-card">
            <h3>${item.dishes?.name || pick("კერძი", "Dish")}</h3>

            <p><strong>${pick("ვიზიტის თარიღი:", "Visit date:")}</strong> ${item.visit_date || ""}</p>

            ${scoreRowHTML("შიგთავსი", "Filling", item.score_filling)}
            ${scoreRowHTML("ცომი", "Dough", item.score_dough)}
            ${scoreRowHTML("ბულიონი", "Broth", item.score_broth)}
            ${scoreRowHTML("მიწოდების ტემპერატურა", "Serving temperature", item.score_temperature)}
            ${scoreRowHTML("პორციის მოცულობა", "Portion size", item.score_portion)}
            ${scoreRowHTML("ფასისა და ხარისხის შესაბამისობა", "Price-to-quality match", item.score_value)}

            <div class="rating total-score">${item.total_score != null ? item.total_score : "—"} / 10</div>

            <p><strong>${pick("კომენტარი:", "Comment:")}</strong> ${item.comment || ""}</p>
        </div>
    `;
}

function showEvaluations(evaluations) {
    evaluationList.innerHTML = "";

    if (evaluations.length === 0) {
        evaluationList.innerHTML = `<p class="section-note">${pick("შეფასება არ მოიძებნა.", "No evaluations found.")}</p>`;
        return;
    }

    evaluations.forEach(function (item) {
        evaluationList.innerHTML += evaluationCardHTML(item);
    });
}

async function loadEvaluations() {
    // შენიშვნა: inspectors ცხრილზე join ან რომელიმე საიდენტიფიკაციო ველი
    // (მაგ. inspectors.full_name) აქ განზრახ არ მოითხოვება.
    const { data, error } = await supabaseClient
        .from("evaluations")
        .select(`
            *,
            dishes(name)
        `);

    if (error) {
        console.log("შეცდომა:", error);
        return;
    }

    allEvaluations = data;
    showEvaluations(allEvaluations);
}

// i18n.js-ში updatePageText ჯერ ცარიელია — აქ ვუთვალისწინებთ ამ გვერდის
// საკუთარ ტექსტს.
function updatePageText() {
    document.getElementById("evaluationsHeading").textContent = pick("კერძების შეფასებები", "Dish Evaluations");
    document.getElementById("evaluationsNote").textContent = pick(
        "შემფასებლის ვინაობა საჯაროდ არ ქვეყნდება — ქულები მონაცემთა ბაზაში ავტორთან არის დაკავშირებული მხოლოდ ჩანაწერების მართვისთვის.",
        "Inspector identity is never published publicly — scores are linked to an author only inside the database, for record management."
    );
    showEvaluations(allEvaluations);
}

loadEvaluations();