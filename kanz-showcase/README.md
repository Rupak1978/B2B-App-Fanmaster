# Kanz Enterprises — The Designer Fan Sphere

An immersive, zero-dependency showcase concept for [Kanz Enterprises](https://www.kanzenterprises.com/)
designer ceiling fans, presented as an interactive 3D sphere.

## Run it

It's pure static HTML/CSS/JS — no build step, no dependencies.

```bash
cd kanz-showcase
python3 -m http.server 8080     # or: npx serve .
# open http://localhost:8080
```

Or simply open `index.html` in a browser. Deploys as-is to Vercel, Netlify or GitHub Pages.

## What's inside

- **The Sphere** — all 9 models orbit on a 3D sphere. Drag to spin (with inertia),
  it auto-orbits when idle, the front model is highlighted in the HUD.
- **Pick & choose** — bottom dock with every model, arrow keys / ‹ › buttons,
  tap any card to fly it to the front and open it.
- **Play with the product** — in the detail stage you can:
  - power the fan on/off (blades spin **up** and wind **down** with real inertia),
  - set speed 1–5 (motion-blur disc kicks in at high speed),
  - toggle the underlight / chandelier glow,
  - switch finishes live (every model has 3 colourways),
  - drag to tilt the fan in 3D, scroll to zoom, double-click to reset,
  - fullscreen zoom mode with pan + pinch.
- **Crisp at any resolution** — every fan is a parametric vector illustration
  (`js/catalog.js → FanArt`), so it stays razor-sharp on any display. Swap in
  real product photography later by replacing `FanArt.render()` output per model.
- **Conversion nudges** — strike-through MRP + savings badge, EMI line,
  trust strip, and WhatsApp deep-links prefilled with the exact model and price.

## Customising

- **Catalog** — edit `js/catalog.js` (`CATALOG`): names, prices, specs, copy,
  finishes. Prices/specs in the demo are indicative placeholders.
- **Contact** — set the real WhatsApp number and email in `KANZ_CONTACT`
  at the top of `js/catalog.js`.
- **Brand colours** — tweak the CSS custom properties at the top of `css/style.css`.

## Notes

- Honors `prefers-reduced-motion`.
- Works with mouse, touch (pinch zoom included) and keyboard (←/→, Enter, Esc).
