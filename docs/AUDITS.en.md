---
tags:
  - Audit
  - Accessibility
  - WCAG
  - Eco-design
  - Performance
---

# Accessibility, performance and eco-design audits

!!! abstract "Goal"
    **Objectively measure** Hook & Cook's compliance with web accessibility
    standards (RGAA / WCAG 2.0 AA), web performance and eco-design.
    The audits are **reproducible** via the
    [`audits/run-audits.sh`](https://github.com/S7venz/hook-cook/blob/main/audits/run-audits.sh)
    script that runs Lighthouse + Pa11y on the 5 key pages of the visitor
    journey.

## Pages audited

The **5 most representative** pages of the visitor flow:

| Page | URL | Why |
| --- | --- | --- |
| Home | `/` | First impression, most visitors |
| Shop | `/boutique` | Heaviest page (product catalogue) |
| Permits | `/permis` | Digital regulatory journey |
| Login | `/connexion` | Auth entry point — critical |
| Contests | `/concours` | Secondary page used for comparison |

## 1. Global summary

=== ":material-speedometer: Lighthouse"

    | Page | Performance | **Accessibility** | Best practices | SEO |
    | --- | :---: | :---: | :---: | :---: |
    | home       | :material-circle-medium: **57** | :material-check-circle:{ style="color:#4caf50" } 96  | :material-check-circle:{ style="color:#4caf50" } 100 | :material-circle-medium: 83 |
    | boutique   | :material-circle-medium: **60** | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 92 |
    | permis     | :material-circle-medium: **61** | :material-check-circle:{ style="color:#4caf50" } 95  | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 91 |
    | concours   | :material-circle-medium: **64** | :material-check-circle:{ style="color:#4caf50" } 92  | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 92 |
    | connexion  | :material-circle-medium: **69** | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 91 |

    !!! success "Strengths"
        - **Best practices 100/100 on every page** — no mixed content, security headers in place, dependencies free of known vulnerabilities
        - **Lighthouse accessibility 92-100** — labels, basic contrast, sound semantic structure

    !!! warning "Areas to improve"
        - **Performance 57-69** — code splitting already in place, but home LCP is slowed down by the hero image. Action: switch to `loading="eager"` + preload for the LCP image, partially done in commit [`8150532`](https://github.com/S7venz/hook-cook/commit/8150532).
        - **SEO home at 83** — missing a richer `<meta name="description">` and the `og:image` is not served.

=== ":material-wheelchair-accessibility: Pa11y (WCAG 2.0 AA, stricter)"

    Pa11y / axe-core goes deeper than Lighthouse and applies the
    **WCAG 2.0 AA** standard (technical equivalent of RGAA 4.1 for web
    content).

    | Page | Errors | Warnings | Notices |
    | --- | :---: | :---: | :---: |
    | home       | :material-alert:{ style="color:#f44336" } **85** | 0 | 0 |
    | boutique   | :material-alert:{ style="color:#f44336" } **61** | 0 | 0 |
    | concours   | :material-alert:{ style="color:#ff9800" } 51 | 0 | 0 |
    | permis     | :material-alert:{ style="color:#ff9800" } 37 | 0 | 0 |
    | connexion  | :material-alert:{ style="color:#ff9800" } 30 | 0 | 0 |

    !!! danger "Top 3 error categories (all pages combined)"
        | Category | Occurrences | Cause | RGAA level |
        | --- | :---: | --- | :---: |
        | `color-contrast` | **245** | Light grey text on light background below the 4.5:1 threshold | 10.3 |
        | `nested-interactive` | 15 | Nested buttons or links (clickable card + favorite button) | 7.1 |
        | `aria-command-name` | 4 | Icon-only buttons without `aria-label` | 11.2 |

=== ":material-leaf: Eco-design (Ecoindex)"

    Ecoindex score computed using the **official GreenIT-Analysis formula**
    based on DOM, request count and transferred weight (all measured by
    Lighthouse).

    | Page | DOM | Requests | Weight | Score | Grade | gCO₂eq/view |
    | --- | :---: | :---: | :---: | :---: | :---: | :---: |
    | concours  | 223 | 54 | 1.18 MB | :material-circle-medium:{ style="color:#4caf50" } **85** | :material-alpha-a-circle:{ style="color:#4caf50" } **A** | 1.86 |
    | connexion | 84  | 45 | 0.94 MB | :material-circle-medium:{ style="color:#4caf50" } **85** | :material-alpha-a-circle:{ style="color:#4caf50" } **A** | 1.86 |
    | permis    | 122 | 50 | 0.97 MB | :material-circle-medium:{ style="color:#4caf50" } **85** | :material-alpha-a-circle:{ style="color:#4caf50" } **A** | 1.86 |
    | home      | 515 | 60 | 1.58 MB | :material-circle-medium:{ style="color:#cddc39" } 70 | :material-alpha-b-circle:{ style="color:#cddc39" } B | 1.96 |
    | boutique  | 453 | 58 | 1.79 MB | :material-circle-medium:{ style="color:#cddc39" } 70 | :material-alpha-b-circle:{ style="color:#cddc39" } B | 1.96 |

    !!! success "Average score: 77/100 — Grade A/B"
        80 % of audited pages get an **A** grade. The shop and home — the
        heaviest pages (catalogue + sliders) — get a **B**, still above the
        French web average that hovers around C/D.

        **Estimated footprint**: ~1.9 g CO₂eq per page view. For 100,000
        monthly views that's ~190 kg CO₂eq/month, the equivalent of
        **1,100 km in a petrol car**.

## 2. Methodology

Tools used:

<div class="grid cards" markdown>

-   :material-google-chrome: &nbsp; **Lighthouse 13.3**

    ---

    Run headless via Brave Browser (Chromium-based). Four categories:
    `performance`, `accessibility`, `best-practices`, `seo`. Default
    desktop window, standard Lighthouse throttling.

-   :material-shield-check: &nbsp; **Pa11y 9 + axe-core**

    ---

    Standard applied: **WCAG2AA**. axe-core is the engine used by Deque
    for their commercial RGAA audits — it covers **~57 %** of the
    automatable RGAA criteria.

-   :material-leaf-circle: &nbsp; **Ecoindex**

    ---

    Score recomputed locally from Lighthouse metrics (DOM, requests,
    weight), using the official GreenIT-Analysis formula
    ([details](https://www.ecoindex.fr/comment-ca-marche/)).

-   :material-script-text: &nbsp; **Reproducible script**

    ---

    [`audits/run-audits.sh`](https://github.com/S7venz/hook-cook/blob/main/audits/run-audits.sh)
    re-runs the entire suite in a single command. Idempotent.
    Output: HTML + JSON in `audits/`.

</div>

## 3. Prioritized action plan

### :material-numeric-1-circle-outline: High priority — Colour contrast

!!! danger "245 violations across 5 pages"
    **RGAA 3.2** criterion (text contrast) — by far the most common defect
    and the easiest to fix.

**Root cause**: the theme palette uses **light grey `#bdbdbd`** for
secondary text (product subtitles, metadata, form hints). On a white
background the ratio is **2.8:1**, below the WCAG AA threshold (4.5:1).

**Proposed fix**:
```css
/* Before — frontend tailwind config */
--color-text-muted: #bdbdbd;   /* 2.8:1 — KO */

/* After */
--color-text-muted: #595959;   /* 7.0:1 — OK AA + AAA */
```

Estimated effort: ~1 h (single variable swap + visual review).

---

### :material-numeric-2-circle-outline: Medium priority — Home performance

**Cause**: LCP delayed by the `peche-3000.webp` hero image (~180 KB) loaded
without preload.

**Proposed fix**:
```html
<!-- frontend/index.html — added to <head> -->
<link rel="preload" as="image" href="/img/hero.webp"
      fetchpriority="high" type="image/webp">
```

Estimated gain: ~15 Performance points (LCP -1.2 s on fast 3G).

---

### :material-numeric-3-circle-outline: Low priority — Icon-only buttons

**Cause**: 4 buttons (favorites, share, close-modal) have no accessible
label. A screen reader will simply say "button" without context.

**Proposed fix**:
```jsx
// Before
<button onClick={toggleFav}><HeartIcon /></button>

// After
<button onClick={toggleFav} aria-label="Add to favorites">
  <HeartIcon />
</button>
```

Estimated effort: 30 min.

---

### :material-numeric-4-circle-outline: Low priority — Home SEO

Additions in `frontend/index.html`:

```html
<meta name="description" content="Hook & Cook — fishing shop, permits and contests in Perpignan...">
<meta property="og:title" content="Hook & Cook">
<meta property="og:description" content="...">
<meta property="og:image" content="/img/og-cover.jpg">
```

Estimated effort: 15 min.

## 4. Detailed reports (interactive HTML)

Click to read the full Lighthouse report for each page — performance
charts, network traces, detailed opportunities:

<div class="grid cards" markdown>

-   :material-home: &nbsp; **Home**

    ---

    [:material-open-in-new: Lighthouse report — home](./audits/lighthouse/home.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/home.json){ target="_blank" }

-   :material-cart: &nbsp; **Shop**

    ---

    [:material-open-in-new: Lighthouse report — shop](./audits/lighthouse/boutique.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/boutique.json){ target="_blank" }

-   :material-file-document: &nbsp; **Permits**

    ---

    [:material-open-in-new: Lighthouse report — permits](./audits/lighthouse/permis.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/permis.json){ target="_blank" }

-   :material-login: &nbsp; **Login**

    ---

    [:material-open-in-new: Lighthouse report — login](./audits/lighthouse/connexion.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/connexion.json){ target="_blank" }

-   :material-trophy: &nbsp; **Contests**

    ---

    [:material-open-in-new: Lighthouse report — contests](./audits/lighthouse/concours.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/concours.json){ target="_blank" }

-   :material-database: &nbsp; **Ecoindex summary**

    ---

    [:material-leaf: Raw JSON data](./audits/ecoindex-summary.json){ target="_blank" }
    Computed from Lighthouse metrics.

</div>

## 5. Re-running the audits

```bash
# 1. The app must be running locally
docker compose up -d

# 2. Run the full suite (5 pages × 3 tools ≈ 3 min)
./audits/run-audits.sh

# Environment variables:
#   HC_AUDIT_BASE=http://localhost:5173  (default)
#   CHROME_PATH=/path/to/chromium        (auto-detected)
```

HTML/JSON reports are written under `audits/`. To publish them on this
site, copy them into `docs/audits/` and `git push`.

---

<small>
*Audits run on 2026-05-26 against the local development environment
(Docker Compose). Scores will vary slightly depending on network latency
and system load — re-run the script for up-to-date figures before the
defence.*
</small>
