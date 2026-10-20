/* ==========================================================
   LAST HUNGER — Comportamiento adaptable (menú y video)
   Se enlaza desde todas las páginas, antes de transitions.js.
   Si JavaScript no está disponible, el menú sigue visible y
   se acomoda en varias filas (ver Css/responsive.css).
   ========================================================== */

(function () {

    var BREAKPOINT = 980;

    /* ---------- Menú de hamburguesa ---------- */

    function initMenu() {

        var header = document.querySelector("header");
        var nav = header && header.querySelector("nav");

        if (!header || !nav) return;

        if (!nav.id) nav.id = "lh-nav";

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nav-toggle";
        btn.setAttribute("aria-label", "Abrir menú");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", nav.id);
        btn.innerHTML =
            '<span class="nav-toggle-bar"></span>' +
            '<span class="nav-toggle-bar"></span>' +
            '<span class="nav-toggle-bar"></span>';

        header.insertBefore(btn, nav);
        header.classList.add("has-menu");

        /* El enlace de comentarios solo tiene un icono: en el menú
           móvil se le añade el texto para que se entienda. */
        var icon = nav.querySelector("a img");
        if (icon && icon.getAttribute("alt") === "comentarios") {
            var label = document.createElement("span");
            label.className = "nav-label";
            label.textContent = "Comentarios";
            icon.parentNode.appendChild(label);
        }

        function setOpen(open) {
            header.classList.toggle("nav-open", open);
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
        }

        btn.addEventListener("click", function () {
            setOpen(!header.classList.contains("nav-open"));
        });

        nav.addEventListener("click", function (e) {
            var t = e.target;
            while (t && t !== nav) {
                if (t.tagName === "A") { setOpen(false); return; }
                t = t.parentNode;
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && header.classList.contains("nav-open")) {
                setOpen(false);
                btn.focus();
            }
        });

        document.addEventListener("click", function (e) {
            if (!header.contains(e.target)) setOpen(false);
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > BREAKPOINT) setOpen(false);
        });
    }

    /* ---------- Video: versión ligera en pantallas pequeñas ---------- */

    function initVideo() {

        var video = document.querySelector("video[data-small]");
        if (!video) return;

        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        var smallScreen = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

        if (!smallScreen && !conn.saveData) return;

        var source = video.querySelector("source");
        if (!source) return;

        source.setAttribute("src", video.getAttribute("data-small"));
        video.load();
    }

    function init() {
        initMenu();
        initVideo();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
