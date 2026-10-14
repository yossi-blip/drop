# Americare 2027 website prototype (transfer copy)

Temporary transfer of the approved americareny.com redesign prototype for import into Lovable.

- `index.html` — the complete working single-page prototype (all 19 routes, CSS and JS inline). Hash router: `#home`, `#care`, `#skilled-nursing`, `#home-health-aides`, `#health-management`, `#behavioral-health`, `#nhtd`, `#therapy`, `#amerikids`, `#attencia`, `#about`, `#locations`, `#contact`, `#get-care`, `#refer`, `#careers`, `#guides`, `#guide-discharge`, `#intake-desk`.
- `img/` — all images (logos as transparent PNG, photos as JPG).
- `source/` — the unbundled source: `site.css` + `spa.css` (styles), `header.html`, `footer.html`, `drawer.html`, `navigator.html` (shell), `pages/*.html` (one fragment per route, using `[[I:name:size]]` icon macros expanded in `source/chunks/*.txt`), `i18n.js` (EN/ES/ZH/RU/HI dictionary), `app.js` (router, forms, filters), `ai.js` (Care Navigator triage, Ask drawer, referral extraction, intake desk).
- `source/chunks/` — the same source with macros expanded, split into readable files.

Synthetic demo data only. No credentials, no PHI.
