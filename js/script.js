"use strict";

// Assignment 4: часы, фон, подписка, FAQ и проверка формы.

// Часы из Assignment 4 обновляются без перезагрузки.
const dateTimeBox = document.getElementById("datetime");
function showDateTime() {
    const now = new Date();
    dateTimeBox.textContent = now.toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric"
    }) + ", " + now.toLocaleTimeString("en-US");
}
if (dateTimeBox) {
    showDateTime();
    setInterval(showDateTime, 1000);
}
const colorButton = document.getElementById("color-btn");
const darkColors = ["#12131c", "#1f3a5f", "#3b1f4a", "#1f4a3a", "#5a2a2a"];
const lightColors = ["#f1f3fa", "#e1ecfa", "#efe3f6", "#e0f2e9", "#fae6e6"];
let colorIndex = 0;
if (colorButton) {
    colorButton.addEventListener("click", () => {
        colorIndex = (colorIndex + 1) % darkColors.length;
        const colors = document.body.classList.contains("light-theme") ? lightColors : darkColors;
        document.body.style.backgroundColor = colors[colorIndex];
    });
}

// Подписка осталась. Это учебная форма: письмо никуда не отправляется.
const popup = document.getElementById("popup");
if (popup) {
    const openButton = document.getElementById("open-popup");
    const closeButton = document.getElementById("close-popup");
    const form = document.getElementById("subscribe-form");
    const email = document.getElementById("sub-email");
    const error = document.getElementById("sub-error");
    function closePopup() {
        popup.classList.remove("show");
        popup.setAttribute("aria-hidden", "true");
        document.querySelectorAll("main, header, aside").forEach(area => area.inert = false);
        openButton.focus();
    }
    openButton.addEventListener("click", () => {
        popup.classList.add("show");
        popup.setAttribute("aria-hidden", "false");
        document.querySelectorAll("main, header, aside").forEach(area => area.inert = true);
        email.focus();
    });
    closeButton.addEventListener("click", closePopup);
    popup.addEventListener("click", event => {
        if (event.target === popup) closePopup();
    });
    popup.addEventListener("keydown", event => {
        if (event.key === "Escape") closePopup();
        if (event.key !== "Tab") return;
        const controls = popup.querySelectorAll("button, input");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
        }
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            error.textContent = "Please enter a valid email";
            email.setAttribute("aria-invalid", "true");
            email.focus();
            return;
        }
        error.textContent = "";
        email.removeAttribute("aria-invalid");
        function finishSubscription() {
            form.reset();
            closePopup();
            notify("Thanks! Demo subscription completed. No email was sent.");
            playSound();
        }
        // Assignment 6 adds loading after the existing validation.
        if (window.submitWithSpinner) window.submitWithSpinner(form, finishSubscription);
        else finishSubscription();
    });
}

// FAQ из прошлого задания. Берём высоту ответа, чтобы текст не обрезался.
document.querySelectorAll(".accordion-item").forEach((item, index) => {
    const question = item.querySelector(".accordion-question");
    const answer = item.querySelector(".accordion-answer");
    answer.id = "faq-answer-" + index;
    question.setAttribute("aria-controls", answer.id);
    question.setAttribute("aria-expanded", "false");
    answer.setAttribute("aria-hidden", "true");
    question.addEventListener("click", () => {
        const open = item.classList.toggle("open");
        question.setAttribute("aria-expanded", open);
        answer.setAttribute("aria-hidden", !open);
        answer.style.maxHeight = open ? answer.scrollHeight + "px" : null;
    });
});
window.addEventListener("resize", () => {
    document.querySelectorAll(".accordion-item.open .accordion-answer").forEach(answer => {
        answer.style.maxHeight = answer.scrollHeight + "px";
    });
});


const checkoutForm = document.getElementById("checkout-form");

function clearErrors() {
    checkoutForm.querySelectorAll(".error-msg").forEach(error => error.textContent = "");
    checkoutForm.querySelectorAll("[aria-invalid]").forEach(input => input.removeAttribute("aria-invalid"));
}

// Проверки из Assignment 4: имя, email, длина пароля и совпадение паролей.
function validateDetails() {
    clearErrors();
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirm = document.getElementById("confirm-password");
    let firstInvalid = null;
    function showError(input, errorId, message) {
        document.getElementById(errorId).textContent = message;
        input.setAttribute("aria-invalid", "true");
        if (!firstInvalid) firstInvalid = input;
    }
    if (!name.value.trim()) showError(name, "name-error", "Name is required");
    if (!email.value.trim()) showError(email, "email-error", "Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showError(email, "email-error", "Enter a valid email (example@mail.com)");
    }
    if (!password.value) showError(password, "password-error", "Password is required");
    else if (password.value.length < 8) showError(password, "password-error", "Password must be at least 8 characters");
    if (!confirm.value) showError(confirm, "confirm-error", "Please confirm your password");
    else if (confirm.value !== password.value) showError(confirm, "confirm-error", "Passwords do not match");
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
}

