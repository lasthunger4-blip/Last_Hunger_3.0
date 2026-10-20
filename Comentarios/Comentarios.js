/* ==========================================================
   LAST HUNGER — Caja de comentarios
   Guarda los comentarios en el navegador (localStorage) para
   que queden visibles cada vez que se entra a esta página.
   ========================================================== */

(function () {

    var STORAGE_KEY = "lh-comentarios";

    var form = document.getElementById("comment-form");
    var nameInput = document.getElementById("comment-name");
    var ratingInput = document.getElementById("comment-rating");
    var textInput = document.getElementById("comment-text");
    var starsWrap = document.getElementById("star-rating");
    var stars = starsWrap ? Array.prototype.slice.call(starsWrap.querySelectorAll(".star")) : [];
    var errorEl = document.getElementById("form-error");
    var listEl = document.getElementById("comments-list");
    var noCommentsEl = document.getElementById("no-comments");

    if (!form) return;

    /* ---------- Utilidades de almacenamiento ---------- */

    function loadComments() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveComments(comments) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
        } catch (e) {
            /* almacenamiento no disponible: se ignora */
        }
    }

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
    }

    /* ---------- Estrellas del formulario ---------- */

    var currentRating = 0;

    function paintStars(value) {
        stars.forEach(function (star) {
            var v = parseInt(star.getAttribute("data-value"), 10);
            star.classList.toggle("hovered", v <= value);
        });
    }

    function selectRating(value) {
        currentRating = value;
        ratingInput.value = value;
        stars.forEach(function (star) {
            var v = parseInt(star.getAttribute("data-value"), 10);
            star.classList.toggle("selected", v <= value);
            star.setAttribute("aria-checked", v === value ? "true" : "false");
        });
    }

    stars.forEach(function (star) {
        star.addEventListener("mouseenter", function () {
            paintStars(parseInt(star.getAttribute("data-value"), 10));
        });
        star.addEventListener("click", function () {
            selectRating(parseInt(star.getAttribute("data-value"), 10));
        });
    });

    if (starsWrap) {
        starsWrap.addEventListener("mouseleave", function () {
            paintStars(currentRating);
        });
    }

    /* ---------- Render de comentarios ---------- */

    function starGlyphs(rating) {
        var full = "★".repeat(rating);
        var empty = "☆".repeat(5 - rating);
        return full + empty;
    }

    function renderComments() {
        var comments = loadComments();

        listEl.innerHTML = "";

        if (comments.length === 0) {
            noCommentsEl.classList.remove("hidden");
            return;
        }

        noCommentsEl.classList.add("hidden");

        comments
            .slice()
            .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
            .forEach(function (comment) {

                var card = document.createElement("div");
                card.className = "comment-card";
                card.setAttribute("data-id", comment.id);

                card.innerHTML =
                    '<div class="comment-head">' +
                        '<span class="comment-name">' + escapeHtml(comment.name) + '</span>' +
                        '<span class="comment-date">' + formatDate(comment.date) + '</span>' +
                    '</div>' +
                    '<div class="comment-stars" aria-label="' + comment.rating + ' de 5 estrellas">' + starGlyphs(comment.rating) + '</div>' +
                    '<p class="comment-text"></p>' +
                    '<div class="comment-footer">' +
                        '<button type="button" class="like-btn' + (comment.likedByMe ? ' liked' : '') + '" data-id="' + comment.id + '">' +
                            '<svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>' +
                            '<span class="like-count">' + comment.likes + '</span>' +
                        '</button>' +
                    '</div>';

                /* El texto se inserta como texto plano (no HTML) por seguridad */
                card.querySelector(".comment-text").textContent = comment.text;

                listEl.appendChild(card);
            });
    }

    /* ---------- Likes ---------- */

    listEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".like-btn");
        if (!btn) return;

        var id = btn.getAttribute("data-id");
        var comments = loadComments();
        var comment = comments.find(function (c) { return String(c.id) === String(id); });
        if (!comment) return;

        if (comment.likedByMe) {
            comment.likes = Math.max(0, comment.likes - 1);
            comment.likedByMe = false;
        } else {
            comment.likes += 1;
            comment.likedByMe = true;
        }

        saveComments(comments);
        renderComments();
    });

    /* ---------- Envío del formulario ---------- */

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        var name = nameInput.value.trim();
        var text = textInput.value.trim();
        var rating = currentRating;

        if (!name || !text || !rating) {
            errorEl.textContent = "Completa tu nombre, el puntaje en estrellas y el comentario antes de publicar.";
            return;
        }

        errorEl.textContent = "";

        var comments = loadComments();

        comments.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            name: name,
            rating: rating,
            text: text,
            date: new Date().toISOString(),
            likes: 0,
            likedByMe: false
        });

        saveComments(comments);

        form.reset();
        selectRating(0);
        paintStars(0);
        stars.forEach(function (star) { star.setAttribute("aria-checked", "false"); });

        renderComments();
    });

    /* ---------- Inicio ---------- */

    renderComments();

})();
