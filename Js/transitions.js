/* ==========================================================
   LAST HUNGER — Transiciones y animaciones compartidas
   Este archivo se enlaza desde todas las páginas del sitio.
   ========================================================== */

(function () {

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- 0. Fondo animado: ascuas flotando ---------- */

    function initEmbers() {

        var canvas = document.createElement("canvas");
        canvas.id = "lh-bg-canvas";
        canvas.setAttribute("aria-hidden", "true");
        document.body.insertBefore(canvas, document.body.firstChild);

        if (reduceMotion) return;

        var ctx = canvas.getContext("2d");
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var palette = ["#eab308", "#f59e0b", "#fbbf24", "#f97316"];
        var particles = [];
        var w, h, raf;

        function makeParticle(spawnAnywhere) {
            return {
                x: Math.random() * w,
                y: spawnAnywhere ? Math.random() * h : h + 20,
                r: Math.random() * 1.8 + 0.6,
                speed: Math.random() * 0.45 + 0.15,
                drift: Math.random() * 0.6 - 0.3,
                sway: Math.random() * Math.PI * 2,
                swaySpeed: Math.random() * 0.02 + 0.006,
                color: palette[Math.floor(Math.random() * palette.length)],
                alpha: Math.random() * 0.5 + 0.25,
                twinkle: Math.random() * 0.02 + 0.006
            };
        }

        function resize() {
            /* En móviles la barra de direcciones aparece y desaparece al hacer
               scroll y dispara "resize": solo se reinicia si cambia el ancho
               o el alto varía de forma notable. */
            if (w && Math.abs(window.innerWidth - w) < 1 &&
                Math.abs(window.innerHeight - h) < 160) return;

            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            var count = Math.max(26, Math.min(65, Math.floor((w * h) / 24000)));
            particles = [];
            for (var i = 0; i < count; i++) {
                particles.push(makeParticle(true));
            }
        }

        function step() {
            ctx.clearRect(0, 0, w, h);

            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];

                p.y -= p.speed;
                p.sway += p.swaySpeed;
                p.x += Math.sin(p.sway) * p.drift;
                p.alpha += (Math.random() - 0.5) * p.twinkle;

                if (p.alpha < 0.15) p.alpha = 0.15;
                if (p.alpha > 0.85) p.alpha = 0.85;

                if (p.y < -20) {
                    particles[i] = makeParticle(false);
                    continue;
                }

                ctx.beginPath();
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.r * 4;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(step);
        }

        window.addEventListener("resize", resize);
        resize();
        raf = requestAnimationFrame(step);

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                cancelAnimationFrame(raf);
            } else {
                raf = requestAnimationFrame(step);
            }
        });
    }

    /* ---------- Cortina de transición estilo "wipe" ---------- */

    function createWipe() {
        var wipe = document.createElement("div");
        wipe.className = "lh-wipe";
        wipe.setAttribute("aria-hidden", "true");

        var a = document.createElement("span");
        a.className = "lh-wipe-panel lh-wipe-a";

        var b = document.createElement("span");
        b.className = "lh-wipe-panel lh-wipe-b";

        wipe.appendChild(a);
        wipe.appendChild(b);
        document.body.appendChild(wipe);

        return wipe;
    }

    document.addEventListener("DOMContentLoaded", function () {

        var body = document.body;

        /* ---------- 1. Fondo animado ---------- */
        initEmbers();

        /* ---------- 2. Cortina + fundido de entrada al cargar la página ---------- */
        body.classList.add("lh-page");
        var wipe = createWipe();

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                body.classList.add("lh-loaded");
                wipe.classList.add("lh-wipe-open");
            });
        });

        /* ---------- 3. Animación al hacer scroll (revelar elementos) ---------- */
        var revealSelectors = [
            ".card", ".char-card", ".content-card", ".ods-card",
            ".trailer-frame", ".map-frame", ".map-row"
        ];

        var revealEls = document.querySelectorAll(revealSelectors.join(","));

        revealEls.forEach(function (el, i) {
            el.classList.add("lh-reveal");

            if (el.classList.contains("char-card") || el.classList.contains("map-row")) {
                el.classList.add(i % 2 === 0 ? "lh-reveal-left" : "lh-reveal-right");
            } else {
                el.classList.add("lh-reveal-scale");
            }
        });

        if ("IntersectionObserver" in window) {

            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("lh-in-view");
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

            revealEls.forEach(function (el) {
                observer.observe(el);
            });

        } else {
            /* Sin soporte: mostrar todo directamente */
            revealEls.forEach(function (el) {
                el.classList.add("lh-in-view");
            });
        }

        /* Restaura la página tras una transición de salida (por ejemplo al
           volver con el botón "atrás": Safari y Chrome móvil la recuperan
           desde memoria con la cortina todavía cerrada). */
        function restorePage() {
            body.classList.remove("lh-leaving");
            body.classList.add("lh-loaded");
            wipe.classList.remove("lh-wipe-shut");
            wipe.classList.add("lh-wipe-open");
        }

        window.addEventListener("pageshow", function (e) {
            if (e.persisted) restorePage();
        });

        /* ---------- 4. Transición llamativa entre páginas al hacer clic ---------- */
        var links = document.querySelectorAll("a[href]");

        links.forEach(function (link) {

            var href = link.getAttribute("href");

            if (!href) return;
            if (href.charAt(0) === "#") return;
            if (href.indexOf("http") === 0) return;
            if (href.indexOf("mailto:") === 0) return;
            if (href.indexOf("tel:") === 0) return;
            if (link.target === "_blank") return;
            if (link.hasAttribute("download")) return;
            if (/\.(docx?|xlsx?|pptx?|pdf|zip|rar|7z|apk|exe|mp4|mp3)([?#].*)?$/i.test(href)) return;

            link.addEventListener("click", function (e) {

                if (e.defaultPrevented || e.button !== 0 ||
                    e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

                e.preventDefault();

                if (body.classList.contains("lh-leaving")) return;

                body.classList.remove("lh-loaded");
                body.classList.add("lh-leaving");

                wipe.classList.remove("lh-wipe-open");
                wipe.classList.add("lh-wipe-shut");

                window.setTimeout(function () {
                    window.location.href = href;
                }, 450);

                /* Seguro: si la navegación no ocurre, se restaura la página */
                window.setTimeout(restorePage, 3500);

            });

        });

    });

})();
