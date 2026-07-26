#!/usr/bin/env node
/* =============================================================================================
   scan-photos.js — relit les photos du site et réécrit le manifeste DIM dans index.html
   ---------------------------------------------------------------------------------------------
   À LANCER APRÈS TOUT AJOUT / SUPPRESSION / REMPLACEMENT DE PHOTO :

       node tools/scan-photos.js

   Ce que ça fait :
     1. lit la liste des albums dans le `const GAL={…}` d'index.html (dossier + préfixe) ;
     2. parcourt photographies/categories/<dossier>/ et y trouve les <préfixe>-N.jpeg ;
     3. lit la largeur/hauteur de chaque photo DIRECTEMENT dans l'en-tête JPEG (aucune
        dépendance à installer) ;
     4. réécrit le bloc entre les marqueurs PHOTO-DIM-START / PHOTO-DIM-END.

   Pourquoi : la mosaïque a besoin du rapport largeur/hauteur pour composer ses rangées. Fourni
   d'avance, l'agencement est exact dès le premier rendu — sinon la galerie se réagence au fur et
   à mesure que les photos arrivent (l'effet « ça se range tout seul » constaté sur mobile).

   Option --check : ne réécrit rien, signale seulement que le manifeste est périmé
   (sortie 1 si c'est le cas) — pratique avant un déploiement.
   ============================================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const PHOTOS = path.join(ROOT, 'photographies', 'categories');
const START = '/* >>> PHOTO-DIM-START <<< */';
const END = '/* >>> PHOTO-DIM-END <<< */';
const CHECK = process.argv.includes('--check');

/* --- dimensions d'un JPEG, lues dans son en-tête ------------------------------------------
   On avance de segment en segment jusqu'au marqueur SOFn (0xFFC0–0xFFCF, hors C4/C8/CC) qui
   porte la hauteur puis la largeur. Seuls les premiers Ko du fichier sont réellement utiles. */
function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;   // pas un JPEG
  let o = 2;
  while (o + 9 < buf.length) {
    if (buf[o] !== 0xFF) { o++; continue; }                 // resynchronisation
    const m = buf[o + 1];
    if (m === 0xFF) { o++; continue; }                      // octets de bourrage
    if (m === 0x01 || (m >= 0xD0 && m <= 0xD9)) { o += 2; continue; }  // marqueurs sans charge utile
    const len = buf.readUInt16BE(o + 2);
    if (len < 2) return null;
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { w: buf.readUInt16BE(o + 7), h: buf.readUInt16BE(o + 5) };
    }
    o += 2 + len;
  }
  return null;
}

/* --- albums déclarés dans index.html ------------------------------------------------------ */
function readAlbums(src) {
  const block = src.match(/const GAL=\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("Bloc `const GAL={…}` introuvable dans index.html");
  const albums = [];
  const re = /(\w+):\{dir:'([^']+)',pre:'([^']+)'/g;
  let m;
  while ((m = re.exec(block[1]))) albums.push({ key: m[1], dir: m[2], pre: m[3] });
  if (!albums.length) throw new Error('Aucun album reconnu dans le bloc GAL');
  return albums;
}

/* --- construction du manifeste ------------------------------------------------------------ */
function buildManifest(albums) {
  const lines = [];
  let total = 0;
  const warnings = [];

  for (const a of albums) {
    const dir = path.join(PHOTOS, a.dir.split('/').join(path.sep));
    if (!fs.existsSync(dir)) { warnings.push(`dossier absent : ${a.dir}`); continue; }

    const found = [];
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(new RegExp('^' + a.pre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-(\\d+)\\.jpe?g$', 'i'));
      if (!m) continue;
      const size = jpegSize(fs.readFileSync(path.join(dir, f)));
      if (!size) { warnings.push(`dimensions illisibles : ${a.dir}/${f}`); continue; }
      found.push({ n: +m[1], w: size.w, h: size.h });
    }
    found.sort((x, y) => x.n - y.n);
    total += found.length;
    if (!found.length) warnings.push(`aucune photo trouvée pour « ${a.key} » (${a.dir}/${a.pre}-N.jpeg)`);
    lines.push(`${a.key}:{${found.map(p => `${p.n}:[${p.w},${p.h}]`).join(',')}},`);
  }
  return { text: 'const DIM={\n' + lines.map(l => '  ' + l).join('\n') + '\n};', total, warnings };
}

/* --- écriture ----------------------------------------------------------------------------- */
const src = fs.readFileSync(INDEX, 'utf8');
const i0 = src.indexOf(START), i1 = src.indexOf(END);
if (i0 < 0 || i1 < 0) { console.error('Marqueurs PHOTO-DIM-START / PHOTO-DIM-END introuvables dans index.html'); process.exit(2); }

const { text, total, warnings } = buildManifest(readAlbums(src));
const next = src.slice(0, i0 + START.length) + '\n' + text + '\n' + src.slice(i1);

for (const w of warnings) console.warn('  ! ' + w);

if (next === src) {
  console.log(`Manifeste déjà à jour — ${total} photos.`);
  process.exit(0);
}
if (CHECK) {
  console.error(`Manifeste PÉRIMÉ (${total} photos sur le disque). Lancez : node tools/scan-photos.js`);
  process.exit(1);
}
fs.writeFileSync(INDEX, next);
console.log(`index.html mis à jour — ${total} photos indexées.`);
