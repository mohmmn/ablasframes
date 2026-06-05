# Fragments of my reality
### Cahier des charges UI/UX & Direction artistique
**Portfolio éditorial immersif — ablas frames**

*Document de conception produit · v1.0 · 2026*
*Rédaction : direction artistique digitale + UX senior*

---

## 0. Comment lire ce document

Ce cahier des charges formalise une expérience qui existe déjà à l'état de maquette (`index.html`, `style.css`, `styles-refresh.css`, `script.js`, `theme.js`). Il ne repart pas de zéro : il **consolide la vision, fige le design system, et précise écran par écran les règles d'interaction** afin que la maquette devienne un produit cohérent et industrialisable.

Trois niveaux de lecture :
- **Intention** — pourquoi chaque chose existe (à lire par tous).
- **Spécification** — quoi livrer, mesurable (design + dev).
- **Note d'écart** — ⚠️ là où l'existant diverge de la cible, avec la décision recommandée.

> **Principe directeur unique.** Tout arbitrage se tranche par une seule question : *« Est-ce que cela sert le silence et la lecture, ou est-ce que cela attire l'attention sur l'interface ? »* Le site doit s'effacer derrière les images.

---

## 1. Intention créative globale

*Fragments of my reality* n'est pas une galerie photo. C'est un **objet de lecture** — à mi-chemin entre le carnet de voyage, le livre d'art et la galerie contemplative. L'utilisateur ne « parcourt pas un portfolio » : il **traverse une matière**.

### 1.1 Le territoire émotionnel
Quatre mots tiennent la barre : **voyage · rêverie · intemporel · sensoriel**. Si une décision de design ne sert aucun de ces quatre registres, elle est de trop.

| Registre | Ce que ça produit à l'écran |
|---|---|
| Voyage | Chaque chapitre a son climat propre, sa lumière, sa température de couleur. On *change d'air* en changeant de chapitre. |
| Rêverie | Rythme lent. Apparitions progressives. Aucun élément ne « saute aux yeux ». |
| Intemporel | Pas de tendance datée (pas de néon, pas de glassmorphism appuyé, pas de gros gras géométrique). Typographies classiques, beaucoup de blanc. |
| Sensoriel | Grain, texture, profondeur. La lumière est un matériau (halos, poussières fines), jamais un effet. |

### 1.2 Direction artistique
- **Système typographique mixte** : une famille **éditoriale** (corps de texte, lisibilité longue) + une famille **expressive** (titres, signature). → voir §13.2.
- **Micro-animations subtiles uniquement** : `fade-in` progressif, `hover` délicats, transitions douces. *Rien ne clignote, rien ne rebondit.*
- **Lumière fine** : étoiles / poussières lumineuses / paillettes — **présence légère**, jamais décorative au point de distraire. Opacité plafonnée (cf. §12.4).
- **Artisanat marocain, en sous-texte** :
  - **Zellige** → uniquement en *texture de fond* très basse opacité (≤ 0,05) ;
  - **Broderie** → uniquement en *séparateurs* et *détails fins* (filets, fins traits, terminaisons).
  - Règle : on doit *sentir* l'influence sans pouvoir la nommer au premier regard.
- **Esthétique** : premium, silencieuse, contemplative. Forte hiérarchie typographique. Beaucoup d'air.

> ⚠️ **Note d'écart — la lumière.** L'existant prévoit `.sparkle` mais ne l'instancie pas, et le zellige n'est posé que sur les cartes. Cible : zellige en texture de page (très subtil), poussières lumineuses réservées au hero et aux transitions de chapitre. Ailleurs : rien.

---

## 2. Concept structurant — le « livre interactif »

Le site **est un livre que l'on traverse**. Ce n'est pas une métaphore décorative, c'est la grammaire de navigation.

| Notion livre | Traduction produit |
|---|---|
| Chapitre | Unité narrative **autonome et fermée** : on y entre, on l'explore librement, on en sort. |
| Lecture | La navigation = progression. Le scroll = avancée dans l'histoire. |
| Tourner la page | Les transitions inter-écrans donnent la **sensation de page qui se tourne** (fondu narratif + léger zoom), sans rupture brutale. |
| Repères du lecteur | Une **progression de lecture discrète** (barre fine ou points) + un **repère constant du chapitre actif** (teinte de navbar + titre). |

**Décision d'architecture (importante).** L'effet « page qui se tourne » ne doit **jamais** se faire au prix de la performance, de l'accessibilité ou de la lisibilité mobile. On vise donc une *interprétation douce* du flip-book :
- **Recommandé (cible v1)** : transition par **fondu narratif + zoom subtil** (CSS), continuité visuelle assurée par la couleur du chapitre qui « entre » avant le contenu.
- **Optionnel (v2, desktop only)** : effet de page type StPageFlip / Turn.js **sur la seule navigation Homepage → Chapitre**, dégradé proprement (`prefers-reduced-motion`, fallback fondu). À ne pas généraliser au scroll interne.

> ⚠️ **Note d'écart.** L'existant fait un simple `display:none/block` + `fadeIn 0.4s` et un `scrollTo` smooth. C'est un socle correct mais « plat » : il manque (a) le zoom narratif d'entrée de chapitre, (b) la continuité couleur (la navbar doit prendre la teinte du chapitre *pendant* la transition, pas après), (c) l'indicateur de chapitre actif persistant.

---

## 3. Architecture globale

```
Homepage
├─ Hero immersif « Fragments of my reality »
└─ Grille de 3 chapitres (teasers)

Page « Chapitres » (listing global)
├─ Filtres (pills) : Tous · Wildlife · Travel · Portraits · Events
└─ Grille éditoriale (cartes, palette propre conservée)

Chapitre — Thailand on Film   (univers chaud / solaire)
Chapitre — Walking in the Highlands   (univers froid / brumeux)
└─ [extensible : Amsterdam, etc.]

Lightbox (overlay global, contextualisé au chapitre actif)

À propos   (texte seul, minimal)
Contact   (formulaire underline + liens)

Surcouches transverses :
  · Navbar (teintée selon contexte)
  · Toggle Jour / Nuit
  · Indicateur de progression de lecture
```

**Modèle de navigation.** L'existant est une **SPA à sections** (`.page` masquées/affichées en JS, pas de rechargement). On **conserve** ce modèle : il est idéal pour des transitions narratives continues et pour préserver le contexte de la lightbox. On ajoute simplement la gestion de l'historique (URL/`history.pushState`) pour rendre chaque écran *partageable* et *« retour navigateur »-compatible*.

> ⚠️ **Note d'écart.** Aujourd'hui la navigation ne met pas à jour l'URL → pas de partage de chapitre, pas de bouton « précédent ». À spécifier en v1 : `#/`, `#/chapitres`, `#/chapitre/thailand`, etc.

---

## 4. Homepage

### 4.1 Intention
La porte d'entrée doit faire **baisser le rythme cardiaque**. On arrive, on respire, on a envie de lire. Aucune urgence, aucun call-to-action agressif.

### 4.2 Structure (de haut en bas)
1. **Navbar** élégante, fine, sticky (cf. §13.3).
2. **Hero immersif** plein écran partiel (~420 px desktop, ~60 vh mobile) :
   - Sur-titre discret en capitales espacées : `PORTFOLIO`.
   - Titre en typo expressive, italique, léger : **« Fragments of my reality »**.
   - Filet de séparation fin (broderie).
   - Mention catégorie : `PHOTOGRAPHIE`.
   - **Ambiance** : fond sombre profond, **grain léger** + **halo lumineux** lent (poussières). Profondeur, pas de mouvement franc.
   - **CTA scroll** en bas (chevron + « Explorer les chapitres »), discret, qui invite sans presser.
3. **Section « Chapitres récents »** : sur-titre minuscule + **grille de 3 cartes**.

### 4.3 Cartes chapitres (teasers)
Chaque carte porte :
- le **nom** du chapitre (typo expressive) ;
- un **court texte teaser** narratif (1 phrase d'atmosphère) ;
- la **palette propre** au chapitre (le visuel/dégradé adopte les couleurs du chapitre) ;
- un **point de couleur** (badge-dot) = signature chromatique du chapitre ;
- un **bouton « Voir le chapitre »**.

> ⚠️ **Note d'écart — teaser manquant.** Les cartes actuelles n'ont qu'un tag + un nom posés sur l'image. La cible demande **un court texte narratif** par carte et un **bouton explicite « Voir le chapitre »** (l'existant rend la carte entière cliquable, sans bouton visible). À ajouter : libellé bouton + microcopy teaser par chapitre.

### 4.4 Interaction clé — entrée dans un chapitre
> C'est le moment signature du site. À soigner absolument.

Au clic sur **« Voir le chapitre »** :
1. La **navbar prend la teinte du chapitre** immédiatement (continuité chromatique amorcée *avant* le contenu).
2. **Transition** : fondu narratif + **zoom subtil** (1.0 → 1.02) vers l'univers du chapitre ; durée ~600 ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
3. **Aucune rupture** : pas de flash blanc, pas de saut. Le hero du chapitre « se révèle » plutôt qu'il n'« apparaît ».
4. Le scroll revient en haut **en douceur**, l'indicateur de chapitre actif s'allume.

`prefers-reduced-motion: reduce` → on supprime zoom et translation, on conserve un fondu d'opacité court.

---

## 5. Page Chapitre — logique fondamentale

> **Règle UX centrale.** Un chapitre est une **unité narrative fermée** : l'utilisateur y entre, l'explore *librement*, et toute navigation interne (lightbox notamment) reste **bornée au chapitre courant**.

### 5.1 Contenu d'un chapitre (ordre de lecture)
1. **Navbar teintée** selon la palette du chapitre.
2. **Header immersif** : tag + **titre** (typo expressive, italique) + **texte d'introduction** (lead narratif).
3. **Photo principale large** (chapter-hero) = l'image-emblème.
4. **Galerie principale** = cœur de la page (cf. §5.2).
5. **Scroll narratif éditorial** : la galerie peut être ponctuée de respirations (citations, légendes, blocs de texte courts) — transitions douces entre sections.

### 5.2 Galerie — comportement
La galerie n'est **pas** une grille régulière de vignettes. C'est une **grille éditoriale** :
- **composition asymétrique et respirante** (tailles d'images variables, certaines images « pleine largeur ») ;
- **hiérarchie visuelle** : toutes les images ne se valent pas, certaines dominent ;
- de l'**air** entre les blocs.

**Interactions image :**
- **hover** : zoom léger (≤ 1.03) + **glow subtil** (halo à la couleur d'accent du chapitre) + grain lumineux discret ;
- **clic** : ouverture **lightbox** (cf. §6).

> ⚠️ **Note d'écart — grille à reconcevoir.** L'existant utilise un `grid-template-columns: repeat(4,1fr)` avec `aspect-ratio:1` → **galerie standard carrée**, exactement ce que le brief veut éviter. **À refaire** : grille éditoriale asymétrique (ex. `grid-template-columns: repeat(12, 1fr)` avec `span` variables, ou colonnes masonry maîtrisées) + ratios d'image variés (portrait, paysage, panoramique).

---

## 5bis. Identités des deux chapitres

### 🌍 Chapitre 1 — Thailand on Film
- **Ambiance** : chaude, solaire, sensorielle.
- **Couleurs** : navbar `#FAF0CA` · accent principal `#F95738` (terracotta) · accent secondaire `#8D9B30` (olive).
- **UX** : énergie plus vivante, rythme légèrement plus dense, galerie plus expressive (images plus rapprochées, contrastes plus marqués).

### 🌫️ Chapitre 2 — Walking in the Highlands
- **Ambiance** : froide, brumeuse, contemplative.
- **Couleurs** : base `#dde3e7` · accent 1 `#B5BF8C` (vert-gris) · accent 2 `#edd0cc` (rosé brume).
- **UX** : respiration plus lente, images plus espacées, **silence visuel renforcé** (plus de blanc, transitions plus longues).

> Ces deux ambiances doivent être **perceptibles sans lire le texte** : un visiteur doit sentir la chaleur de Thailand et le froid des Highlands rien qu'à l'œil (couleur de navbar, densité de grille, vitesse des animations).

---

## 6. Lightbox (visionneuse)

### 6.1 Design
- **Overlay sombre élégant** (fond `rgba(30,25,20,.95)`), pas noir pur.
- **Image centrée**, généreuse, respirée.
- **Flèches de navigation discrètes**, apparaissant **au hover** (desktop).
- **Bouton fermer minimal** (croix fine en haut à droite).

### 6.2 Interactions
- **Ouverture** : `fade-in` doux + **scale léger** (0.96 → 1).
- **Fermeture** : `fade-out` doux ; clic sur le fond, croix, ou touche `Échap`.
- **Clavier** : ← / → naviguent, `Échap` ferme.
- **Mobile** : **swipe** horizontal supporté (navigation), swipe vertical ou tap hors image pour fermer.

### 6.3 Logique (importante)
- La navigation entre images est **strictement bornée au chapitre courant** (boucle au sein de la galerie active).
- **Retour sans perte de contexte** : à la fermeture, on retrouve la page chapitre exactement à sa position de scroll, sur la bonne image.

> ⚠️ **Note d'écart — légendes & cible mobile.** L'existant gère déjà clic / flèches / Échap / clic-fond et la boucle par galerie : **bon socle**. Manquent : (a) le **swipe mobile**, (b) le **scale d'ouverture** (aujourd'hui seul l'overlay fait un fade), (c) une éventuelle **légende** sous l'image (lieu / pellicule / année) cohérente avec le ton carnet de voyage, (d) restitution exacte de la position de scroll au retour.

---

## 7. Page « Chapitres » (listing global)

### 7.1 Fonction
Explorer **tous** les chapitres d'un seul regard.

### 7.2 UI
- **Filtres en pills** : `Tous · Wildlife · Travel · Portraits · Events`.
- **Grille éditoriale** de cartes.
- Chaque carte **conserve sa palette propre** (la couleur est l'identité du chapitre, même hors contexte).

### 7.3 Interactions
- **Hover narratif** : au survol d'une carte, **un court texte apparaît** (teaser / atmosphère) en surimpression douce.
- **Filtres** : transition fluide entre états (pas de disparition sèche — fondu + léger réagencement). Pill active = pleine couleur d'accent.

> ⚠️ **Note d'écart.** Le filtrage actuel fait `display:block/none` → réagencement brutal. Cible : animer entrée/sortie (opacité + échelle), idéalement avec un réordonnancement fluide (FLIP technique). Et **ajouter le hover narratif** (absent aujourd'hui). Bon point existant : les cartes gardent déjà leur tag coloré.

---

## 8. Page « À propos »

- **Ultra-minimaliste** : **texte centré uniquement**, **aucune image**.
- **Typographie forte** : une phrase-manifeste en grande typo expressive, puis un paragraphe court en typo éditoriale.
- **Beaucoup de vide** autour. Le silence *est* le design.
- **Ton introspectif** : on parle de regard, de lumière, d'instant — pas de CV.

> ⚠️ **Note d'écart.** L'existant inclut une photo dans la maquette de la page « about » alternative — la cible exige **aucune image** ici. La version `index.html` est déjà conforme (texte seul) : c'est elle qui fait foi.

---

## 9. Page Contact

- **Champs « underline only »** : pas de boîte, seul un **filet bas** souligne le champ.
- **Animation focus très subtile** : le filet s'épaissit / change de teinte vers l'accent, sans bordure-boîte ni glow agressif.
- **Bouton simple et discret**.
- **Liens** : Instagram + Email, en bas, fins, alignés.
- **Style** : épuré, éditorial, silencieux.

> ✅ Conforme dans l'existant (`.form-input` underline + focus, `.btn-submit`, footer liens). À préciser : validation inline douce, états d'erreur discrets (filet teinté, pas d'encadré rouge criard), feedback d'envoi sobre.

---

## 10. Mode Jour / Nuit

- **Toggle dans la navbar** (et non un bouton flottant).
- **Transition globale douce** (fond + typo migrent ensemble, ~300 ms).
- **Backgrounds et textes** s'adaptent ; **les identités couleur des chapitres sont conservées** (l'accent terracotta de Thailand reste reconnaissable de nuit, simplement réharmonisé).
- **Aucune rupture brutale**.

> ⚠️ **Note d'écart — deux points à corriger.**
> 1. Le toggle actuel (`theme.js`) est un **bouton flottant emoji** en bas à droite → à **déplacer dans la navbar**, avec une icône fine cohérente (soleil/lune en trait, pas en emoji).
> 2. Le thème est **auto selon l'heure** + non persistant. Cible : **respecter le choix manuel** et le **mémoriser** (`localStorage`), tout en proposant l'auto comme état initial seulement.
> 3. Deux systèmes de variables coexistent (`style.css` vs `styles-refresh.css`). **À fusionner** en une seule source de vérité (cf. §13.1 / §15).

---

## 11. Responsive design

| | Desktop | Mobile |
|---|---|---|
| Expérience | Immersive complète, composition libre, navigation riche | Simplifiée, scroll narratif vertical prioritaire |
| Galerie | Grille éditoriale asymétrique | **Colonne** (1, parfois 2 colonnes), ordre de lecture vertical |
| Navbar | Liens déployés | Condensée (logo + menu / liens essentiels) |
| Lightbox | Flèches au hover, clavier | **Swipe naturel**, plein écran, fermeture par tap/swipe |
| Animations | Complètes | Allégées (le scroll porte déjà la narration) |

**Breakpoints recommandés** : ≤ 768 px (mobile), 769–1100 px (tablette / desktop étroit), > 1100 px (desktop large, conteneur max 1100 px).

> ⚠️ **Note d'écart.** L'existant ne traite le responsive que par un seul `@media(max-width:768px)` réduisant les grilles à 2 colonnes. À renforcer : navbar mobile dédiée, galerie en 1 colonne sur petit écran, lightbox tactile, tailles de titres fluides (`clamp()`).

---

## 12. Animations & micro-interactions

### 12.1 Philosophie
**Lent, élégant, jamais agressif.** Le mouvement révèle, il ne décore pas. *« Matière vivante »* = la page respire (apparitions progressives, halos lents), mais rien ne bouge sans raison narrative.

### 12.2 Catalogue
| Élément | Animation | Détail |
|---|---|---|
| Entrée de page/section | `fade-in` + translation 4–8 px | ~400 ms, `ease` |
| Entrée de chapitre | fondu + zoom 1.0→1.02 | ~600 ms, `cubic-bezier(0.16,1,0.3,1)` |
| Apparition au scroll | `IntersectionObserver` → reveal progressif | seuils échelonnés, jamais simultané |
| Hover carte | scale 1.02–1.03 + ombre douce | 300–400 ms |
| Hover image galerie | zoom ≤1.03 + glow accent | 200–400 ms |
| Lightbox | fade overlay + scale image 0.96→1 | 300 ms |
| Toggle thème | transition fond/texte | 300 ms |
| Pills filtres | fondu + réagencement | FLIP, fluide |

### 12.3 Garde-fous
- **Aucun** mouvement excessif, rebond, parallax violent, autoplay vidéo agressif.
- Tout respecte `prefers-reduced-motion: reduce` (fondu minimal, pas de translation/zoom).
- Durées **lentes** par principe : en cas de doute, ralentir.

### 12.4 Lumière fine (poussières / paillettes)
- Réservée au **hero** et aux **transitions de chapitre**.
- **Opacité plafonnée** (≈ 0,1–0,2 max), mouvement très lent, `pointer-events:none`.
- Désactivée en `reduced-motion`.

---

## 13. Design system

### 13.1 Palettes

**Palette globale (neutres féminins, chauds)**

| Token | Jour | Rôle |
|---|---|---|
| `--bg-primary` | `#FAF8F5` | Fond principal (sable très clair) |
| `--text-dark` | `#2A2420` | Texte principal |
| `--muted` | `#6B5F58` | Texte secondaire |
| `--border-light` | `rgba(0,0,0,.06)` | Filets, séparateurs |
| `--accent` | `#8D9B30` | Accent global (olive) |
| `--accent-light` | `#F95738` | Accent vif (terracotta) |

**Mode nuit (anthracite chaud, accents adoucis)**

| Token | Nuit |
|---|---|
| `--bg-dark` | `#2E2B28` |
| `--text-light` | `#E8E2DC` |
| `--muted-light` | `#C9BDAE` |
| `--accent-dark` | `#D4AF37` (or doux) |
| `--accent-secondary` | `#E07A5F` (terracotta atténué) |
| `--border-dark` | `rgba(255,255,255,.04)` |

**Palettes par chapitre** (identité conservée jour comme nuit)

| Chapitre | base / navbar | accent 1 | accent 2 | dot |
|---|---|---|---|---|
| Thailand | `#FAF0CA` | `#F95738` | `#8D9B30` | `#F95738` |
| Highlands | `#dde3e7` | `#B5BF8C` | `#edd0cc` | `#edd0cc` |

> **Implémentation** : chaque chapitre = une classe `.theme-*` exposant `--theme-bg`, `--theme-accent`, `--theme-accent-2`, `--theme-text`. La navbar et les accents internes lisent ces variables. **Une seule source de tokens** (cf. §15).

### 13.2 Typographies — deux familles contrastées
Le brief demande **une typo expressive + une typo éditoriale**. L'existant en propose deux jeux concurrents ; il faut **trancher**.

| Rôle | Recommandé (cible) | Usage |
|---|---|---|
| **Expressive / titres** | **Cormorant Garamond** (ou *Playfair Display*) | Titres, nom du site, titres de chapitre. Italique léger, graisse 300–400. |
| **Éditoriale / corps** | **DM Sans** (ou *IBM Plex Sans*) | Corps, légendes, navigation, UI. Lisibilité longue. |
| Signature (option) | *Dancing Script* | **À éviter** sauf usage ultra-ponctuel (signature unique) — risque « enfantin » écarté par le client. |

**Recommandation ferme** : **Cormorant Garamond + DM Sans** (couple déjà en place dans `index.html`/`style.css`, plus intemporel et moins « tendance » que Playfair/IBM Plex). *Dancing Script* est écarté du système (le brief et les notes client demandent d'éviter tout effet enfantin).

**Échelle typographique (desktop, fluide via `clamp()`):**

| Style | Taille | Famille | Notes |
|---|---|---|---|
| Hero title | 46 px (clamp 32→46) | expressive | italique, weight 300, `letter-spacing .02em` |
| Page title | 38 px (clamp 28→38) | expressive | italique, weight 300 |
| Chapter name (carte) | 16 px | expressive | weight 400 |
| Sur-titres / tags | 9–11 px | éditoriale | UPPERCASE, `letter-spacing .12–.22em` |
| Corps | 13–14 px | éditoriale | `line-height 1.75–1.85` |
| Légendes | 9–10 px | éditoriale | muted |

### 13.3 Spacing system (l'air est un composant)
Échelle de base **4 px** : `4 · 8 · 12 · 16 · 24 · 28 · 32 · 48 · 64 · 96`.
- Conteneur de lecture : `max-width 1100px` (large), `500px` (texte centré : about/contact).
- Respiration de section : `padding` vertical **48 px** minimum, **64–96 px** sur les pages contemplatives (about, Highlands).
- **Règle d'or** : en cas d'hésitation entre deux valeurs d'espacement, **prendre la plus grande**.

### 13.4 Composants (inventaire & états)

| Composant | États / variantes | Notes clés |
|---|---|---|
| **Navbar** | défaut · teintée chapitre · jour/nuit · mobile condensée | sticky, filet bas fin, contient le toggle thème + l'indicateur de chapitre |
| **Card chapitre (teaser)** | défaut · hover | image palette + nom + teaser + bouton « Voir le chapitre » + dot |
| **Gallery grid** | desktop asymétrique · mobile colonne | items à `span` variables, hover zoom+glow |
| **Pills filtres** | défaut · hover · actif | actif = accent plein ; transition fluide |
| **Buttons** | primaire (`btn-submit`) · texte/CTA (`Voir le chapitre`, `cta-scroll`) | UPPERCASE espacé, radius minimal (2 px) |
| **Lightbox** | fermée · ouverte · nav · mobile swipe | bornée au chapitre, retour sans perte de contexte |
| **Inputs** | défaut · focus · erreur douce | underline only, focus = filet teinté |
| **Séparateurs** | filet · mini-divider (broderie) | fins, décoratifs discrets |
| **Indicateur progression** | barre fine OU points | reflète l'avancée de lecture + chapitre actif |
| **Toggle Jour/Nuit** | jour · nuit | dans la navbar, icône en trait |

### 13.5 Élévation & rayons
- **Rayons** : cartes 6–8 px, images galerie 4 px, boutons 2 px, pills 20 px (pleines), boutons ronds lightbox 50 %.
- **Ombres** : quasi inexistantes ; au plus `0 4px 12px rgba(0,0,0,.07)` au hover de carte. Pas d'ombre portée marquée (contradictoire avec le « silence »).
- **Filets** : 0,5 px, couleur `--border-light`. La finesse fait le premium.

---

## 14. Accessibilité & performance (non négociables)

**Accessibilité**
- Navigation clavier complète (tab order logique, lightbox pilotable au clavier — déjà partiellement en place).
- Focus visibles mais sobres (filet d'accent, pas de halo bleu système brut).
- Contrastes AA minimum pour le texte courant (attention aux textes muted sur fond clair et aux légendes blanches sur image → toujours overlay).
- `alt` descriptifs sur toutes les photos (le ton carnet de voyage s'y prête : lieu, instant).
- `prefers-reduced-motion` respecté partout.
- Lightbox : `role="dialog"`, `aria-modal`, focus piégé, retour du focus sur l'image d'origine à la fermeture.

**Performance** (exigence explicite du client : *« charger le plus vite possible sans perdre de qualité »*)
- Images responsives : `srcset` + `sizes`, formats **AVIF/WebP** avec fallback JPEG.
- **Lazy-loading** des images hors écran (`loading="lazy"`), **eager** sur le hero et la photo principale du chapitre.
- Placeholders **LQIP / blur-up** cohérents avec l'esthétique (le dégradé sert déjà de placeholder dans la maquette).
- Polices : `font-display: swap`, sous-ensembles latins, préchargement des graisses critiques.
- Cible : LCP < 2,5 s, CLS ~0 (réserver les ratios d'image), interactions sans jank.

> **Note.** La maquette simule les photos par des **dégradés CSS**. C'est un excellent système de placeholder/maquette — à conserver comme *fallback* et base LQIP quand les vraies images arriveront.

---

## 15. Dette & travaux de mise à niveau (synthèse des écarts)

Ordre de priorité recommandé pour passer de la maquette à la cible.

**P0 — Fondations**
1. **Fusionner** `style.css` + `styles-refresh.css` en une **source unique de tokens** (aujourd'hui doublons et valeurs divergentes : couple de polices, accent navbar Thailand `#FAF0CA` vs `--accent-light`, etc.).
2. **Choisir le système typographique** (recommandé : Cormorant Garamond + DM Sans) et retirer l'autre.
3. **Toggle thème dans la navbar** + persistance `localStorage` (retirer le bouton flottant emoji de `theme.js`).

**P1 — Cœur d'expérience**
4. **Galerie éditoriale asymétrique** (remplacer la grille carrée 4×).
5. **Transition d'entrée de chapitre** : continuité couleur navbar *avant* contenu + zoom narratif.
6. **Cartes teasers** : ajouter texte narratif + bouton « Voir le chapitre ».
7. **Lightbox** : scale d'ouverture, swipe mobile, légende optionnelle, retour à la position de scroll.

**P2 — Finitions narratives**
8. **Hover narratif** sur la page Chapitres + filtrage animé (FLIP).
9. **Indicateur de progression** + repère de chapitre actif.
10. **Routing/URL** (`history.pushState`) pour partage et bouton retour.
11. **Lumière fine** (poussières hero + transitions), zellige en texture de page, broderie sur séparateurs.

**P3 — Performance & a11y**
12. Pipeline images (`srcset`, AVIF/WebP, LQIP), lazy-loading, `font-display`.
13. Passe accessibilité (dialog lightbox, focus, contrastes, alt).
14. Responsive renforcé (navbar mobile, galerie 1 colonne, `clamp()` typographique).

---

## 16. Critères d'acceptation (definition of done)

Un écran est « fini » quand :
- [ ] Il respecte le **principe directeur** (§0) — rien n'attire l'attention sur l'UI.
- [ ] Les **deux familles typo** et les **tokens couleur** sont les seuls utilisés (aucune valeur en dur orpheline).
- [ ] Toutes les animations sont **douces, lentes**, et neutralisées en `reduced-motion`.
- [ ] L'**identité chromatique du chapitre** est perceptible sans lire le texte, jour **et** nuit.
- [ ] Le **mobile** offre un scroll narratif vertical propre et une lightbox tactile.
- [ ] **Performance** : images optimisées, pas de CLS, LCP maîtrisé.
- [ ] **Accessibilité** : clavier complet, focus sobres, contrastes AA, `alt` présents.
- [ ] Le **contexte est préservé** (retour de lightbox, position de scroll, chapitre actif).

---

*Fin du cahier des charges. Ce document est vivant : chaque arbitrage non tranché ici se résout par le principe directeur du §0 — servir le silence et la lecture.*
