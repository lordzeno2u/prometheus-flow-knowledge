# Prometheus Flow Knowledge

Living, shareable static knowledge base of **truth-filtered** peak-performance / flow-science tidbits. Precise voice, evidence tiers required, no hype.

## Open locally

**Recommended** (allows `fetch` of `data/tidbits.json`):

```bash
cd /workspace/flow-knowledge/site
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in a browser.

You can also open `index.html` directly (`file://`). Some browsers block local JSON fetch; if cards do not load, use the HTTP server above.

Share the whole `site/` folder, or drop it on any static host (Netlify, GitHub Pages, S3, nginx).

## What’s here

| Path | Role |
|------|------|
| `index.html` | Main page |
| `css/styles.css` | Dark Promethean UI |
| `js/app.js` | Load JSON, cards, tier/theme filters, search, export |
| `js/scene.js` | Three.js ambient background (embers + lattice); respects `prefers-reduced-motion` |
| `data/tidbits.json` | Source of truth for tidbits, themes, lane note |

## Evidence tiers

- **Established** — meta-analyses / strong primary support
- **Promising** — converging but incomplete evidence
- **Speculative** — plausible framing, thin primary citation
- **Contested** — mixed findings or safety/context dependence

## Add a tidbit

1. Edit `data/tidbits.json`.
2. Append an object under `tidbits` with: `id`, `title`, `claim`, `evidenceTier`, `caveats`, `sources[]` (`citation`, `doiOrUrl`, optional `n`), `practice`, `themeIds` (from the five HANDOFF themes), `added`, `lastReviewed`, `status` (`active` or archive later).
3. Do **not** invent claims beyond what sources support. Tier honestly.
4. Refresh the browser (hard refresh if cached).

Theme IDs: `flow-triggers`, `group-flow`, `neurochemistry-ecstasis`, `risk-reward-nos`, `training-vs-chemicals`.

## Weekly review

Once a week: skim active tidbits, update `lastReviewed`, demote tiers if new counter-evidence appears, archive (`status` ≠ `active`) what no longer earns a slot. Prefer fewer high-signal cards over volume.

## Lanes

- **Prometheus** — peak states, flow, focus, ecstasis, training design (this KB).
- **Helix** — longevity / lasting-longer biology — hand off; do not duplicate here.

## Future API

The same `tidbits.json` shape can be served by an API for team motivation feeds. Keep the file the contract: themes, evidence tiers, and tidbit fields stay stable so a static site and a future endpoint share one schema.

## Export

Use **Export JSON** in the UI to download the loaded dataset (handy after viewing; edits still happen in `data/tidbits.json` on disk).
