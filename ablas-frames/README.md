# ablas frames — Fragments of my reality

A static, fully responsive single-page portfolio site for the photographer
**ablas frames**, built with vanilla HTML / CSS / JS only — no framework,
no npm dependencies, no build step.

## Running locally

The JavaScript is written as **native ES modules** (`<script type="module">`),
which browsers refuse to load from `file://` URLs. You therefore need any
static web server. From the **repository root** (the folder that contains both
`ablas-frames/` and `photographies/`):

```bash
npx serve
# then open http://localhost:3000/ablas-frames/
```

or use the VS Code **Live Server** extension and open `ablas-frames/index.html`.

> Serving from the repository root matters: the images are referenced as
> `../photographies/categories/...` relative to `index.html`, exactly as in
> the original mock-ups.

## Architecture

### CSS — one `<link>` per file

Each stylesheet is linked directly from `index.html` rather than chained with
`@import`. Reason: the browser discovers all files immediately from the HTML
and downloads them in parallel, whereas `@import` creates a sequential
request chain (each file must download before the next is discovered). With
no bundler in the picture, parallel `<link>` tags are the faster and more
debuggable option.

| File | Responsibility |
|---|---|
| `css/base.css` | reset, fonts, shared `:root` tokens, `.wrap` layout, page/reveal primitives, progress bar, starfield |
| `css/themes.css` | day/night theme + the 6 per-frame palettes (light & dark each) |
| `css/navbar.css` | desktop nav + mobile burger & dropdown panel (single DOM, media-query switched) |
| `css/banner.css` | full-screen hero banner, grain/veil |
| `css/home.css` | intro hero, framed-print selection, panoramic frame strips |
| `css/chapter.css` | frame pages: hero, intro, **masonry gallery**, quote, prev/next nav |
| `css/transitions.css` | frame-entry curtain + hero entry animations |
| `css/listing.css` | filter pills + library card grid |
| `css/about.css`, `css/contact.css`, `css/lightbox.css`, `css/footer.css` | one section each |
| `css/responsive.css` | remaining cross-cutting media queries, the "no image hover motion" rule, reduced-motion fallbacks |

### JS — small ES modules, one responsibility each

| File | Responsibility |
|---|---|
| `js/main.js` | entry point, initialises every module |
| `js/config.js` | **data**: frame list, gallery folders / prefixes / photo counts, routable pages |
| `js/router.js` | hash routing (`#home`, `#thailand`…), popstate, nav chip, prev/next links |
| `js/transitions.js` | accent-coloured curtain when entering a frame page |
| `js/theme.js` | day/night toggle, localStorage persistence, nav retint per frame palette |
| `js/menu.js` | mobile dropdown menu |
| `js/gallery.js` | generates masonry `<img>` galleries from `config.js` |
| `js/lightbox.js` | full-screen viewer (keys, buttons, swipe) |
| `js/reveal.js` | scroll-in animations + progress bar |
| `js/starfield.js` | animated background stars/sparkles |
| `js/filters.js` | listing category filters |

### Galleries: masonry, no cropping

Galleries use CSS multi-columns (`columns: 4` → 3 → 2 with viewport width)
and plain `<img>` elements at `width:100%; height:auto`, so **every photo
keeps its native aspect ratio** — panoramas and portraits are never cropped.
`break-inside: avoid` keeps each card whole. Because the layout balances
itself, the old `fillGrid` hack (stretching the last tile) is gone.

### Frame-entry transition

Navigating into a frame (from the home strips, listing cards, or prev/next)
triggers a "darkslide" curtain in the destination frame's accent colour
(`--faccent`): it sweeps up to cover the viewport (~0.4 s), the page swaps
underneath, then it lifts away (~0.45 s) while the chapter hero eases from a
slight zoom and the title/meta stagger in. It is fully generic — the colour
is read from the destination page's palette at runtime. With
`prefers-reduced-motion`, it degrades to the plain page fade. Other page
changes (Home, About, Contact, listing) keep the discreet fade.

## Adding a new frame

1. **`js/config.js`** — add an entry to `FRAMES` (key, page element id,
   label, chip dot colour, gallery `{dir, prefix, count}`). The router,
   chip, galleries and prev/next navigation all derive from this list.
2. **`css/themes.css`** — add two palette rules for the new page id:
   `[data-theme="day"] #page-yourkey {...}` and
   `[data-theme="night"] #page-yourkey {...}` (set `--fdark:1` on dark
   backgrounds so the nav switches to light text).
3. **`index.html`** — duplicate an existing `<section class="page frame-page">`
   block, change its `id` (`page-yourkey`), hero image, texts, and give the
   gallery container `id="gal-yourkey"`. Optionally add a strip on the home
   page and a card in the listing (both navigate via `data-chapter="yourkey"`).
4. **Images** — drop them in `photographies/categories/<dir>/` named
   `<prefix>-1.jpeg` … `<prefix>-N.jpeg`.

## Notes

- Theme choice persists in `localStorage` (`af-theme`); the first visit
  defaults to night between 7 pm and 7 am local time.
- Explicit design rule kept from the mock-ups: **no hover motion on images**
  — only captions and the magnifier appear on hover.
