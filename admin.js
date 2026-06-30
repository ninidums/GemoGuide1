const SUPABASE_URL = "https://lgqtgsjktccvplmkxwzk.supabase.co";
const SUPABASE_KEY = "sb_publishable_dPPLqeAATNdMrcwsIsG2ZQ_iK1k_EPI";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const addRestaurantBtn = document.getElementById("addRestaurantBtn");
const adminMessage = document.getElementById("adminMessage");

async function addRestaurant() {
    const name = document.getElementById("restaurantName").value;
    const city = document.getElementById("restaurantCity").value;
    const address = document.getElementById("restaurantAddress").value;
    const cuisine = document.getElementById("restaurantCuisine").value;
    const image = document.getElementById("restaurantImage").value;

    if (name === "" || city === "") {
        adminMessage.textContent = "გთხოვ შეავსო რესტორნის სახელი და ქალაქი.";
        return;
    }

    const { error } = await supabaseClient
        .from("restaurants")
        .insert([
            {
                name: name,
                city: city,
                address: address,
                cuisine_type: cuisine,
                image_url: image || null
            }
        ]);

    if (error) {
        console.log(error);
        adminMessage.textContent = "მონაცემის დამატებისას მოხდა შეცდომა.";
        return;
    }

    adminMessage.textContent = "რესტორანი წარმატებით დაემატა.";

    document.getElementById("restaurantName").value = "";
    document.getElementById("restaurantCity").value = "";
    document.getElementById("restaurantAddress").value = "";
    document.getElementById("restaurantCuisine").value = "";
    document.getElementById("restaurantImage").value = "";
}

addRestaurantBtn.addEventListener("click", addRestaurant);

const addDishBtn = document.getElementById("addDishBtn");
const dishMessage = document.getElementById("dishMessage");

// მნიშვნელოვანი: კერძის საშუალო შეფასება აქ ხელით არ ემატება.
// ის ყოველთვის გამოითვლება ცალკეული პროფესიული შეფასებების (evaluations
// ცხრილის total_score მნიშვნელობების) საშუალოდან — იხ. script.js,
// computeAverageScore(). ეს შესაბამისობაშია ნაშრომის 3.7/4.5 აღწერილ
// მოდელთან, სადაც ერთ კერძს რამდენიმე პროფესიონალი აფასებს.
async function addDish() {
    addDishBtn.disabled = true;

    const restaurantId = document.getElementById("dishRestaurantId").value;
    const dishName = document.getElementById("dishName").value;
    const dishType = document.getElementById("dishType").value;
    const dishPrice = document.getElementById("dishPrice").value;
    const dishImage = document.getElementById("dishImage").value;

    if (restaurantId === "" || dishName === "") {
        dishMessage.textContent = "გთხოვ შეავსო რესტორნის ID და კერძის სახელი.";
        addDishBtn.disabled = false;
        return;
    }

    const { error } = await supabaseClient
        .from("dishes")
        .insert([
            {
                restaurant_id: restaurantId,
                name: dishName,
                dish_type: dishType,
                price: dishPrice,
                image_url: dishImage || null
            }
        ]);

    addDishBtn.disabled = false;

    if (error) {
        console.log(error);
        dishMessage.textContent = "შეცდომა დაფიქსირდა.";
        return;
    }

    dishMessage.textContent = "კერძი წარმატებით დაემატა.";

    document.getElementById("dishRestaurantId").value = "";
    document.getElementById("dishName").value = "";
    document.getElementById("dishPrice").value = "";
    document.getElementById("dishImage").value = "";
}

addDishBtn.addEventListener("click", addDish);