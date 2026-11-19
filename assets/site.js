/* Theme toggle + cursor-reactive background. No dependencies. */
(function () {
  var root = document.documentElement;
  var KEY = "theme";

  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  /* ---------- Theme toggle ---------- */
  var btn = document.querySelector(".theme-toggle");
  function syncButton() {
    if (!btn) return;
    var dark = root.getAttribute("data-theme") === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = dark ? "Light mode" : "Dark mode";
  }
  if (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store(next);
      syncButton();
      readColors();
    });
  }
  syncButton();

  /* ---------- Background ---------- */
  var canvas = document.getElementById("bg-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1;
  var nodes = [];
  var colA = "33,72,192", colB = "137,196,244", glow = "rgba(137,196,244,.35)";
  // Pointer position (target) and an eased copy used for drawing.
  var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
  // Parallax: the whole field drifts gently opposite to the cursor.
  var par = { x: 0, y: 0, tx: 0, ty: 0 };
  var LINK = 140, REACH = 180;

  function readColors() {
    var cs = getComputedStyle(root);
    colA = (cs.getPropertyValue("--particle") || colA).trim();
    colB = (cs.getPropertyValue("--particle-alt") || colB).trim();
    glow = (cs.getPropertyValue("--glow") || glow).trim();
    if (reduce) draw();
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var target = Math.round(Math.min(110, Math.max(35, (W * H) / 14000)));
    while (nodes.length < target) nodes.push(makeNode());
    nodes.length = target;
    LINK = W < 640 ? 105 : 140;
    if (reduce) draw();
  }

  function makeNode() {
    var depth = 0.35 + Math.random() * 0.65; // nearer nodes are larger, faster, move more with parallax
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25 * depth, vy: (Math.random() - 0.5) * 0.25 * depth,
      ox: 0, oy: 0, // push offset from the cursor, eased back to zero
      d: depth, r: 0.8 + depth * 1.6, alt: Math.random() < 0.25
    };
  }

  function step() {
    mouse.x += (mouse.tx - mouse.x) * 0.18;
    mouse.y += (mouse.ty - mouse.y) * 0.18;
    par.x += (par.tx - par.x) * 0.05;
    par.y += (par.ty - par.y) * 0.05;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;

      if (mouse.active) {
        var px = n.x + par.x * n.d, py = n.y + par.y * n.d;
        var dx = px - mouse.x, dy = py - mouse.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REACH && dist > 0.1) {
          var f = (1 - dist / REACH); f *= f * 28 * n.d;
          n.ox += ((dx / dist) * f - n.ox) * 0.12;
          n.oy += ((dy / dist) * f - n.oy) * 0.12;
          continue;
        }
      }
      n.ox *= 0.94; n.oy *= 0.94;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (mouse.active) {
      var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 260);
      g.addColorStop(0, glow);
      g.addColorStop(1, glow.replace(/,\s*[\d.]+\s*\)$/, ",0)"));
      ctx.fillStyle = g;
      ctx.fillRect(mouse.x - 260, mouse.y - 260, 520, 520);
    }

    var pts = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      pts.push({ x: n.x + par.x * n.d + n.ox, y: n.y + par.y * n.d + n.oy, n: n });
    }

    ctx.lineWidth = 1;
    for (var a = 0; a < pts.length; a++) {
      for (var b = a + 1; b < pts.length; b++) {
        var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          var o = (1 - Math.sqrt(d2) / LINK) * 0.28;
          ctx.strokeStyle = "rgba(" + colA + "," + o.toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
        }
      }
      if (mouse.active) {
        var mx = pts[a].x - mouse.x, my = pts[a].y - mouse.y, md = Math.sqrt(mx * mx + my * my);
        if (md < REACH * 1.1) {
          var mo = (1 - md / (REACH * 1.1)) * 0.5;
          ctx.strokeStyle = "rgba(" + colB + "," + mo.toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      ctx.fillStyle = "rgba(" + (p.n.alt ? colB : colA) + "," + (0.35 + p.n.d * 0.45).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.n.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  var running = false;
  function loop() {
    if (!running) return;
    step(); draw();
    requestAnimationFrame(loop);
  }
  function start() { if (!running && !reduce) { running = true; requestAnimationFrame(loop); } }
  function stop() { running = false; }

  function point(x, y) {
    mouse.tx = x; mouse.ty = y;
    if (!mouse.active) { mouse.x = x; mouse.y = y; mouse.active = true; }
    par.tx = -(x / W - 0.5) * 40;
    par.ty = -(y / H - 0.5) * 40;
  }
  window.addEventListener("pointermove", function (e) { point(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener("pointerdown", function (e) { point(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener("pointerleave", function () { mouse.active = false; par.tx = 0; par.ty = 0; });
  window.addEventListener("blur", function () { mouse.active = false; });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

  // Follow the system setting when the visitor has not picked a theme.
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function (e) {
      var saved = null; try { saved = localStorage.getItem(KEY); } catch (err) {}
      if (saved) return;
      root.setAttribute("data-theme", e.matches ? "dark" : "light");
      syncButton(); readColors();
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
  }

  resize();
  readColors();
  if (reduce) draw(); else start();
})();
