"use strict";

// Task 0: run after the page and previous assignment scripts are ready.
$(document).ready(function () {
    console.log("jQuery is ready!");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Task 3: mark every literal match without inserting search text as HTML.
    function highlightText(element, query) {
        const $element = $(element);
        const original = $element.data("originalText") || $element.text();
        $element.data("originalText", original).empty();
        const lower = original.toLowerCase();
        let start = 0;
        let match = query ? lower.indexOf(query) : -1;

        while (match !== -1) {
            $element.append(document.createTextNode(original.slice(start, match)));
            $("<mark>").text(original.slice(match, match + query.length)).appendTo($element);
            start = match + query.length;
            match = lower.indexOf(query, start);
        }
        $element.append(document.createTextNode(original.slice(start)));
    }

    // Tasks 1-2: live search, existing genre/price filters, and title suggestions.
    const $grid = $("#catalog-grid");
    if ($grid.length) {
        const $search = $("#game-search");
        const $category = $("#category-filter");
        const $price = $("#price-filter");
        const $suggestions = $("#search-suggestions");
        let activeSuggestion = -1;

        games.forEach(function (game) {
            // The template contains only fixed game data from Assignment 5.
            $("<div>").addClass("col-12 col-sm-6 col-lg-4").data("game", game).html(`
                <article class="catalog-card card h-100">
                    <img src="../images/placeholder.svg" data-src="${game.image}" alt="${game.title}">
                    <div class="card-body d-flex flex-column p-3">
                        <h3 class="card-title">${game.title}</h3>
                        <p class="card-text">${game.category}</p>
                        <strong class="mt-auto">${formatPrice(game.price)}</strong>
                        <button class="btn btn-primary mt-3" type="button" data-add="${game.id}">Add to Cart</button>
                    </div>
                </article>`).appendTo($grid);
        });

        function matchesFilters(game) {
            if ($category.val() !== "all" && game.category !== $category.val()) return false;
            switch ($price.val()) {
                case "under25": return game.price < 2500;
                case "25to40": return game.price >= 2500 && game.price <= 4000;
                case "over40": return game.price > 4000;
                default: return true;
            }
        }

        function closeSuggestions() {
            $suggestions.prop("hidden", true);
            $search.attr("aria-expanded", "false").removeAttr("aria-activedescendant");
            activeSuggestion = -1;
        }

        function showSuggestions() {
            const query = $search.val().trim().toLowerCase();
            $suggestions.empty();
            closeSuggestions();
            if (!query) return;
            const matches = games.filter(game => matchesFilters(game)
                && game.title.toLowerCase().includes(query)).slice(0, 6);
            matches.forEach(function (game, index) {
                $("<li>").attr({ id: "suggestion-" + index, role: "option", "aria-selected": "false" })
                    .text(game.title).appendTo($suggestions);
            });
            $suggestions.prop("hidden", matches.length === 0);
            $search.attr("aria-expanded", String(matches.length > 0));
        }

        function filterGames() {
            const query = $search.val().trim().toLowerCase();
            const $cards = $grid.children();
            $cards.hide();
            const $matches = $cards.filter(function () {
                const game = $(this).data("game");
                return matchesFilters(game) && (game.title + " " + game.category).toLowerCase().includes(query);
            }).show();
            $cards.find(".card-title, .card-text").each(function () { highlightText(this, query); });
            $("#result-count").text($matches.length + " of " + games.length + " games found");
            $("#no-results").prop("hidden", $matches.length !== 0);
            updateViewport();
        }

        function selectSuggestion($option) {
            $search.val($option.text());
            filterGames();
            $search.trigger("focus");
            closeSuggestions();
        }

        $search.on("input", function () { filterGames(); showSuggestions(); });
        $search.on("focus", showSuggestions);
        $search.on("keydown", function (event) {
            if (event.key === "Escape") { closeSuggestions(); return; }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if ($suggestions.prop("hidden")) showSuggestions();
                const $options = $suggestions.children();
                if (!$options.length) return;
                if (activeSuggestion === -1 && event.key === "ArrowUp") activeSuggestion = 0;
                activeSuggestion += event.key === "ArrowDown" ? 1 : -1;
                activeSuggestion = (activeSuggestion + $options.length) % $options.length;
                $options.attr("aria-selected", "false");
                const $active = $options.eq(activeSuggestion).attr("aria-selected", "true");
                $search.attr("aria-activedescendant", $active.attr("id"));
            } else if (event.key === "Enter" && activeSuggestion >= 0) {
                event.preventDefault();
                selectSuggestion($suggestions.children().eq(activeSuggestion));
            }
        });
        $suggestions.on("mousedown", function (event) { event.preventDefault(); });
        $suggestions.on("click", "li", function () { selectSuggestion($(this)); });
        $search.on("blur", closeSuggestions);
        $("#search-form").on("submit", function (event) {
            event.preventDefault(); filterGames(); closeSuggestions();
        });
        $category.add($price).on("change", function () { filterGames(); closeSuggestions(); });
        $("#reset-filters").on("click", function () {
            $search.val("");
            $category.add($price).val("all");
            filterGames();
            $search.trigger("focus");
            closeSuggestions();
        });
        const requestedCategory = new URLSearchParams(location.search).get("category");
        if ($category.find("option").toArray().some(option => option.value === requestedCategory)) {
            $category.val(requestedCategory);
        }
        filterGames();
    }

    // Task 4: scroll distance divided by the total scrollable height.
    function updateProgress() {
        const distance = $(document).height() - $(window).height();
        const percent = distance > 0 ? Math.min(100, Math.max(0, $(window).scrollTop() / distance * 100)) : 100;
        $("#scroll-progress").attr("aria-valuenow", Math.round(percent))
            .children().css("width", percent + "%");
    }

    function isInView($element) {
        if (!$element.is(":visible")) return false;
        const top = $element.offset().top;
        const scrollTop = $(window).scrollTop();
        return top < scrollTop + $(window).height() && top + $element.outerHeight() > scrollTop;
    }

    // Task 5: animate each real store statistic once when it becomes visible.
    function animateCounters() {
        $(".stat-number").each(function () {
            const $counter = $(this);
            if ($counter.data("counted") || !isInView($counter)) return;
            $counter.data("counted", true);
            const target = Number($counter.attr("data-count"));
            $({ value: 0 }).animate({ value: target }, {
                duration: reduceMotion ? 0 : 1200,
                step: function (value) { $counter.text(Math.floor(value)); },
                complete: function () { $counter.text(target); }
            });
        });
    }

    // Task 6: the existing subscription validator calls this after valid input.
    window.submitWithSpinner = function (form, onComplete) {
        const $form = $(form);
        if ($form.data("submitting")) return;
        const $button = $form.find('[type="submit"]');
        const label = $button.html();
        $form.data("submitting", true).attr("aria-busy", "true");
        $button.prop("disabled", true).html('<span class="submit-spinner" aria-hidden="true"></span> Please wait...');
        setTimeout(function () {
            $button.prop("disabled", false).html(label);
            $form.data("submitting", false).removeAttr("aria-busy");
            onComplete();
        }, 1500);
    };

    // Task 7: reuse the status element for cart, subscription, and copy messages.
    const $toast = $("#status-message").addClass("jquery-toast").hide();
    let toastTimer;
    window.showToast = function (message) {
        clearTimeout(toastTimer);
        $toast.stop(true, true).text(message).fadeIn(reduceMotion ? 0 : 200);
        toastTimer = setTimeout(function () { $toast.fadeOut(reduceMotion ? 0 : 300); }, 3000);
    };

    // Task 8: show a checkmark and tooltip only after copying succeeds.
    $("#store-link").val(new URL("index.html", location.href).href);
    $(".copy-button").on("click", async function () {
        const $button = $(this);
        const $target = $($button.attr("data-copy-target"));
        const text = $target.is("input, textarea") ? $target.val() : $target.text();
        const $tooltip = $button.siblings(".copy-tooltip");
        $button.prop("disabled", true);
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for opening the project directly as local files.
                const $temporary = $("<textarea>").val(text).addClass("clipboard-helper").appendTo("body");
                $temporary[0].select();
                const copied = document.execCommand("copy");
                $temporary.remove();
                if (!copied) throw new Error("Copy unavailable");
            }
            $button.text("\u2713 Copied");
            $tooltip.prop("hidden", false);
            window.showToast("Copied to clipboard!");
            setTimeout(function () {
                $button.text("Copy").prop("disabled", false);
                $tooltip.prop("hidden", true);
            }, 2000);
        } catch (error) {
            $button.prop("disabled", false);
            window.showToast("Copy was blocked. Select the link and copy it manually.");
        }
    });

    // Task 9: HTML starts with a placeholder; real files load only in the viewport.
    function loadImage($image) {
        const source = $image.attr("data-src");
        if (!source) return;
        $image.one("load", function () { $(this).addClass("image-loaded"); });
        $image.attr("src", source).removeAttr("data-src");
    }

    function loadVisibleImages() {
        $("img[data-src]").each(function () {
            if (isInView($(this))) loadImage($(this));
        });
    }

    function updateViewport() {
        updateProgress();
        animateCounters();
        loadVisibleImages();
    }

    $("#game-carousel").on("slide.bs.carousel", function (event) {
        if (isInView($(this))) $(event.relatedTarget).find("img").each(function () { loadImage($(this)); });
    }).on("slid.bs.carousel", loadVisibleImages);
    $(window).on("scroll resize load", updateViewport);
    updateViewport();
});
