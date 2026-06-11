/* ============================================================
   KANZ ENTERPRISES — Sphere Showcase
   Catalog data + parametric SVG fan renderer (no dependencies)
   ============================================================ */

const KANZ_CONTACT = {
  whatsapp: "919999999999", // TODO: replace with the real Kanz Enterprises WhatsApp number
  email: "hello@kanzenterprises.com",
};

/* ---------- Catalog ----------
   Model numbers follow the real Kanz naming scheme (FNC / K-FNC series).
   Prices are indicative — update freely. */
const CATALOG = [
  {
    id: "k-fnc-2103",
    name: "K-FNC-2103 BB FM",
    alias: "Crystal Royale",
    line: "REGALE",
    tag: "Chandelier Series",
    type: "chandelier",
    price: 34999, mrp: 45999,
    sweep: "1320 mm", watts: "35 W BLDC", rpm: "320 RPM", air: "230 CMM",
    bladeCount: 8, hasLight: true,
    desc: "A cascading crystal chandelier and a whisper-silent BLDC fan in one sculpted form. Retractable blades disappear when the fan rests — leaving pure jewellery on your ceiling.",
    finishes: [
      { name: "Champagne Gold", blade: "#d9b96a", metal: "#a8852f", accent: "#ffe9b0", body: "#7c5f1d" },
      { name: "Rose Blush",     blade: "#e0b8a8", metal: "#b07c62", accent: "#ffd9c9", body: "#7d5240" },
      { name: "Smoked Chrome",  blade: "#b9c2cc", metal: "#7c8794", accent: "#e8eef5", body: "#4a525c" },
    ],
  },
  {
    id: "fnc-2055",
    name: "FNC-2055 Wooden",
    alias: "Nordic Timber",
    line: "FanCy",
    tag: "Wooden Blade",
    type: "wood",
    price: 18499, mrp: 24999,
    sweep: "1380 mm", watts: "40 W BLDC", rpm: "300 RPM", air: "245 CMM",
    bladeCount: 3, hasLight: false,
    desc: "Three solid hand-finished wooden blades on a 40 W BLDC heart. Scandinavian warmth, Indian summers tamed — at half the power draw of a conventional fan.",
    finishes: [
      { name: "Natural Walnut", blade: "#9a6b3f", metal: "#3a3f47", accent: "#caa05f", body: "#2c3036" },
      { name: "Dark Teak",      blade: "#6b4226", metal: "#2b2e33", accent: "#9c6a3d", body: "#222428" },
      { name: "White Oak",      blade: "#cdb18a", metal: "#8d949c", accent: "#e8d7b8", body: "#6d747c" },
    ],
  },
  {
    id: "k-bl-9000",
    name: "K-BL-9000 Aurora",
    alias: "Bladeless Halo",
    line: "REGALE",
    tag: "Bladeless",
    type: "bladeless",
    price: 42999, mrp: 56999,
    sweep: "900 mm ring", watts: "32 W BLDC", rpm: "Turbine drive", air: "210 CMM",
    bladeCount: 0, hasLight: true,
    desc: "No blades. No noise. A levitating halo of light that moves air through a hidden turbine — the most photographed ceiling in any room it enters.",
    finishes: [
      { name: "Lunar White", blade: "#e9edf2", metal: "#c2c9d2", accent: "#dff1ff", body: "#9aa3ae" },
      { name: "Onyx Black",  blade: "#2e3238", metal: "#15171b", accent: "#9fd8ff", body: "#0d0f12" },
      { name: "Aurum Gold",  blade: "#d8bc78", metal: "#a8852f", accent: "#fff0c0", body: "#6e571f" },
    ],
  },
  {
    id: "k-rt-7705",
    name: "K-RT-7705 Retracta",
    alias: "Retracta Lumina",
    line: "REGALE",
    tag: "Retractable Blade",
    type: "retract",
    price: 28999, mrp: 38999,
    sweep: "1080 mm", watts: "38 W BLDC", rpm: "330 RPM", air: "215 CMM",
    bladeCount: 4, hasLight: true,
    desc: "Blades that unfold like petals when you switch on, and vanish into a glowing dome when you don't. Theatre for your ceiling, engineered in metal.",
    finishes: [
      { name: "Pearl Ivory",  blade: "#e7e2d4", metal: "#b9b29e", accent: "#fff6dd", body: "#8c8570" },
      { name: "Graphite",     blade: "#565d66", metal: "#33383f", accent: "#cfe2f3", body: "#22262b" },
      { name: "Copper Dusk",  blade: "#c08552", metal: "#8a5a32", accent: "#ffd9ad", body: "#5e3c20" },
    ],
  },
  {
    id: "k-ant-1888",
    name: "K-ANT-1888 Heritage",
    alias: "Heritage Antique",
    line: "FanCy",
    tag: "Antique Series",
    type: "antique",
    price: 21499, mrp: 28999,
    sweep: "1320 mm", watts: "45 W BLDC", rpm: "310 RPM", air: "235 CMM",
    bladeCount: 4, hasLight: false,
    desc: "Ornate cast detailing, burnished brass and leaf-cut blades — a colonial-era silhouette reborn with a silent modern motor. For homes with stories.",
    finishes: [
      { name: "Antique Brass",  blade: "#a9853c", metal: "#7c5f24", accent: "#e3c878", body: "#4e3c14" },
      { name: "Aged Bronze",    blade: "#7d5a3a", metal: "#54422c", accent: "#c49a6c", body: "#33271a" },
      { name: "Pewter",         blade: "#8d949e", metal: "#5d646e", accent: "#cdd5de", body: "#3a4048" },
    ],
  },
  {
    id: "k-fm-3302",
    name: "K-FM-3302 LowPro",
    alias: "LowPro Flush",
    line: "FanCy",
    tag: "Flush Mount",
    type: "flush",
    price: 14999, mrp: 19999,
    sweep: "1200 mm", watts: "35 W BLDC", rpm: "340 RPM", air: "200 CMM",
    bladeCount: 5, hasLight: true,
    desc: "Hugs low ceilings with a profile of just 28 cm, five slim blades and a soft halo light. Designed for compact luxury apartments and false ceilings.",
    finishes: [
      { name: "Matte White", blade: "#eef0f3", metal: "#c7ccd3", accent: "#ffffff", body: "#9da4ad" },
      { name: "Slate Grey",  blade: "#6c7480", metal: "#494f59", accent: "#d6dde6", body: "#30343b" },
      { name: "Sand Beige",  blade: "#d6c4a4", metal: "#a8966f", accent: "#f2e6cb", body: "#73654a" },
    ],
  },
  {
    id: "k-rv-5501",
    name: "K-RV-5501 Duo",
    alias: "Duo Reversible",
    line: "FanCy",
    tag: "Reversible Blade",
    type: "duo",
    price: 16999, mrp: 22499,
    sweep: "1320 mm", watts: "40 W BLDC", rpm: "320 RPM", air: "240 CMM",
    bladeCount: 4, hasLight: false,
    desc: "Two moods on one fan — flip the reversible blades between a light and a dark face whenever your room changes its mind. Summer/winter reverse mode included.",
    finishes: [
      { name: "Walnut × Cream", blade: "#8a5a34", blade2: "#e9dfc8", metal: "#3c4046", accent: "#d9b06a", body: "#26292e" },
      { name: "Ebony × Ash",    blade: "#2e2a26", blade2: "#cfc6b8", metal: "#54595f", accent: "#bfc7cf", body: "#33373c" },
      { name: "Teak × White",   blade: "#6f4a2a", blade2: "#f1efe9", metal: "#7e858d", accent: "#e2c79a", body: "#4c5158" },
    ],
  },
  {
    id: "k-abs-2210",
    name: "K-ABS-2210 Opal",
    alias: "Opal Lume",
    line: "FanCy",
    tag: "Underlight ABS",
    type: "abs",
    price: 12499, mrp: 16999,
    sweep: "1200 mm", watts: "35 W BLDC", rpm: "350 RPM", air: "220 CMM",
    bladeCount: 3, hasLight: true,
    desc: "Sculpted aerodynamic ABS blades around a colour-changing opal glass light. Remote, timer and breeze mode — the designer entry into the Kanz family.",
    finishes: [
      { name: "Opal White",  blade: "#f0f2f5", metal: "#cfd4da", accent: "#e8f4ff", body: "#a3aab2" },
      { name: "Sapphire",    blade: "#3c5a8c", metal: "#273c60", accent: "#bcd6ff", body: "#1a2840" },
      { name: "Blush Gold",  blade: "#e4c89a", metal: "#b39154", accent: "#fff0d4", body: "#7a6238" },
    ],
  },
  {
    id: "k-rg-0001",
    name: "K-RG-0001 Imperial",
    alias: "Imperial Crown",
    line: "REGALE",
    tag: "Flagship Chandelier",
    type: "imperial",
    price: 54999, mrp: 74999,
    sweep: "1400 mm", watts: "42 W BLDC", rpm: "300 RPM", air: "250 CMM",
    bladeCount: 8, hasLight: true,
    desc: "The crown of the REGALE line. Twin crystal tiers, gold-dipped detailing and a motor tuned to library silence. Made for double-height living rooms and grand lobbies.",
    finishes: [
      { name: "Imperial Gold", blade: "#e0c074", metal: "#b08c2e", accent: "#fff3c4", body: "#8a6a1e" },
      { name: "Platinum",      blade: "#d6dde6", metal: "#9aa5b1", accent: "#f2f7ff", body: "#6b7682" },
      { name: "Noir Gold",     blade: "#2b2d33", metal: "#b08c2e", accent: "#ffe9a8", body: "#191b1f" },
    ],
  },
];

/* ---------- Parametric SVG fan renderer ----------
   Every model is drawn from the same visual language so the whole
   collection reads as one family. Colours flow through CSS custom
   properties (--c-blade, --c-blade2, --c-metal, --c-accent, --c-body)
   so finish swatches re-skin the artwork live, with zero redraws.

   The blade disc is wrapped in scale(1, k) and the inner group spins —
   non-uniform scale turns the rotation into a true elliptical orbit,
   i.e. correct perspective foreshortening of a tilted spinning disc. */

const FanArt = (() => {

  /* unique gradient ids per render to avoid collisions */
  let uid = 0;

  /* top-view blade path templates: blade points along +X from origin */
  const BLADE_PATHS = {
    curve:  "M14,-7 C70,-26 140,-22 168,-4 C176,2 176,10 166,14 C130,26 64,22 14,8 Z",
    plank:  "M16,-13 L150,-17 C166,-16 172,-9 172,0 C172,9 166,16 150,17 L16,13 Z",
    ornate: "M14,-6 C56,-30 118,-34 156,-16 C176,-6 178,10 158,18 C120,34 54,26 14,8 Z M158,-14 C170,-20 180,-12 174,-2 Z",
    slim:   "M16,-8 C80,-16 150,-12 170,-2 C176,2 174,8 166,10 C140,16 70,12 16,6 Z",
    wide:   "M14,-10 C84,-34 152,-28 172,-6 C180,4 172,16 152,20 C108,28 52,18 14,10 Z",
  };

  const BLADE_BY_TYPE = {
    chandelier: "slim", imperial: "slim", wood: "plank", retract: "curve",
    antique: "ornate", flush: "slim", duo: "plank", abs: "wide",
  };

  /* one blade, with a shading overlay that survives colour swaps */
  function blade(path, angle, len, twoTone, idx) {
    const fill = twoTone && idx % 2 ? "var(--c-blade2, var(--c-blade))" : "var(--c-blade)";
    const s = len / 178;
    return `
      <g transform="rotate(${angle}) scale(${s})">
        <path d="${path}" fill="${fill}"/>
        <path d="${path}" fill="url(#bshade)" opacity="0.55"/>
        <path d="M14,0 L150,0" stroke="rgba(0,0,0,0.18)" stroke-width="2" fill="none"/>
      </g>`;
  }

  /* the spinning disc: blades laid flat (top view), squashed to an ellipse */
  function bladeDisc(n, type, len, cy, twoTone) {
    if (!n) return "";
    const path = BLADE_PATHS[BLADE_BY_TYPE[type] || "curve"];
    let blades = "";
    for (let i = 0; i < n; i++) blades += blade(path, (360 / n) * i, len, twoTone, i);
    return `
      <g transform="translate(200 ${cy}) scale(1 0.34)">
        <ellipse class="blur-disc" rx="${len}" ry="${len}" fill="var(--c-blade)" opacity="0"/>
        <g class="spin"><circle r="${len}" fill="none" stroke="none"/>${blades}</g>
      </g>`;
  }

  function downrod(len, w = 7) {
    return `
      <path d="M168,18 L232,18 L218,40 L182,40 Z" fill="url(#metal)"/>
      <rect x="${200 - w / 2}" y="38" width="${w}" height="${len}" rx="${w / 2}" fill="url(#metal)"/>
      <rect x="${200 - w / 2}" y="38" width="${w / 2.4}" height="${len}" rx="2" fill="rgba(255,255,255,0.25)"/>`;
  }

  /* motor housing: a soft metallic capsule */
  function motor(cy, rx, ry, deep) {
    return `
      <ellipse cx="200" cy="${cy - ry * 0.55}" rx="${rx}" ry="${ry * 0.6}" fill="url(#metal)"/>
      <path d="M${200 - rx},${cy - ry * 0.5} A${rx} ${ry} 0 0 0 ${200 + rx},${cy - ry * 0.5}
               L${200 + rx * 0.8},${cy + deep} A${rx * 0.8} ${ry * 0.8} 0 0 1 ${200 - rx * 0.8},${cy + deep} Z"
            fill="var(--c-body)"/>
      <path d="M${200 - rx},${cy - ry * 0.5} A${rx} ${ry} 0 0 0 ${200 + rx},${cy - ry * 0.5}
               L${200 + rx * 0.8},${cy + deep} A${rx * 0.8} ${ry * 0.8} 0 0 1 ${200 - rx * 0.8},${cy + deep} Z"
            fill="url(#bodyshade)"/>
      <ellipse cx="${200 - rx * 0.35}" cy="${cy - ry * 0.75}" rx="${rx * 0.3}" ry="${ry * 0.22}"
               fill="rgba(255,255,255,0.35)"/>`;
  }

  /* under-light: glass bowl + glow (toggled with .light-on on the wrapper) */
  function lamp(cy, rx) {
    return `
      <g class="lamp">
        <ellipse class="lamp-glow" cx="200" cy="${cy + 14}" rx="${rx * 2.6}" ry="${rx * 1.1}"
                 fill="url(#glow)" opacity="0"/>
        <path class="lamp-glass" d="M${200 - rx},${cy} A${rx} ${rx * 0.92} 0 0 0 ${200 + rx},${cy} Z"
              fill="#dfe7ee" opacity="0.85"/>
        <ellipse cx="200" cy="${cy}" rx="${rx}" ry="${rx * 0.28}" fill="var(--c-accent)" opacity="0.9"/>
      </g>`;
  }

  /* hanging crystal strand for chandelier models */
  function crystals(cy, count, r, size, tier) {
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = 200 + Math.cos((i / count) * Math.PI * 2) * r;
      const sway = (i % 2 ? 1 : -1) * 1.2;
      const drop = cy + Math.sin((i / count) * Math.PI) * 2;
      out += `
        <line x1="${x}" y1="${cy - 4}" x2="${x + sway}" y2="${drop + size * 1.4}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
        <path d="M${x + sway},${drop + size * 1.4} l${size * 0.6},${size} l-${size * 0.6},${size * 1.5} l-${size * 0.6},-${size * 1.5} Z"
              fill="url(#crystal)" class="crystal c${(i + tier) % 3}"/>`;
    }
    return out;
  }

  /* defs shared by every fan */
  function defs(id) {
    return `<defs>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--c-accent)"/>
        <stop offset="0.45" style="stop-color:var(--c-metal)"/>
        <stop offset="1" style="stop-color:var(--c-body)"/>
      </linearGradient>
      <linearGradient id="bodyshade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="rgba(0,0,0,0.35)"/>
        <stop offset="0.3" stop-color="rgba(255,255,255,0.14)"/>
        <stop offset="0.6" stop-color="rgba(0,0,0,0)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0.4)"/>
      </linearGradient>
      <linearGradient id="bshade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="rgba(255,255,255,0.28)"/>
        <stop offset="0.5" stop-color="rgba(0,0,0,0)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0.3)"/>
      </linearGradient>
      <radialGradient id="glow">
        <stop offset="0" style="stop-color:var(--c-accent)" stop-opacity="0.95"/>
        <stop offset="0.5" style="stop-color:var(--c-accent)" stop-opacity="0.35"/>
        <stop offset="1" style="stop-color:var(--c-accent)" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="0.5" style="stop-color:var(--c-accent)" stop-opacity="0.8"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0.55"/>
      </linearGradient>
      <radialGradient id="ringGlow">
        <stop offset="0.62" style="stop-color:var(--c-accent)" stop-opacity="0"/>
        <stop offset="0.78" style="stop-color:var(--c-accent)" stop-opacity="0.55"/>
        <stop offset="0.86" style="stop-color:var(--c-accent)" stop-opacity="0"/>
      </radialGradient>
    </defs>`;
  }

  /* per-type compositions (400×400 viewBox, mount at top) */
  function compose(m) {
    const t = m.type;

    if (t === "bladeless") {
      return `
        ${downrod(118, 8)}
        <g transform="translate(200 235)">
          <g transform="scale(1 0.42)">
            <circle r="128" fill="none" stroke="url(#metal)" stroke-width="26"/>
            <circle r="128" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="6"/>
            <circle class="halo-ring" r="128" fill="url(#ringGlow)" opacity="0.25"/>
          </g>
        </g>
        ${motor(170, 34, 16, 26)}
        ${lamp(198, 22)}`;
    }

    if (t === "chandelier" || t === "imperial") {
      const imperial = t === "imperial";
      return `
        ${downrod(86)}
        ${bladeDisc(m.bladeCount, t, imperial ? 158 : 148, 168, false)}
        ${motor(150, 46, 20, 34)}
        <g>
          <ellipse cx="200" cy="196" rx="64" ry="14" fill="url(#metal)"/>
          ${crystals(200, 12, 58, 7, 0)}
          <ellipse cx="200" cy="226" rx="42" ry="10" fill="url(#metal)"/>
          ${crystals(228, 8, 36, 6, 1)}
          ${imperial ? `<ellipse cx="200" cy="252" rx="22" ry="7" fill="url(#metal)"/>${crystals(254, 5, 16, 5, 2)}` : ""}
        </g>
        ${lamp(imperial ? 282 : 258, 14)}`;
    }

    if (t === "retract") {
      return `
        ${downrod(92)}
        ${bladeDisc(m.bladeCount, t, 150, 172, false)}
        ${motor(152, 52, 22, 30)}
        <path d="M148,182 A52 30 0 0 0 252,182 L240,206 A40 18 0 0 1 160,206 Z" fill="var(--c-body)"/>
        ${lamp(212, 30)}`;
    }

    if (t === "flush") {
      return `
        <path d="M150,18 L250,18 L236,44 L164,44 Z" fill="url(#metal)"/>
        ${bladeDisc(m.bladeCount, t, 152, 78, false)}
        ${motor(62, 48, 18, 22)}
        ${lamp(96, 30)}`;
    }

    if (t === "antique") {
      return `
        ${downrod(102, 8)}
        <circle cx="200" cy="132" r="6" fill="var(--c-accent)"/>
        ${bladeDisc(m.bladeCount, t, 156, 178, false)}
        ${motor(158, 44, 20, 34)}
        <ellipse cx="200" cy="200" rx="20" ry="8" fill="url(#metal)"/>
        <path d="M196,206 L204,206 L200,224 Z" fill="var(--c-metal)"/>
        <circle cx="200" cy="228" r="5" fill="var(--c-accent)"/>`;
    }

    /* wood / duo / abs — classic silhouettes */
    const light = m.hasLight ? lamp(t === "abs" ? 206 : 200, 26) : "";
    return `
      ${downrod(98)}
      ${bladeDisc(m.bladeCount, t, 156, 174, t === "duo")}
      ${motor(154, 44, 19, 30)}
      ${light}`;
  }

  /* public API ------------------------------------------------ */
  function render(model, finishIdx = 0) {
    const f = model.finishes[finishIdx] || model.finishes[0];
    const id = ++uid;
    const vars = `--c-blade:${f.blade};--c-blade2:${f.blade2 || f.blade};--c-metal:${f.metal};--c-accent:${f.accent};--c-body:${f.body}`;
    const body = `
        ${defs(id)}
        <ellipse cx="200" cy="356" rx="120" ry="16" fill="rgba(0,0,0,0.45)" class="fan-shadow"/>
        ${compose(model)}`
      /* namespace gradient ids — duplicate ids across inline SVGs would make
         every fan resolve url(#…) against the first SVG's palette */
      .replace(/(url\(#|id=")(metal|bodyshade|bshade|glow|crystal|ringGlow)/g, `$1$2_${id}`);
    return `
      <svg class="fan-art" viewBox="0 0 400 400" style="${vars}" role="img"
           aria-label="${model.alias} designer ceiling fan" data-art="${id}">${body}
      </svg>`;
  }

  function applyFinish(svgEl, model, finishIdx) {
    const f = model.finishes[finishIdx] || model.finishes[0];
    svgEl.style.setProperty("--c-blade", f.blade);
    svgEl.style.setProperty("--c-blade2", f.blade2 || f.blade);
    svgEl.style.setProperty("--c-metal", f.metal);
    svgEl.style.setProperty("--c-accent", f.accent);
    svgEl.style.setProperty("--c-body", f.body);
  }

  return { render, applyFinish };
})();

const inr = (n) => "₹" + n.toLocaleString("en-IN");
