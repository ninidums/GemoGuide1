// ეს ფაილი მართავს ენების გადართვას (ქართული/ინგლისური).
// ყველა გვერდს საერთო ნავიგაცია აქვს, ამიტომ ნავიგაციის ტექსტი აქ იცვლება.
// კონკრეტული გვერდის სხვა ტექსტი (სათაურები, ბარათები და სხვ.) იცვლება
// script.js / restaurants.js / evaluations.js ფაილებში, რომლებიც თავად
// გადაუსვამენ updatePageText ფუნქციას, რომელიც აქ ჯერ ცარიელია.

let currentLang = "ge";

function pick(geText, enText) {
    if (currentLang === "ge") {
        return geText;
    } else {
        return enText;
    }
}

// admin გვერდს ჯერ არ აქვს სრულყოფილი ავტორიზაცია (იხ. ნაშრომი, 6.3) —
// ანუ ნებისმიერს, ვინც ამ მისამართს იცის, შეუძლია მონაცემის დამატება.
// ამიტომ ბაზიდან მოსული ტექსტი (სახელი, ქალაქი, კომენტარი და სხვ.) აქ
// ყოველთვის უსაფრთხოდ ვწმენდთ, სანამ გვერდზე ჩაჯდება — წინააღმდეგ
// შემთხვევაში ვინმეს შეეძლო რესტორნის სახელად კოდი ჩაეწერა.
function escapeHtml(value) {
    if (value == null) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function updateNavText() {
    const homeLink = document.querySelector('a[href="index.html"]');
    if (homeLink) homeLink.textContent = pick("მთავარი", "Home");

    const restaurantsLink = document.querySelector('a[href="restaurants.html"]');
    if (restaurantsLink) restaurantsLink.textContent = pick("რესტორნები", "Restaurants");

    const dishesLink = document.querySelector('a[href="index.html#dishes-section"]');
    if (dishesLink) dishesLink.textContent = pick("კერძები", "Dishes");

    const evaluationsLink = document.querySelector('a[href="evaluations.html"]');
    if (evaluationsLink) evaluationsLink.textContent = pick("შეფასებები", "Evaluations");

    const langToggle = document.getElementById("langToggle");
    if (langToggle) langToggle.textContent = pick("EN", "ქართ");
}

// კონკრეტული გვერდის script.js ხშირად თავიდან გადააწერს ამ ფუნქციას,
// რომ თავის ბარათები/სათაურები ენის გადართვისას განაახლოს.
function updatePageText() {
}

function toggleLanguage() {
    if (currentLang === "ge") {
        currentLang = "en";
    } else {
        currentLang = "ge";
    }

    updateNavText();
    updatePageText();
}

document.addEventListener("DOMContentLoaded", function () {
    updateNavText();

    const langToggle = document.getElementById("langToggle");
    if (langToggle) {
        langToggle.addEventListener("click", toggleLanguage);
    }
});