#!/usr/bin/env node
/* =============================================================================================
   scan-photos.js — relit les photos du site et réécrit le manifeste DIM dans index.html
   ---------------------------------------------------------------------------------------------
   À LANCER APRÈS TOUT AJOUT / SUPPRESSION / REMPLACEMENT DE PHOTO :

       node tools/scan-photos.js

   Ce que ça fait :
     1. lit la liste des albums dans le `const GAL={…}` d'index.html (dossier, préfixe, ext) ;
     2. parcourt photographies/categories/<dossier>/ et y prend TOUTES les <préfixe>-N.*,
        quelle que soit l'extension (.jpeg, .jpg, .webp, .png) — celle de chaque fichier est
        inscrite dans le manifeste quand elle diffère du défaut `ext:` de l'album ;
     3. lit la largeur/hauteur de chaque photo DIRECTEMENT dans son en-tête, JPEG, WebP ou PNG
        (aucune dépendance à installer) ;
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

/* --- dimensions d'un WebP, lues dans son en-tête ------------------------------------------
   Conteneur RIFF : 'RIFF' (4o) + taille (4o) + 'WEBP' (4o), puis le premier chunk dit dans
   QUELLE variante le fichier est écrit — et chacune range ses dimensions ailleurs :
     VP8X (étendu, celui produit par la plupart des exports) : largeur-1 et hauteur-1 sur
           3 octets petit-boutiste, aux offsets 24 et 27 ;
     VP8  (avec perte)     : après le code de synchro 9D 01 2A, deux entiers 14 bits ;
     VP8L (sans perte)     : après la signature 2F, 14 bits de largeur-1 puis 14 de hauteur-1.
   Les trois sont traitées : un album peut mélanger des exports d'origines différentes. */
function webpSize(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
  if (chunk === 'VP8 ') {
    if (buf[23] !== 0x9D || buf[24] !== 0x01 || buf[25] !== 0x2A) return null;
    return { w: buf.readUInt16LE(26) & 0x3FFF, h: buf.readUInt16LE(28) & 0x3FFF };
  }
  if (chunk === 'VP8L') {
    if (buf[20] !== 0x2F) return null;
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3FFF) + 1, h: ((b >>> 14) & 0x3FFF) + 1 };
  }
  return null;
}

/* --- dimensions d'un PNG : les 8 octets de l'en-tête IHDR, toujours au même endroit ------- */
function pngSize(buf) {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504E47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/* Le bon lecteur selon l'extension DU FICHIER — pas celle de l'album.
   C'est le pivot de tout ce qui suit : un album peut contenir des .jpeg, des .jpg et des .webp
   côte à côte, chacun est mesuré avec le lecteur qui convient. */
const LECTEURS = { jpeg: jpegSize, jpg: jpegSize, webp: webpSize, png: pngSize };
const EXTENSIONS = Object.keys(LECTEURS);
function imageSize(buf, ext) {
  const f = LECTEURS[String(ext).toLowerCase()];
  return f ? f(buf) : null;
}

/* --- albums déclarés dans index.html ------------------------------------------------------
   Chaque album est découpé d'abord en BLOC `clé:{…}`, puis ses champs sont relus un par un :
   l'ancienne expression rationnelle exigeait l'ordre exact `dir` puis `pre` collés l'un à
   l'autre, et un champ intercalé (c'est le cas d'`ext`) suffisait à faire disparaître
   silencieusement l'album du manifeste. */
function readAlbums(src) {
  const block = src.match(/const GAL=\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("Bloc `const GAL={…}` introuvable dans index.html");
  const albums = [];
  const re = /(\w+):\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(block[1]))) {
    const body = m[2];
    const champ = (k) => {
      const x = body.match(new RegExp(k + ":'([^']+)'"));
      return x ? x[1] : null;
    };
    const dir = champ('dir'), pre = champ('pre');
    if (!dir || !pre) continue;
    albums.push({ key: m[1], dir, pre, ext: champ('ext') || 'jpeg' });
  }
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

    /* ⚠ C'EST LE DISQUE QUI DÉCIDE, PLUS `ext`.
       Toute photo `<préfixe>-N.<quelque chose de connu>` est prise, quelle que soit son
       extension, et CELLE-CI EST INSCRITE DANS LE MANIFESTE quand elle diffère du défaut de
       l'album. Un dossier peut donc mélanger .jpeg, .jpg, .webp et .png sans rien casser.

       AVANT, l'extension devait correspondre exactement à `ext`, et c'était la panne la plus
       vicieuse du site : une photo exportée en .jpg dans un album en .jpeg n'était jamais
       affichée. Le fichier était bien là, mais le site ne demandait que le .jpeg — 404 — et le
       filet de sécurité de buildGallery retirait la vignette sans un mot.
       `ext` sur l'album n'est plus qu'un DÉFAUT d'écriture : il évite de répéter la même
       extension sur chaque entrée du manifeste. Il ne filtre plus rien. */
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const groupeExt = '(' + EXTENSIONS.join('|') + ')';

    const found = [];
    // La BANNIÈRE de l'album est indexée au n° 0 : elle figure ainsi dans la galerie, en tête.
    // Elle suit exactement la même règle : n'importe quelle extension connue est acceptée.
    const rxBanner = new RegExp('^banner\\.' + groupeExt + '$', 'i');
    const banner = fs.readdirSync(dir).find(f => rxBanner.test(f));
    if (banner) {
      const ext = path.extname(banner).slice(1).toLowerCase();
      const s = imageSize(fs.readFileSync(path.join(dir, banner)), ext);
      if (s) found.push({ n: 0, w: s.w, h: s.h, ext });
      else warnings.push(`dimensions illisibles : ${a.dir}/${banner}`);
    } else warnings.push(`bannière absente : ${a.dir}/banner.${a.ext}`);

    const rxPhoto = new RegExp('^' + escape(a.pre) + '-(\\d+)\\.' + groupeExt + '$', 'i');
    const vus = new Map();
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(rxPhoto);
      if (!m) continue;
      const n = +m[1], ext = m[2].toLowerCase();
      // Deux fichiers pour le même numéro (photo-3.jpg ET photo-3.jpeg) : un seul peut être
      // affiché. On garde celui qui correspond au défaut de l'album et on signale l'autre,
      // sinon le choix dépendrait de l'ordre de lecture du dossier — donc du système.
      if (vus.has(n)) {
        const garde = vus.get(n).ext === a.ext ? vus.get(n).f : f;
        warnings.push(`DOUBLON n°${n} dans ${a.dir} : ${vus.get(n).f} et ${f} — `
          + `« ${garde} » est retenu, supprimez l'autre.`);
        if (garde !== f) continue;
      }
      const size = imageSize(fs.readFileSync(path.join(dir, f)), ext);
      if (!size) { warnings.push(`dimensions illisibles : ${a.dir}/${f}`); continue; }
      vus.set(n, { f, ext });
      const i = found.findIndex(p => p.n === n);
      const entree = { n, w: size.w, h: size.h, ext };
      if (i >= 0) found[i] = entree; else found.push(entree);
    }
    found.sort((x, y) => x.n - y.n);
    total += found.length;
    if (!found.length) warnings.push(`aucune photo trouvée pour « ${a.key} » (${a.dir}/${a.pre}-N.${a.ext})`);
    /* Format d'une entrée : `N:[largeur,hauteur]` — et `N:[largeur,hauteur,"ext"]` quand
       l'extension du fichier n'est PAS celle par défaut de l'album. Le manifeste reste donc
       aussi court qu'avant dans le cas courant, tout en portant l'information là où elle
       compte. C'est buildGallery qui la relit (`dim[i][2] || ext par défaut`). */
    lines.push(`${a.key}:{${found
      .map(p => `${p.n}:[${p.w},${p.h}${p.ext === a.ext ? '' : `,"${p.ext}"`}]`)
      .join(',')}},`);
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
