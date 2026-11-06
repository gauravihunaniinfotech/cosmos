# Cosmo's Heating & Air Conditioning – Homepage Redesign

Pure HTML + CSS + vanilla JavaScript. No build step, no dependencies.

## Run locally (VS Code Live Server)
1. Unzip and open the `cosmos` folder in VS Code (File > Open Folder).
2. Install the **Live Server** extension (`ritwickdey.LiveServer`) – VS Code will suggest it.
3. Right-click `index.html` > **Open with Live Server** (or click **Go Live** in the status bar).
4. Chrome opens at **http://localhost:5500** (port is preset in `.vscode/settings.json`).

### No VS Code? Either of these also serves on port 5500
- `python3 -m http.server 5500`  then open http://localhost:5500
- `npx live-server --port=5500`

## Structure
```
index.html      semantic markup, SEO meta, JSON-LD (HVACBusiness)
style.css       tokens, layout, components, responsive, reduced-motion
script.js       nav, scroll-spy, reveal, parallax, counters, gallery+lightbox, reviews, form
assets/images   logo + project photos (from the original site)
assets/fonts    self-hosted Poppins + Lora (Latin subset, no external requests)
assets/icons    favicon, apple-touch icon
.vscode         Live Server port/config
```

## Things to know / edit
- **Reviews:** the original site has no review text, so none are invented. Paste real Google reviews into the `REVIEWS` array in `script.js` and the slider turns on automatically.
- **Contact form:** static site, so on submit it validates and opens the visitor's email app addressed to service@cosmosaclv.com. Swap `sendViaMailto()` in `script.js` for Formspree/Netlify Forms when hosting.
- **Counters** use only facts from the original site (5.0 rating, 10 reviews, 3 cities, 6 services).
- **Service card text:** the original's card copy was truncated; short descriptions were written to match it. Review before launch.
- Canonical URL / JSON-LD use https://www.cosmosaclv.com/ – adjust if different.
- Photos were extracted from a screenshot, so they are modest resolution; swap in originals from the client for sharper results (same filenames).
