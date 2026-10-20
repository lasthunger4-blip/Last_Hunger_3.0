(function () {
  var card = document.getElementById('comunidad-flip');
  var stage = document.getElementById('com-stage');
  var building = document.getElementById('com-building');
  if (!card || !stage || !building) return;

  var BASE = '../Imagenes/Npcs/';

  // Cada NPC: frames de carrera (de perfil), quieto (mirando a la puerta) y de espalda (entrando)
  var CHARS = {
    a: { run: ['a-corre-1.png', 'a-corre-2.png'], idle: 'a-quieto.png', back: ['a-espalda-1.png', 'a-espalda-2.png'] },
    b: { run: ['b-corre-1.png', 'b-corre-2.png'], idle: 'b-quieto.png', back: ['b-espalda-1.png', 'b-espalda-2.png'] },
    c: { run: ['c-corre-1.png', 'c-corre-2.png'], idle: 'c-quieto.png', back: ['c-espalda-1.png', 'c-espalda-2.png'] },
    d: { run: ['d-corre-1.png', 'd-corre-2.png'], idle: 'd-quieto.png', back: ['d-espalda-1.png', 'd-espalda-2.png'] }
  };

  var QUEUE = ['c', 'a', 'b'];   // de la puerta hacia atrás
  var RUNNER = 'd';              // el que llega corriendo desde la derecha

  var RUN_SPEED = 300;    // px/s al correr
  var WALK_SPEED = 110;   // px/s al avanzar en la fila
  var RUN_FRAME_MS = 100;
  var WALK_FRAME_MS = 200;
  var WAIT_BETWEEN = 1000; // espera entre uno y otro

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CANCEL = {};
  var runId = 0;
  var npcs = [];
  var G = {};
  var lastWidth = 0;

  Object.keys(CHARS).forEach(function (k) {
    var c = CHARS[k];
    c.run.concat(c.idle, c.back).forEach(function (f) { new Image().src = BASE + f; });
  });

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function guard(id) { if (id !== runId) throw CANCEL; }

  function geometry() {
    var S = parseFloat(getComputedStyle(stage).getPropertyValue('--npc')) || 72;
    var bw = building.offsetWidth, bh = building.offsetHeight;
    G.S = S;
    G.stageW = stage.clientWidth;
    G.doorX = building.offsetLeft + bw * 0.744;   // centro de la puerta
    G.doorH = bh * 0.2;                           // alto aproximado de la puerta
    G.gap = S * 0.62;                             // separación entre NPCs de la fila
    lastWidth = G.stageW;
  }

  function slotX(i) { return G.doorX + i * G.gap; }

  function setSrc(n, f) { n.el.src = BASE + f; }
  function stopFrames(n) { clearInterval(n.timer); n.timer = null; }
  function startFrames(n, list, ms) {
    stopFrames(n);
    var i = 0;
    setSrc(n, list[0]);
    n.timer = setInterval(function () {
      i = (i + 1) % list.length;
      setSrc(n, list[i]);
    }, ms);
  }

  function makeNpc(key, x) {
    var el = document.createElement('img');
    el.className = 'npc';
    el.alt = '';
    el.setAttribute('aria-hidden', 'true');
    el.src = BASE + CHARS[key].idle;
    el.style.left = (x - G.S / 2) + 'px';
    stage.appendChild(el);
    var n = { key: key, def: CHARS[key], el: el, x: x, timer: null };
    npcs.push(n);
    return n;
  }

  function clearScene() {
    npcs.forEach(function (n) { stopFrames(n); if (n.el.parentNode) n.el.parentNode.removeChild(n.el); });
    npcs = [];
  }

  // Deja la fila de 3 NPCs quietos frente a la puerta
  function setupQueue() {
    clearScene();
    geometry();
    return QUEUE.map(function (k, i) { return makeNpc(k, slotX(i)); });
  }

  function walkTo(n, x, speed, frames, ms, id) {
    var dur = Math.abs(n.x - x) / speed * 1000;
    startFrames(n, frames, ms);
    n.el.style.transition = 'left ' + dur + 'ms linear';
    void n.el.offsetWidth; // fuerza el reflow para que la transición arranque
    n.el.style.left = (x - G.S / 2) + 'px';
    n.x = x;
    return sleep(dur).then(function () {
      guard(id);
      stopFrames(n);
      setSrc(n, n.def.idle);
    });
  }

  // El NPC se voltea hacia la puerta, entra y desaparece
  async function enter(n, id) {
    stopFrames(n);
    setSrc(n, n.def.back[0]);                 // se voltea
    await sleep(450); guard(id);
    startFrames(n, n.def.back, 170);          // camina hacia la puerta
    n.el.style.transition = 'transform 1000ms linear, opacity 450ms ease-in 550ms';
    n.el.style.transform = 'translateY(' + (-G.doorH * 0.5) + 'px) scale(0.82)';
    n.el.style.opacity = '0';
    await sleep(1000); guard(id);
    stopFrames(n);
    n.el.style.display = 'none';
  }

  async function play() {
    var id = ++runId;
    try {
      var line = setupQueue();
      if (reduce) { line.push(makeNpc(RUNNER, slotX(3))); return; }

      // llega corriendo el último desde la derecha
      var runner = makeNpc(RUNNER, G.stageW + G.S);
      line.push(runner);
      await sleep(400); guard(id);
      await walkTo(runner, slotX(3), RUN_SPEED, runner.def.run, RUN_FRAME_MS, id);
      await sleep(700); guard(id);

      // entran uno por uno, con 1 segundo entre cada uno
      while (line.length) {
        var first = line.shift();
        await enter(first, id);
        if (!line.length) break;
        await sleep(WAIT_BETWEEN); guard(id);
        await Promise.all(line.map(function (n, k) {
          return walkTo(n, slotX(k), WALK_SPEED, n.def.run, WALK_FRAME_MS, id);
        }));
      }
    } catch (e) {
      if (e !== CANCEL) throw e;
    }
  }

  function toggle() {
    var flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    if (flipped) { runId++; }                    // pausa la escena mientras se ve el reverso
    else { setTimeout(play, 450); }              // al volver al frente se repite
  }

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (stage.clientWidth !== lastWidth && !card.classList.contains('is-flipped')) play();
    }, 250);
  });

  // fila visible desde el inicio; la animación arranca cuando la carta entra en pantalla
  setupQueue();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); play(); }
    }, { threshold: 0.5 });
    io.observe(card);
  } else {
    play();
  }
})();
