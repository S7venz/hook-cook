---
tags:
  - Audit
  - Accessibilité
  - RGAA
  - Éco-conception
  - Performance
---

# Audits RGAA, performance et éco-conception

!!! abstract "Objectif"
    Mesurer **objectivement** la conformité du site Hook & Cook aux standards
    d'accessibilité (RGAA / WCAG 2.0 AA), de performance Web et d'éco-conception.
    Les audits sont **reproductibles** via le script
    [`audits/run-audits.sh`](https://github.com/S7venz/hook-cook/blob/main/audits/run-audits.sh)
    qui lance Lighthouse + Pa11y sur les 5 pages clés du parcours utilisateur.

## Pages auditées

Les **5 pages les plus représentatives** du parcours visiteur :

| Page | URL | Pourquoi |
| --- | --- | --- |
| Accueil | `/` | Première impression, le plus de visiteurs |
| Boutique | `/boutique` | Page la plus chargée (catalogue produits) |
| Permis | `/permis` | Parcours réglementaire dématérialisé |
| Connexion | `/connexion` | Point d'entrée auth — critique |
| Concours | `/concours` | Page secondaire pour comparaison |

## 1. Synthèse globale

=== ":material-speedometer: Lighthouse"

    | Page | Performance | **Accessibilité** | Bonnes pratiques | SEO |
    | --- | :---: | :---: | :---: | :---: |
    | home       | :material-circle-medium: **57** | :material-check-circle:{ style="color:#4caf50" } 96  | :material-check-circle:{ style="color:#4caf50" } 100 | :material-circle-medium: 83 |
    | boutique   | :material-circle-medium: **60** | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 92 |
    | permis     | :material-circle-medium: **61** | :material-check-circle:{ style="color:#4caf50" } 95  | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 91 |
    | concours   | :material-circle-medium: **64** | :material-check-circle:{ style="color:#4caf50" } 92  | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 92 |
    | connexion  | :material-circle-medium: **69** | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 100 | :material-check-circle:{ style="color:#4caf50" } 91 |

    !!! success "Points forts"
        - **Best practices à 100/100 sur toutes les pages** — pas de mixed content, headers de sécurité corrects, dépendances sans vulnérabilité connue
        - **Accessibilité Lighthouse 92-100** — labels, contraste de base, structure sémantique correcte

    !!! warning "Axes d'amélioration"
        - **Performance 57-69** — code splitting déjà en place, mais le LCP de la home est ralenti par les images hero. Action : passage en `loading="eager"` + preload pour l'image LCP, déjà partiellement fait dans le commit [`8150532`](https://github.com/S7venz/hook-cook/commit/8150532).
        - **SEO home à 83** — il manque une `<meta name="description">` plus riche et le `og:image` n'est pas servi.

=== ":material-wheelchair-accessibility: Pa11y (WCAG 2.0 AA, plus strict)"

    Pa11y / axe-core descend plus profond que Lighthouse et applique le standard
    **WCAG 2.0 niveau AA** (équivalent technique du RGAA 4.1 pour les contenus
    web).

    | Page | Erreurs | Warnings | Notices |
    | --- | :---: | :---: | :---: |
    | home       | :material-alert:{ style="color:#f44336" } **85** | 0 | 0 |
    | boutique   | :material-alert:{ style="color:#f44336" } **61** | 0 | 0 |
    | concours   | :material-alert:{ style="color:#ff9800" } 51 | 0 | 0 |
    | permis     | :material-alert:{ style="color:#ff9800" } 37 | 0 | 0 |
    | connexion  | :material-alert:{ style="color:#ff9800" } 30 | 0 | 0 |

    !!! danger "Top 3 catégories d'erreurs (cumul toutes pages)"
        | Catégorie | Occurrences | Cause | Niveau RGAA |
        | --- | :---: | --- | :---: |
        | `color-contrast` | **245** | Texte gris clair sur fond clair sous le seuil 4.5:1 | 10.3 |
        | `nested-interactive` | 15 | Boutons ou liens imbriqués (card cliquable + bouton favoris) | 7.1 |
        | `aria-command-name` | 4 | Boutons icône-only sans `aria-label` | 11.2 |

=== ":material-leaf: Éco-conception (Ecoindex)"

    Score Ecoindex calculé selon la **formule officielle GreenIT-Analysis** à
    partir du DOM, du nombre de requêtes et du poids transféré (mesurés par
    Lighthouse).

    | Page | DOM | Requêtes | Poids | Score | Grade | gCO₂eq/vue |
    | --- | :---: | :---: | :---: | :---: | :---: | :---: |
    | concours  | 223 | 54 | 1.18 MB | :material-circle-medium:{ style="color:#4caf50" } **85** | :material-alpha-a-circle:{ style="color:#4caf50" } **A** | 1.86 |
    | connexion | 84  | 45 | 0.94 MB | :material-circle-medium:{ style="color:#4caf50" } **85** | :material-alpha-a-circle:{ style="color:#4caf50" } **A** | 1.86 |
    | permis    | 122 | 50 | 0.97 MB | :material-circle-medium:{ style="color:#4caf50" } **85** | :material-alpha-a-circle:{ style="color:#4caf50" } **A** | 1.86 |
    | home      | 515 | 60 | 1.58 MB | :material-circle-medium:{ style="color:#cddc39" } 70 | :material-alpha-b-circle:{ style="color:#cddc39" } B | 1.96 |
    | boutique  | 453 | 58 | 1.79 MB | :material-circle-medium:{ style="color:#cddc39" } 70 | :material-alpha-b-circle:{ style="color:#cddc39" } B | 1.96 |

    !!! success "Note moyenne : 77/100 — Grade A/B"
        80 % des pages auditées sont notées **A**. La boutique et la home,
        plus chargées (catalogue + sliders), sont notées **B** — toujours
        au-dessus de la moyenne du web français qui se situe autour de C/D.

        **Empreinte estimée** : ~1.9 g CO₂eq par vue de page. Pour 100 000
        vues mensuelles, cela représente ~190 kg CO₂eq/mois, soit
        l'équivalent de **1 100 km en voiture thermique**.

## 2. Méthodologie

Outils utilisés :

<div class="grid cards" markdown>

-   :material-google-chrome: &nbsp; **Lighthouse 13.3**

    ---

    Lancé en headless via Brave Browser (Chromium-based). Quatre catégories :
    `performance`, `accessibility`, `best-practices`, `seo`.
    Fenêtre desktop par défaut, throttling Lighthouse standard.

-   :material-shield-check: &nbsp; **Pa11y 9 + axe-core**

    ---

    Standard appliqué : **WCAG2AA**. axe-core est l'engine utilisé par
    Deque pour ses audits commerciaux RGAA, il couvre **~57 %** des
    critères RGAA automatisables.

-   :material-leaf-circle: &nbsp; **Ecoindex**

    ---

    Score recalculé en local à partir des métriques Lighthouse (DOM,
    requêtes, poids), avec la formule officielle GreenIT-Analysis
    ([détail](https://www.ecoindex.fr/comment-ca-marche/)).

-   :material-script-text: &nbsp; **Script reproductible**

    ---

    [`audits/run-audits.sh`](https://github.com/S7venz/hook-cook/blob/main/audits/run-audits.sh)
    relance l'intégralité de la suite en une commande. Idempotent.
    Sortie : HTML + JSON dans `audits/`.

</div>

## 3. Plan d'action priorisé

### :material-numeric-1-circle-outline: Priorité haute — Contraste de couleurs

!!! danger "245 violations sur 5 pages"
    Critère **RGAA 3.2** (contraste des textes) — c'est de loin le défaut le
    plus présent et le plus simple à corriger.

**Cause racine** : la palette du thème utilise du **gris clair `#bdbdbd`** pour
les textes secondaires (sous-titres produit, méta-données, hints de formulaire).
Sur fond blanc, le ratio est de **2.8:1**, en-dessous du seuil WCAG AA (4.5:1).

**Correction proposée** :
```css
/* Avant — frontend tailwind config */
--color-text-muted: #bdbdbd;   /* 2.8:1 — KO */

/* Après */
--color-text-muted: #595959;   /* 7.0:1 — OK AA + AAA */
```

Effort estimé : ~1h (changement variable + revue visuelle).

---

### :material-numeric-2-circle-outline: Priorité moyenne — Performance home

**Cause** : LCP retardé par l'image hero `peche-3000.webp` (~180 KB) chargée
sans preload.

**Correction proposée** :
```html
<!-- frontend/index.html — ajout en <head> -->
<link rel="preload" as="image" href="/img/hero.webp"
      fetchpriority="high" type="image/webp">
```

Gain estimé : ~15 points sur la Performance (LCP -1.2s sur fast 3G).

---

### :material-numeric-3-circle-outline: Priorité basse — Boutons icône-only

**Cause** : 4 boutons (favoris, share, close-modal) n'ont pas de label
accessible. Une lecteur d'écran lit "bouton" sans contexte.

**Correction proposée** :
```jsx
// Avant
<button onClick={toggleFav}><HeartIcon /></button>

// Après
<button onClick={toggleFav} aria-label="Ajouter aux favoris">
  <HeartIcon />
</button>
```

Effort estimé : 30 min.

---

### :material-numeric-4-circle-outline: Priorité basse — SEO home

Ajouts dans `frontend/index.html` :

```html
<meta name="description" content="Hook & Cook — boutique de pêche, permis et concours à Perpignan...">
<meta property="og:title" content="Hook & Cook">
<meta property="og:description" content="...">
<meta property="og:image" content="/img/og-cover.jpg">
```

Effort estimé : 15 min.

## 4. Rapports détaillés (HTML interactifs)

Cliquez pour consulter le rapport Lighthouse complet de chaque page —
graphiques de performance, traces réseau, opportunités détaillées :

<div class="grid cards" markdown>

-   :material-home: &nbsp; **Accueil**

    ---

    [:material-open-in-new: Rapport Lighthouse home](./audits/lighthouse/home.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/home.json){ target="_blank" }

-   :material-cart: &nbsp; **Boutique**

    ---

    [:material-open-in-new: Rapport Lighthouse boutique](./audits/lighthouse/boutique.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/boutique.json){ target="_blank" }

-   :material-file-document: &nbsp; **Permis**

    ---

    [:material-open-in-new: Rapport Lighthouse permis](./audits/lighthouse/permis.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/permis.json){ target="_blank" }

-   :material-login: &nbsp; **Connexion**

    ---

    [:material-open-in-new: Rapport Lighthouse connexion](./audits/lighthouse/connexion.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/connexion.json){ target="_blank" }

-   :material-trophy: &nbsp; **Concours**

    ---

    [:material-open-in-new: Rapport Lighthouse concours](./audits/lighthouse/concours.report.html){ target="_blank" }
    [:material-shield: Pa11y JSON](./audits/pa11y/concours.json){ target="_blank" }

-   :material-database: &nbsp; **Synthèse Ecoindex**

    ---

    [:material-leaf: Données JSON brutes](./audits/ecoindex-summary.json){ target="_blank" }
    Calcul fait à partir des métriques Lighthouse.

</div>

## 5. Re-lancer les audits

```bash
# 1. L'app doit tourner en local
docker compose up -d

# 2. Lancer la suite complète (5 pages × 3 outils ≈ 3 min)
./audits/run-audits.sh

# Variables d'environnement :
#   HC_AUDIT_BASE=http://localhost:5173  (défaut)
#   CHROME_PATH=/path/to/chromium        (auto-détecté)
```

Les rapports HTML/JSON sont écrits dans `audits/`. Pour les publier sur ce
site, copier dans `docs/audits/` et `git push`.

---

<small>
*Audits réalisés le 26/05/2026 sur l'environnement de développement local
(Docker Compose). Les scores varient légèrement selon la latence réseau et
la charge système — relancez le script pour des chiffres à jour avant
soutenance.*
</small>
