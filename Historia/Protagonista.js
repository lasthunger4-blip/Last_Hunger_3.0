(function () {
  var card = document.getElementById('protagonista-flip');
  var stage = document.getElementById('walk-stage');
  var walker = document.getElementById('walker');
  if (!card || !stage || !walker) return;

  var BASE = '../Imagenes/Protagonista/';
  var walkFrames = ['caminar-1.png', 'caminar-2.png', 'caminar-3.png', 'caminar-2.png'];
  var idleFrames = ['frente-1.png', 'frente-2.png'];
  var WALK_MS = 2600;   // duración del recorrido
  var STEP_MS = 160;    // velocidad de cada paso

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stepTimer = null, idleTimer = null, raf = null;

  // precarga
  walkFrames.concat(idleFrames).forEach(function (f) { new Image().src = BASE + f; });

  function stopAll() {
    clearInterval(stepTimer); clearInterval(idleTimer);
    if (raf) cancelAnimationFrame(raf);
  }

  function setFrame(f) { walker.src = BASE + f; }

  function place(progress) {
    // progress 0 = fuera por la derecha, 1 = centro del escenario
    var w = stage.clientWidth, sw = walker.offsetWidth;
    var start = w;                     // borde derecho
    var end = (w - sw) / 2;            // centro
    walker.style.left = (start + (end - start) * progress) + 'px';
  }

  function arrive() {
    stopAll();
    place(1);
    setFrame(idleFrames[0]);
    stage.classList.add('arrived');
    var i = 0;
    idleTimer = setInterval(function () {
      i = (i + 1) % idleFrames.length;
      setFrame(idleFrames[i]);
    }, 700);
  }

  function walkIn() {
    stopAll();
    stage.classList.remove('arrived');
    if (reduce) { arrive(); return; }

    place(0);
    var i = 0, t0 = null;
    setFrame(walkFrames[0]);
    stepTimer = setInterval(function () {
      i = (i + 1) % walkFrames.length;
      setFrame(walkFrames[i]);
    }, STEP_MS);

    function tick(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / WALK_MS, 1);
      var eased = 1 - Math.pow(1 - p, 2);   // frena suave al llegar
      place(eased);
      if (p < 1) raf = requestAnimationFrame(tick); else arrive();
    }
    raf = requestAnimationFrame(tick);
  }

  function toggle() {
    var flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    if (flipped) {
      // al ver el reverso se detiene la animación del frente
      setTimeout(function () { if (card.classList.contains('is-flipped')) stopAll(); }, 800);
    } else {
      setTimeout(walkIn, 450); // al volver al frente, repite la entrada
    }
  }

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
  window.addEventListener('resize', function () {
    if (stage.classList.contains('arrived')) place(1);
  });

  // arranca la caminata cuando la carta entra en pantalla
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); walkIn(); }
    }, { threshold: 0.5 });
    io.observe(card);
  } else {
    walkIn();
  }
})();
