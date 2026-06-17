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

=== ":material-wheelchair-accessibility: Pa11y (WCAG AA, plus strict)"

    Pa11y / axe-core descend plus profond que Lighthouse et applique le standard
    **WCAG niveau AA** (équivalent technique du RGAA 4.1 pour le web). Attention
    à la lecture de son décompte, qui mélange deux familles :

    - les **violations** réellement mesurées (axe `violations`) ;
    - les items **à vérifier manuellement** (axe `incomplete`, que Pa11y affiche
      tout de même comme « Error ») : texte sur image produit, sur dégradé ou
      sous la texture de fond en `mix-blend-mode`, et couleurs `oklch()` /
      `color-mix()` qu'axe-core ne sait pas interpréter. **Ce ne sont pas des
      échecs mesurés.**

    | Page | Violations réelles | À vérifier (needs-review) |
    | --- | :---: | :---: |
    | home       | :material-check-circle:{ style="color:#4caf50" } **0** | ~53 |
    | boutique   | :material-check-circle:{ style="color:#4caf50" } **0** | ~47 |
    | concours   | :material-check-circle:{ style="color:#4caf50" } **0** | ~44 |
    | permis     | :material-check-circle:{ style="color:#4caf50" } **0** | ~34 |
    | connexion  | :material-check-circle:{ style="color:#4caf50" } **0** | ~27 |

    !!! success "0 violation réelle, en thème clair comme sombre"
        Après les corrections décrites plus bas, un ré-audit toutes règles
        (axe `violations`) ne relève **aucune** violation sur les 5 pages, dans
        les deux thèmes. Les items restants sont des *needs-review* inhérents
        aux pages riches en images, à confirmer visuellement.

    !!! note "Ce que l'audit avait réellement détecté — et qui est corrigé"
        | Catégorie | Détail | Cause réelle | RGAA |
        | --- | :---: | --- | :---: |
        | `color-contrast` | 1 token + 1 override | `--ink-mute` (oklch) trop sombre en thème sombre (4,39:1) ; intitulé Permis délavé en clair (2,56:1) | 3.2 |
        | `nested-interactive` | 4 | Cartes produit `role="button"` contenant des boutons | 7.1 |
        | `landmark` | 4 | Second `<main>` imbriqué ; `<aside>` non racine | 12.6 |
        | `aria-command-name` | 4 | Marqueurs Leaflet interactifs sans nom | 11.2 |

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

## 3. Corrections appliquées

L'audit a surtout servi à **isoler les vraies violations** du bruit
*needs-review*. Toutes ont été corrigées à la racine ; le ré-audit confirme
**0 violation** sur les 5 pages, en thème clair comme sombre.

### :material-numeric-1-circle-outline: Contraste des textes (RGAA 3.2)

**Cause réelle** : le texte secondaire utilise le token `--ink-mute`, défini en
`oklch` dans `frontend/src/styles/tokens.css` (le projet n'utilise pas Tailwind).
En thème **sombre**, `oklch(0.60 …)` ressortait à **4,39:1** sur les encarts ; et
un intitulé de la page Permis, en thème **clair**, à **2,56:1** (un `color-mix`
trop délavé).

**Correction** :
```css
/* tokens.css — thème sombre : on éclaircit le texte secondaire */
--ink-mute: oklch(0.70 0.015 85);   /* 4,39:1 → 6,5:1 — AA OK */
```

Et suppression, sur l'intitulé Permis, de l'override
`color-mix(in oklch, var(--bg) 60%, var(--ink))` : l'élément reprend `--ink-mute`,
conforme AA dans les deux thèmes.

---

### :material-numeric-2-circle-outline: Contrôles interactifs imbriqués (RGAA 7.1)

Les cartes produit étaient des `role="button"` contenant elles-mêmes des boutons
(favori, ajout au panier). Refonte selon le motif du **lien étiré** : la carte
n'est plus un bouton, son titre devient un vrai lien dont un `::after` couvre
toute la surface, et les boutons restent focusables séparément.

---

### :material-numeric-3-circle-outline: Repères de page — landmarks (RGAA 12.6)

Un second `<main>` imbriqué (catalogue) et un `<aside>` non racine (concours),
ramenés à de simples `<div>` : un seul `<main>` par page, repères cohérents pour
les lecteurs d'écran.

---

### :material-numeric-4-circle-outline: Nom accessible des marqueurs (RGAA 11.2)

Les marqueurs Leaflet de la carte des concours, interactifs mais anonymes,
portent désormais le nom du concours via les attributs `title` / `alt`.

!!! tip "Axe restant — SEO (hors accessibilité)"
    Le SEO de la home reste à **83/100** : meta-descriptions par page, données
    structurées JSON-LD et plan de site sont les leviers identifiés.

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
*Audits initiaux réalisés le 26/05/2026 sur l'environnement local (Docker
Compose). Ré-audit accessibilité après corrections : **0 violation réelle**
(axe `violations`, toutes règles) sur les 5 pages, en thème clair et sombre.
Les scores de performance varient légèrement selon la latence réseau et la
charge système — relancez le script pour des chiffres à jour avant soutenance.*
</small>
