#!/usr/bin/env node
/* =============================================================================================
   scan-photos.js — relit les photos du site et réécrit le manifeste DIM dans index.html
   ---------------------------------------------------------------------------------------------
   À LANCER APRÈS TOUT AJOUT / SUPPRESSION / REMPLACEMENT DE PHOTO :

       node tools/scan-photos.js

   Ce que ça fait :
     1. lit la liste des albums dans le `const GAL={…}` d'index.html (dossier, préfixe, ext) ;
     2. parcourt photographies/categories/<dossier>/ et y trouve les <préfixe>-N.<ext>
        (l'extension vaut 'jpeg' sauf si l'album déclare `ext:` — Morocco est en 'webp') ;
     3. lit la largeur/hauteur de chaque photo DIRECTEMENT dans son en-tête, JPEG ou WebP
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

/* le bon lecteur selon l'extension de l'album */
function imageSize(buf, ext) {
  return ext === 'webp' ? webpSize(buf) : jpegSize(buf);
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

    const found = [];
    // La BANNIÈRE de l'album est indexée au n° 0 : elle figure ainsi dans la galerie, en tête.
    // La bannière suit l'EXTENSION DE L'ALBUM, comme ses photos : un album en `ext:'webp'`
    // attend banner.webp. Si le fichier manque, on regarde s'il traîne sous une AUTRE
    // extension — c'est le cas le plus probable (bannière remplacée sans changer le reste)
    // et le message le dit, plutôt que d'annoncer une absence trompeuse.
    const banner = path.join(dir, 'banner.' + a.ext);
    if (fs.existsSync(banner)) {
      const s = imageSize(fs.readFileSync(banner), a.ext);
      if (s) found.push({ n: 0, w: s.w, h: s.h });
      else warnings.push(`dimensions illisibles : ${a.dir}/banner.${a.ext}`);
    } else {
      const autre = fs.existsSync(dir)
        ? fs.readdirSync(dir).find(f => /^banner\.[A-Za-z0-9]+$/i.test(f))
        : null;
      warnings.push(autre
        ? `bannière au mauvais format : ${a.dir}/${autre} — l'album « ${a.key} » est en `
          + `.${a.ext}, le site demandera banner.${a.ext}. Renommez le fichier.`
        : `bannière absente : ${a.dir}/banner.${a.ext}`);
    }

    /* ⚠ L'EXTENSION EST EXIGÉE À L'IDENTIQUE, ET C'EST VOLONTAIRE.
       buildGallery() ne sait construire qu'UNE seule URL par photo : `<préfixe>-N.<ext>`.
       Une extension seulement « équivalente » (.jpg là où l'album est en .jpeg) n'est donc
       jamais demandée par le site. Tolérée ici, elle produisait le pire des cas : la photo
       entrait dans le manifeste — donc une case lui était réservée dans la mosaïque — puis
       son URL en .jpeg renvoyait un 404 et le filet de sécurité de buildGallery retirait la
       vignette. Résultat : le fichier est bien sur le disque, le scan annonce l'avoir compté,
       et RIEN ne s'affiche, sans le moindre message.
       On refuse donc la variante, et surtout on le DIT (voir `proches` plus bas) — un renommage
       en .jpeg suffit à régler le cas. */
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rxOk = new RegExp('^' + escape(a.pre) + '-(\\d+)\\.' + escape(a.ext) + '$', 'i');
    const rxProche = new RegExp('^' + escape(a.pre) + '-(\\d+)\\.([A-Za-z0-9]+)$', 'i');
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(rxOk);
      if (!m) {
        const p = f.match(rxProche);
        if (p) warnings.push(`IGNORÉE — ${a.dir}/${f} : l'album « ${a.key} » est en .${a.ext}, `
          + `le site demandera ${a.pre}-${p[1]}.${a.ext} et ne trouvera rien. Renommez le fichier.`);
        continue;
      }
      const size = imageSize(fs.readFileSync(path.join(dir, f)), a.ext);
      if (!size) { warnings.push(`dimensions illisibles : ${a.dir}/${f}`); continue; }
      found.push({ n: +m[1], w: size.w, h: size.h });
    }
    found.sort((x, y) => x.n - y.n);
    total += found.length;
    if (!found.length) warnings.push(`aucune photo trouvée pour « ${a.key} » (${a.dir}/${a.pre}-N.${a.ext})`);
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
