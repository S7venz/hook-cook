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
        - **Performance 57-69 (mobile-throttled — Lighthouse default)** — LCP is heavily penalised by network/CPU throttling. In **desktop conditions without throttling**, the home reaches **90/100** (LCP ~1.9 s). Applied optimisations: hero LCP image preload + route lazy-loading (commit [`8150532`](https://github.com/S7venz/hook-cook/commit/8150532)).
        - **SEO home at 83** — missing a richer `<meta name="description">` and the `og:image` is not served.

=== ":material-wheelchair-accessibility: Pa11y (WCAG AA, stricter)"

    Pa11y / axe-core goes deeper than Lighthouse and applies the **WCAG AA**
    standard (technical equivalent of RGAA 4.1 for web content). Mind how you
    read its count: it mixes two families.

    - the **violations** actually measured (axe `violations`);
    - the **needs-review** items (axe `incomplete`, which Pa11y still shows as
      "Error"): text over a product image, over a gradient or under the
      `mix-blend-mode` background texture, and modern `oklch()` / `color-mix()`
      colours that axe-core cannot parse. **These are not measured failures.**

    | Page | Real violations | Needs-review |
    | --- | :---: | :---: |
    | home       | :material-check-circle:{ style="color:#4caf50" } **0** | ~53 |
    | boutique   | :material-check-circle:{ style="color:#4caf50" } **0** | ~47 |
    | concours   | :material-check-circle:{ style="color:#4caf50" } **0** | ~44 |
    | permis     | :material-check-circle:{ style="color:#4caf50" } **0** | ~34 |
    | connexion  | :material-check-circle:{ style="color:#4caf50" } **0** | ~27 |

    !!! success "0 real violation, in both light and dark themes"
        After the fixes described below, an all-rules re-audit (axe
        `violations`) finds **no** violation on the 5 pages, in both themes.
        The remaining items are *needs-review* flags inherent to image-rich
        pages, to be confirmed visually.

    !!! note "What the audit had actually found — now fixed"
        | Category | Detail | Real cause | RGAA |
        | --- | :---: | --- | :---: |
        | `color-contrast` | 1 token + 1 override | `--ink-mute` (oklch) too dark in dark theme (4.39:1); washed-out Permits heading in light theme (2.56:1) | 3.2 |
        | `nested-interactive` | 4 | Product cards `role="button"` containing buttons | 7.1 |
        | `landmark` | 4 | Nested second `<main>`; non-top-level `<aside>` | 12.6 |
        | `aria-command-name` | 4 | Interactive Leaflet markers without a name | 11.2 |

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

## 3. Fixes applied

The audit mainly served to **isolate the real violations** from the
*needs-review* noise. All were fixed at the root; the re-audit confirms
**0 violation** on the 5 pages, in both light and dark themes.

### :material-numeric-1-circle-outline: Text contrast (RGAA 3.2)

**Real cause**: secondary text uses the `--ink-mute` token, defined in `oklch`
in `frontend/src/styles/tokens.css` (the project does not use Tailwind). In
**dark** theme, `oklch(0.60 …)` came out at **4.39:1** on the panels; and a
heading on the Permits page, in **light** theme, at **2.56:1** (an overly
washed-out `color-mix`).

**Fix**:
```css
/* tokens.css — dark theme: lighten the secondary text */
--ink-mute: oklch(0.70 0.015 85);   /* 4.39:1 → 6.5:1 — AA OK */
```

Plus removal, on the Permits heading, of the
`color-mix(in oklch, var(--bg) 60%, var(--ink))` override: the element falls
back to `--ink-mute`, AA-compliant in both themes.

---

### :material-numeric-2-circle-outline: Nested interactive controls (RGAA 7.1)

Product cards were `role="button"` elements that themselves contained buttons
(favorite, add-to-cart). Reworked using the **stretched-link** pattern: the
card is no longer a button, its title becomes a real link whose `::after`
covers the whole surface, and the buttons remain separately focusable.

---

### :material-numeric-3-circle-outline: Page landmarks (RGAA 12.6)

A nested second `<main>` (catalogue) and a non-top-level `<aside>` (contests),
brought back to plain `<div>`s: one `<main>` per page, consistent landmarks for
screen readers.

---

### :material-numeric-4-circle-outline: Accessible marker names (RGAA 11.2)

The Leaflet markers on the contests map, interactive but anonymous, now carry
the contest name via the `title` / `alt` attributes.

!!! tip "Remaining item — SEO (outside accessibility)"
    Home SEO stays at **83/100**: per-page meta descriptions, JSON-LD structured
    data and a sitemap are the identified levers.

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
*Initial audits run on 2026-05-26 against the local environment (Docker
Compose). Accessibility re-audit after fixes: **0 real violation** (axe
`violations`, all rules) on the 5 pages, in both light and dark themes.
Performance scores vary slightly with network latency and system load —
re-run the script for up-to-date figures before the defence.*
</small>
