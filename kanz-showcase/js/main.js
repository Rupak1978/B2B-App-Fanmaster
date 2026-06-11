/* ============================================================
   KANZ ENTERPRISES — Sphere Showcase
   Interaction engine: sphere physics, detail stage, zoom, dust
   ============================================================ */

(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- contact links ---------------- */
  const waLink = (text) =>
    `https://wa.me/${KANZ_CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  $("#hdr-enquire").href = waLink("Hello Kanz Enterprises! I'd love to know more about your designer fans.");
  $("#foot-mail").href = `mailto:${KANZ_CONTACT.email}`;

  /* ---------------- intro ---------------- */
  addEventListener("load", () => {
    setTimeout(() => $("#intro").classList.add("gone"), reduceMotion ? 300 : 1900);
  });

  /* ---------------- ambient dust ---------------- */
  (() => {
    const cv = $("#dust"), ctx = cv.getContext("2d");
    let w, h, parts = [];
    const resize = () => {
      w = cv.width = innerWidth; h = cv.height = innerHeight;
      parts = Array.from({ length: Math.min(90, (w * h) / 18000) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.4 + Math.random() * 1.6,
        vx: -0.08 + Math.random() * 0.16, vy: -0.14 - Math.random() * 0.1,
        a: 0.05 + Math.random() * 0.3, tw: Math.random() * Math.PI * 2,
      }));
    };
    resize(); addEventListener("resize", resize);
    if (reduceMotion) return;
    (function tick(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
        const a = p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(222,189,107,${a})`;
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    })(0);
  })();

  /* ---------------- build the sphere ---------------- */
  const sphereEl = $("#sphere");
  const viewport = $("#sphere-viewport");
  const N = CATALOG.length;
  const RADIUS = 430;
  const PHI = [-16, 0, 16]; // latitude scatter pattern
  const cardAngle = (i) => (360 / N) * i;

  CATALOG.forEach((m, i) => {
    const card = document.createElement("article");
    card.className = "orb-card";
    card.dataset.index = i;
    card.style.transform =
      `rotateY(${cardAngle(i)}deg) rotateX(${PHI[i % PHI.length]}deg) translateZ(${RADIUS}px)`;
    card.innerHTML = `
      <span class="oc-tag">${m.line}</span>
      ${FanArt.render(m)}
      <div class="oc-name">${m.alias}</div>
      <div class="oc-price">${inr(m.price)}</div>`;
    sphereEl.appendChild(card);
  });
  const cards = [...sphereEl.children];

  /* ---------------- dock ---------------- */
  const dockItems = $("#dock-items");
  CATALOG.forEach((m, i) => {
    const b = document.createElement("button");
    b.className = "dock-item";
    b.title = `${m.alias} — ${inr(m.price)}`;
    b.setAttribute("aria-label", b.title);
    b.innerHTML = FanArt.render(m);
    b.addEventListener("click", () => goTo(i, true));
    dockItems.appendChild(b);
  });
  const dockBtns = [...dockItems.children];

  /* ---------------- sphere physics ---------------- */
  let rotY = 0, rotX = -6, velY = 0;
  let snapTarget = null, snapThen = null;
  let dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0, moved = 0;
  let lastInteract = 0;
  let frontIdx = -1;

  const norm180 = (a) => ((a % 360) + 540) % 360 - 180;

  function nearestFront() {
    let best = 0, bestD = 1e9;
    for (let i = 0; i < N; i++) {
      const d = Math.abs(norm180(cardAngle(i) + rotY));
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  const hud = $("#hud"), hudName = $("#hud-name"), hudPrice = $("#hud-price");
  function setFront(i) {
    if (i === frontIdx) return;
    frontIdx = i;
    cards.forEach((c, k) => c.classList.toggle("is-front", k === i));
    dockBtns.forEach((b, k) => b.classList.toggle("active", k === i));
    hud.classList.add("swap");
    setTimeout(() => {
      const m = CATALOG[i];
      hudName.textContent = m.alias;
      hudPrice.textContent = `${inr(m.price)} · ${m.tag}`;
      hud.classList.remove("swap");
    }, 160);
  }

  function goTo(i, open = false) {
    const diff = norm180(-(cardAngle(i)) - rotY);
    snapTarget = rotY + diff;
    snapThen = open ? i : null;
    lastInteract = performance.now();
  }

  viewport.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0;
    lastX = downX = e.clientX; lastY = downY = e.clientY;
    snapTarget = null; snapThen = null;
    viewport.classList.add("grabbing");
    viewport.setPointerCapture(e.pointerId);
    $("#drag-coach").classList.add("gone");
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    rotY += dx * 0.28;
    rotX = clamp(rotX - dy * 0.12, -28, 16);
    velY = dx * 0.28;
    lastX = e.clientX; lastY = e.clientY;
    lastInteract = performance.now();
  });
  viewport.addEventListener("pointerup", (e) => {
    dragging = false;
    viewport.classList.remove("grabbing");
    lastInteract = performance.now();
    if (moved < 8) {
      const card = e.target.closest(".orb-card");
      if (card) {
        const i = +card.dataset.index;
        const d = Math.abs(norm180(cardAngle(i) + rotY));
        if (d < 24) openDetail(i);
        else goTo(i, true);
      }
    }
  });
  viewport.addEventListener("pointercancel", () => {
    dragging = false; viewport.classList.remove("grabbing");
  });

  /* main loop */
  let prevT = performance.now();
  (function loop(t) {
    const dt = Math.min(50, t - prevT) / 16.6; prevT = t;

    if (!dragging) {
      if (snapTarget !== null) {
        const d = snapTarget - rotY;
        rotY += d * Math.min(1, 0.085 * dt);
        rotX += (-6 - rotX) * 0.05 * dt;
        if (Math.abs(d) < 0.2) {
          rotY = snapTarget; snapTarget = null;
          if (snapThen !== null) { openDetail(snapThen); snapThen = null; }
        }
      } else {
        rotY += velY * dt;
        velY *= Math.pow(0.94, dt);
        if (Math.abs(velY) < 0.02) velY = 0;
        // gentle auto-orbit after 3.5s idle
        if (!reduceMotion && !detailOpen && t - lastInteract > 3500) rotY += 0.045 * dt;
      }
    }

    sphereEl.style.transform = `translateZ(-60px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    setFront(nearestFront());

    spinBigFan(dt);
    requestAnimationFrame(loop);
  })(prevT);

  /* arrows + keyboard */
  $("#dock-prev").addEventListener("click", () => goTo((frontIdx + N - 1) % N));
  $("#dock-next").addEventListener("click", () => goTo((frontIdx + 1) % N));
  addEventListener("keydown", (e) => {
    if (zoomOpen) { if (e.key === "Escape") closeZoom(); return; }
    if (detailOpen) {
      if (e.key === "Escape") closeDetail();
      return;
    }
    if (e.key === "ArrowLeft") goTo((frontIdx + N - 1) % N);
    else if (e.key === "ArrowRight") goTo((frontIdx + 1) % N);
    else if (e.key === "Enter") openDetail(frontIdx);
  });

  /* nav scroll buttons */
  document.querySelectorAll(".nav-link").forEach((b) =>
    b.addEventListener("click", () => {
      closeDetail();
      const target = b.dataset.goto === "about" ? $("#about") : $("#stage");
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    })
  );

  /* ---------------- detail stage ---------------- */
  const detail = $("#detail");
  const holder = $("#fan-holder");
  const tiltBox = $("#fan-tilt");
  let detailOpen = false;
  let current = null, currentFinish = 0;

  // live fan state (JS-driven so speed changes glide instead of jumping)
  let powerOn = true, lightOn = false, speedSet = 3;
  let bladeAngle = 0, rpm = 0;
  let spinEl = null, blurEl = null;
  let tiltRX = 0, tiltRY = 0, holderScale = 1;

  function speedToVel(s) { return 2.2 + s * 2.4; } // deg per frame @60fps

  function spinBigFan(dt) {
    if (!current) return;
    const target = powerOn ? speedToVel(speedSet) : 0;
    rpm += (target - rpm) * 0.03 * dt; // spin-up / wind-down inertia
    bladeAngle = (bladeAngle + rpm * dt) % 360;
    if (spinEl) spinEl.style.transform = `rotate(${bladeAngle}deg)`;
    if (blurEl) blurEl.style.opacity = clamp((rpm - 7) / 18, 0, 0.18).toFixed(3);
  }

  function mountFan(svgHTML) {
    holder.innerHTML = svgHTML;
    spinEl = $(".spin", holder);
    blurEl = $(".blur-disc", holder);
    if (spinEl) {
      spinEl.style.animation = "none";
      spinEl.style.transformBox = "fill-box";
      spinEl.style.transformOrigin = "center";
    }
  }

  function openDetail(i) {
    current = CATALOG[i];
    currentFinish = 0;
    powerOn = !reduceMotion; lightOn = current.hasLight; speedSet = 3; rpm = 0;
    tiltRX = 0; tiltRY = 0; holderScale = 1;
    applyTilt();

    mountFan(FanArt.render(current, 0));
    holder.classList.toggle("light-on", lightOn);
    holder.classList.add("power-on");
    const accent = current.finishes[0].accent;
    holder.style.setProperty("--c-accent", accent);

    $("#d-line").textContent = `${current.line} · ${current.tag}`;
    $("#d-alias").textContent = current.alias;
    $("#d-model").textContent = current.name;
    $("#d-desc").textContent = current.desc;
    $("#d-price").textContent = inr(current.price);
    $("#d-mrp").textContent = inr(current.mrp);
    $("#d-save").textContent = `save ${Math.round((1 - current.price / current.mrp) * 100)}%`;
    $("#d-emi").textContent = `or ${inr(Math.ceil(current.price / 12))}/month · 12-month no-cost EMI`;

    // finish swatches
    const sw = $("#d-swatches");
    sw.innerHTML = "";
    current.finishes.forEach((f, k) => {
      const b = document.createElement("button");
      b.className = "swatch" + (k === 0 ? " active" : "");
      b.title = f.name;
      b.setAttribute("aria-label", `Finish: ${f.name}`);
      b.style.background = `linear-gradient(135deg, ${f.accent} 0%, ${f.blade} 45%, ${f.body} 100%)`;
      b.addEventListener("click", () => setFinish(k));
      sw.appendChild(b);
    });
    $("#d-finish-name").textContent = current.finishes[0].name;

    // specs
    $("#d-specs").innerHTML = [
      ["Sweep", current.sweep],
      ["Motor", current.watts],
      ["Speed", current.rpm],
      ["Air delivery", current.air],
      ["Control", "RF remote + app"],
      ["Modes", "Timer · Breeze · Reverse"],
    ].map(([k, v]) => `<div class="spec"><span>${k}</span><b>${v}</b></div>`).join("");

    // CTAs
    const msg = `Hi Kanz Enterprises! I'd like to reserve the ${current.alias} (${current.name}) at ${inr(current.price)}.`;
    $("#cta-buy").href = waLink(msg);
    $("#cta-wa").href = waLink(`Hi! Tell me more about the ${current.alias} (${current.name}).`);

    // light tool visibility
    $("#tool-light").style.display = current.hasLight ? "" : "none";
    syncTools();

    detail.classList.add("open");
    detail.setAttribute("aria-hidden", "false");
    detailOpen = true;
  }

  function closeDetail() {
    if (!detailOpen) return;
    detail.classList.remove("open");
    detail.setAttribute("aria-hidden", "true");
    detailOpen = false;
    current = null; spinEl = null; blurEl = null;
    lastInteract = performance.now();
  }
  $("#detail-close").addEventListener("click", closeDetail);

  function setFinish(k) {
    currentFinish = k;
    const svg = $(".fan-art", holder);
    FanArt.applyFinish(svg, current, k);
    holder.style.setProperty("--c-accent", current.finishes[k].accent);
    $("#d-finish-name").textContent = current.finishes[k].name;
    [...$("#d-swatches").children].forEach((b, j) => b.classList.toggle("active", j === k));
  }

  /* tools */
  const toolPower = $("#tool-power"), toolLight = $("#tool-light"), toolSpeed = $("#tool-speed");
  function syncTools() {
    toolPower.classList.toggle("on", powerOn);
    toolLight.classList.toggle("on", lightOn);
    toolSpeed.value = speedSet;
  }
  toolPower.addEventListener("click", () => {
    powerOn = !powerOn;
    holder.classList.toggle("power-on", powerOn);
    syncTools();
  });
  toolLight.addEventListener("click", () => {
    lightOn = !lightOn;
    holder.classList.toggle("light-on", lightOn);
    syncTools();
  });
  toolSpeed.addEventListener("input", () => { speedSet = +toolSpeed.value; });
  $("#tool-zoom").addEventListener("click", openZoom);

  /* tilt + wheel-zoom on the big fan */
  function applyTilt() {
    holder.style.transform =
      `scale(${holderScale}) rotateX(${tiltRX}deg) rotateY(${tiltRY}deg)`;
  }
  let tiltDrag = false, tLX = 0, tLY = 0;
  tiltBox.addEventListener("pointerdown", (e) => {
    tiltDrag = true; tLX = e.clientX; tLY = e.clientY;
    tiltBox.classList.add("grabbing");
    tiltBox.setPointerCapture(e.pointerId);
  });
  tiltBox.addEventListener("pointermove", (e) => {
    if (!tiltDrag) return;
    tiltRY = clamp(tiltRY + (e.clientX - tLX) * 0.16, -24, 24);
    tiltRX = clamp(tiltRX - (e.clientY - tLY) * 0.16, -16, 18);
    tLX = e.clientX; tLY = e.clientY;
    applyTilt();
  });
  const endTilt = () => { tiltDrag = false; tiltBox.classList.remove("grabbing"); };
  tiltBox.addEventListener("pointerup", endTilt);
  tiltBox.addEventListener("pointercancel", endTilt);
  tiltBox.addEventListener("dblclick", () => {
    tiltRX = 0; tiltRY = 0; holderScale = 1; applyTilt();
  });
  tiltBox.addEventListener("wheel", (e) => {
    e.preventDefault();
    holderScale = clamp(holderScale - Math.sign(e.deltaY) * 0.12, 0.8, 1.8);
    applyTilt();
  }, { passive: false });

  /* ---------------- fullscreen zoom ---------------- */
  const zoomLayer = $("#zoom-layer"), zoomCanvas = $("#zoom-canvas");
  let zoomOpen = false, zScale = 1, zX = 0, zY = 0;
  let zDrag = false, zLX = 0, zLY = 0;
  const pinch = new Map();
  let pinchDist = 0;

  function applyZoom() {
    zoomCanvas.style.transform =
      `translate(calc(-50% + ${zX}px), calc(-50% + ${zY}px)) scale(${zScale})`;
  }
  function openZoom() {
    zoomCanvas.innerHTML = FanArt.render(current, currentFinish);
    zoomCanvas.classList.toggle("light-on", lightOn);
    zScale = 1; zX = 0; zY = 0; applyZoom();
    zoomLayer.classList.add("open");
    zoomLayer.setAttribute("aria-hidden", "false");
    zoomOpen = true;
  }
  function closeZoom() {
    zoomLayer.classList.remove("open");
    zoomLayer.setAttribute("aria-hidden", "true");
    zoomOpen = false;
  }
  $("#zoom-close").addEventListener("click", closeZoom);

  zoomLayer.addEventListener("wheel", (e) => {
    e.preventDefault();
    zScale = clamp(zScale * (e.deltaY > 0 ? 0.9 : 1.1), 0.6, 6);
    applyZoom();
  }, { passive: false });

  zoomLayer.addEventListener("pointerdown", (e) => {
    pinch.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch.size === 2) {
      const [a, b] = [...pinch.values()];
      pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    } else {
      zDrag = true; zLX = e.clientX; zLY = e.clientY;
      zoomLayer.classList.add("grabbing");
    }
    zoomLayer.setPointerCapture(e.pointerId);
  });
  zoomLayer.addEventListener("pointermove", (e) => {
    if (!pinch.has(e.pointerId)) return;
    pinch.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch.size === 2) {
      const [a, b] = [...pinch.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinchDist) zScale = clamp(zScale * (d / pinchDist), 0.6, 6);
      pinchDist = d;
      applyZoom();
    } else if (zDrag) {
      zX += e.clientX - zLX; zY += e.clientY - zLY;
      zLX = e.clientX; zLY = e.clientY;
      applyZoom();
    }
  });
  const zEnd = (e) => {
    pinch.delete(e.pointerId);
    if (pinch.size < 2) pinchDist = 0;
    if (pinch.size === 0) { zDrag = false; zoomLayer.classList.remove("grabbing"); }
  };
  zoomLayer.addEventListener("pointerup", zEnd);
  zoomLayer.addEventListener("pointercancel", zEnd);
})();
