"use strict";

// Assignment 5: данные игр и корзина.


// Первые три цены были в Assignment 4. Остальные нужны для учебного магазина.
// Храним цены в центах, чтобы при сложении не появлялись лишние дробные знаки.
const games = [
    { id: "cyber", title: "Cyber Quest", category: "Action", price: 1999, image: "../images/game1.jpg" },
    { id: "dragon", title: "Dragon Realm", category: "RPG", price: 2999, image: "../images/game2.jpg" },
    { id: "space", title: "Space Raiders", category: "Action", price: 2499, image: "../images/game3.jpg" },
    { id: "gta", title: "GTA VI", category: "Action", price: 5999, image: "../images/game4.jpg" },
    { id: "baldur", title: "Baldur's Gate 3", category: "RPG", price: 4999, image: "../images/game5.jpg" },
    { id: "minecraft", title: "Minecraft", category: "Simulation", price: 2699, image: "../images/game6.jpg" },
    { id: "elden", title: "Elden Ring", category: "RPG", price: 3999, image: "../images/game7.jpg" },
    { id: "witcher", title: "The Witcher 3", category: "RPG", price: 1999, image: "../images/game8.jpg" },
    { id: "hollow", title: "Hollow Knight", category: "Adventure", price: 1499, image: "../images/game9.jpg" }
];

function formatPrice(cents) {
    return "$" + (cents / 100).toFixed(2);
}

// Если браузер запретил сохранение, страница всё равно продолжает работать.
const storage = {
    available: true,
    read(key, fallback) {
        try {
            const value = localStorage.getItem("gamestore-" + key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            if (error.name !== "SyntaxError") this.available = false;
            return fallback;
        }
    },
    write(key, value) {
        try {
            localStorage.setItem("gamestore-" + key, JSON.stringify(value));
        } catch (error) {
            this.available = false;
            const notice = document.getElementById("storage-notice");
            if (notice) notice.hidden = false;
        }
    }
};

// Объект хранит корзину и методы для работы с ней. Одну игру добавляем один раз.
const cart = {
    ids: [],
    load() {
        const saved = storage.read("cart", []);
        this.ids = Array.isArray(saved)
            ? [...new Set(saved.filter(id => games.some(game => game.id === id)))] : [];
    },
    getGames() {
        return games.filter(game => this.ids.includes(game.id));
    },
    total() {
        let sum = 0;
        for (const game of this.getGames()) sum += game.price;
        return sum;
    },
    save() {
        storage.write("cart", this.ids);
        document.querySelectorAll(".cart-count").forEach(badge => {
            badge.textContent = this.ids.length;
        });
    },
    add(id) {
        if (!games.some(game => game.id === id) || this.ids.includes(id)) return false;
        this.ids.push(id);
        this.save();
        return true;
    },
    remove(id) {
        this.ids = this.ids.filter(savedId => savedId !== id);
        this.save();
    },
    clear() {
        this.ids = [];
        this.save();
    }
};
cart.load();

// Тема, звук и управление меню.
// Файл подключён ко всем страницам. Проверяем наличие элементов перед работой с ними.
const statusMessage = document.getElementById("status-message");
let statusTimer;
function notify(message) {
    if (window.showToast) {
        window.showToast(message);
        return;
    }
    statusMessage.textContent = message;
    statusMessage.classList.add("visible");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => statusMessage.classList.remove("visible"), 4500);
}

// Один плеер: быстрые клики перезапускают звук, а не накладывают его копии.
const notificationSound = new Audio("../sounds/notification.wav");
notificationSound.volume = 0.25;
let soundEnabled = storage.read("sound", false) === true;
const soundButton = document.getElementById("sound-toggle");
function playSound() {
    if (!soundEnabled) return;
    notificationSound.pause();
    notificationSound.currentTime = 0;
    notificationSound.play().catch(error => {
        if (error.name !== "AbortError") notify("Sound could not play. Try the sound button again.");
    });
}
function updateSoundButton() {
    soundButton.textContent = soundEnabled ? "Sound: on" : "Sound: off";
    soundButton.setAttribute("aria-pressed", soundEnabled);
}
soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    storage.write("sound", soundEnabled);
    updateSoundButton();
    if (soundEnabled) playSound();
    else notificationSound.pause();
});
updateSoundButton();

// Тема меняется одним классом, а сами цвета лежат в CSS.
const themeButton = document.getElementById("theme-toggle");
function applyTheme(light) {
    document.body.classList.toggle("light-theme", light);
    document.body.style.backgroundColor = "";
    themeButton.textContent = light ? "Night theme" : "Day theme";
    themeButton.setAttribute("aria-pressed", light);
}
applyTheme(storage.read("theme", "dark") === "light");
themeButton.addEventListener("click", () => {
    const light = !document.body.classList.contains("light-theme");
    applyTheme(light);
    storage.write("theme", light ? "light" : "dark");
});

// Стрелки передвигают фокус, Enter открывает выбранную страницу.
const navigationLinks = Array.from(document.querySelectorAll("#main-navigation .nav-link"));
navigationLinks.forEach((link, index) => {
    link.addEventListener("keydown", event => {
        let nextIndex = index;
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown": nextIndex = (index + 1) % navigationLinks.length; break;
            case "ArrowLeft":
            case "ArrowUp": nextIndex = (index - 1 + navigationLinks.length) % navigationLinks.length; break;
            case "Home": nextIndex = 0; break;
            case "End": nextIndex = navigationLinks.length - 1; break;
            default: return;
        }
        event.preventDefault();
        navigationLinks[nextIndex].focus();
    });
});


// Рейтинг магазина.
// Это личная оценка в этом браузере, а не средний рейтинг всех пользователей.
const stars = document.querySelectorAll(".rating-star");
if (stars.length) {
    const ratingMessage = document.getElementById("rating-message");
    function renderRating(rating) {
        stars.forEach(star => {
            star.classList.toggle("selected", Number(star.dataset.rating) <= rating);
            star.setAttribute("aria-pressed", Number(star.dataset.rating) === rating);
        });
        ratingMessage.textContent = rating ? "Your rating: " + rating + " / 5" : "Choose 1 to 5 stars.";
    }
    const savedRating = storage.read("rating", 0);
    renderRating(Number.isInteger(savedRating) && savedRating >= 1 && savedRating <= 5 ? savedRating : 0);
    stars.forEach(star => {
        star.addEventListener("click", () => {
            const rating = Number(star.dataset.rating);
            storage.write("rating", rating);
            renderRating(rating);
            playSound();
        });
    });
}
cart.save();
if (!storage.available) document.getElementById("storage-notice").hidden = false;


// Шаги оформления заказа.
if (checkoutForm) {
const steps = Array.from(document.querySelectorAll(".checkout-step"));
const stepLabels = document.querySelectorAll(".step-label");
let currentStep = 0;
function updateOrderSummary() {
    const summary = document.getElementById("order-summary");
    const titles = cart.getGames().map(game => game.title).join(", ") || "No games selected";
    const payment = checkoutForm.querySelector('input[name="payment"]:checked').value;
    // textContent выводит имя как обычный текст, даже если в него написали HTML.
    summary.textContent = "Games: " + titles + "\nTotal: " + formatPrice(cart.total())
        + "\nName: " + document.getElementById("name").value.trim()
        + "\nEmail: " + document.getElementById("email").value.trim()
        + "\nCountry: " + document.getElementById("country").value + "\nPayment: " + payment;
}
function renderStep(step) {
    steps.forEach((panel, index) => panel.hidden = index !== step);
    stepLabels.forEach((label, index) => {
        label.classList.toggle("current", index === step);
        if (index === step) label.setAttribute("aria-current", "step");
        else label.removeAttribute("aria-current");
    });
    document.getElementById("step-back").hidden = step === 0;
    document.getElementById("step-next").hidden = step === steps.length - 1;
    document.getElementById("place-order").hidden = step !== steps.length - 1;
    document.getElementById("step-status").textContent = "Step " + (step + 1) + " of " + steps.length;
    if (step === 2) updateOrderSummary();
}

// onStepChanged - callback: вызываем переданную функцию после изменения шага.
function changeStep(nextStep, onStepChanged) {
    currentStep = Math.max(0, Math.min(nextStep, steps.length - 1));
    onStepChanged(currentStep);
    steps[currentStep].querySelector("h3").focus();
}
function goNext() {
    if (currentStep === 0 && !validateDetails()) return;
    changeStep(currentStep + 1, renderStep);
}
// Enter в поле первого шага тоже запускает проверку, даже если корзина ещё пуста.
checkoutForm.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.target.matches("input") && currentStep < 2) {
        event.preventDefault();
        goNext();
    }
});
document.getElementById("step-next").addEventListener("click", goNext);
document.getElementById("step-back").addEventListener("click", () => changeStep(currentStep - 1, renderStep));
document.getElementById("reset-checkout").addEventListener("click", () => {
    checkoutForm.reset();
    clearErrors();
    document.getElementById("order-status").textContent = "";
    changeStep(0, renderStep);
});
checkoutForm.addEventListener("submit", event => {
    event.preventDefault();
    // Enter на первых шагах работает так же, как Next.
    if (currentStep < steps.length - 1) {
        goNext(); return;
    }
    if (!cart.ids.length) {
        notify("Add a game before placing an order."); return;
    }
    changeStep(0, renderStep);
    if (!validateDetails()) return;
    const total = formatPrice(cart.total());
    cart.clear();
    renderCart();
    checkoutForm.reset();
    clearErrors();
    document.getElementById("order-status").textContent = "Demo order completed: " + total
        + ". No payment was charged and no data was sent.";
    document.getElementById("order-status").focus();
    notify("Demo order completed!");
    playSound();
});
renderStep(0);
    window.updateOrderSummary = updateOrderSummary;

}

// Каталог, галерея и кнопки корзины.


// Catalog rendering and search are in assignment6.js.

// Один обработчик работает и со старыми карточками, и с карточками после фильтрации.
document.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    const game = games.find(item => item.id === button.dataset.add);
    if (!game) return;
    const added = cart.add(game.id);
    notify(added ? game.title + " added to cart." : game.title + " is already in your cart.");
    if (added) playSound();
    const card = button.closest("article");
    card.classList.remove("just-added");
    // Браузер должен заметить удаление класса, чтобы повторить анимацию.
    void card.offsetWidth;
    card.classList.add("just-added");
});

// Меняем оба атрибута: картинку src и её описание alt.
const galleryPreview = document.getElementById("gallery-preview");
if (galleryPreview) {
    document.querySelectorAll(".gallery-thumb").forEach(button => {
        button.addEventListener("click", () => {
            const thumbnail = button.querySelector("img");
            galleryPreview.src = thumbnail.getAttribute("data-src") || thumbnail.getAttribute("src");
            galleryPreview.removeAttribute("data-src");
            galleryPreview.alt = thumbnail.alt;
            document.getElementById("gallery-caption").textContent = thumbnail.alt;
            document.querySelectorAll(".gallery-thumb").forEach(item => {
                item.setAttribute("aria-pressed", item === button);
            });
        });
    });
}

function renderCart() {
    const cartBody = document.getElementById("cart-items");
    if (!cartBody) return;
    cartBody.replaceChildren();
    for (const game of cart.getGames()) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${game.title}</td><td>${game.category}</td>
            <td>${formatPrice(game.price)}</td><td><button class="btn btn-outline-light btn-sm"
            type="button" data-remove="${game.id}" aria-label="Remove ${game.title}">Remove</button></td>`;
        cartBody.append(row);
    }
    document.getElementById("cart-total").textContent = formatPrice(cart.total());
    document.getElementById("empty-cart").hidden = cart.ids.length > 0;
    document.getElementById("clear-cart").disabled = cart.ids.length === 0;
    document.getElementById("place-order").disabled = cart.ids.length === 0;
    if (typeof updateOrderSummary === "function") updateOrderSummary();
}
const cartBody = document.getElementById("cart-items");
if (cartBody) {
    cartBody.addEventListener("click", event => {
        const button = event.target.closest("[data-remove]");
        if (!button) return;
        cart.remove(button.dataset.remove);
        renderCart();
        const nextButton = cartBody.querySelector("button") || document.getElementById("continue-shopping");
        nextButton.focus();
        notify("Game removed from cart.");
    });
    document.getElementById("clear-cart").addEventListener("click", () => {
        cart.clear();
        renderCart();
        document.getElementById("continue-shopping").focus();
        notify("Cart cleared.");
    });
    renderCart();
}

// Изменение корзины в соседней вкладке тоже сразу появится здесь.
window.addEventListener("storage", event => {
    if (event.key !== "gamestore-cart" && event.key !== null) return;
    cart.load();
    document.querySelectorAll(".cart-count").forEach(badge => badge.textContent = cart.ids.length);
    renderCart();
});
