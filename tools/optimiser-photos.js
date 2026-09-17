#!/usr/bin/env node
/* =============================================================================================
   optimiser-photos.js — met TOUTES les photos du site au même format : WebP, côté court 1080.
   ---------------------------------------------------------------------------------------------
       node tools/optimiser-photos.js            (convertit ce qui doit l'être)
       node tools/optimiser-photos.js --check    (ne touche à rien, dit juste ce qui reste à faire)

   LE FORMAT DE RÉFÉRENCE, c'est l'album « Children of the Coast » : WebP, 1080 px de côté court,
   ~130 Ko la photo. Tout le reste du site s'aligne dessus.

   Les trois règles :

     1. CÔTÉ COURT À 1080 px — le « 1080p » du site. C'est le PLUS PETIT des deux côtés qui est
        ramené à 1080 : une photo verticale finit en 1080 × 1440, une horizontale en 1620 × 1080.
        Les PROPORTIONS ne bougent jamais (aucun recadrage, aucune déformation : sharp calcule
        l'autre côté), et une photo déjà plus petite est laissée telle quelle — on n'agrandit
        jamais, ça ne fait qu'alourdir sans ajouter un seul détail.

     2. QUALITÉ ADAPTATIVE — on encode à 84, et on redescend l'échelle (80, 76, 72, 68, 64) tant
        que le fichier dépasse le budget. Une qualité fixe ne marche pas ici : ces photos sont des
        scans argentiques, et le GRAIN coûte très cher à compresser. À qualité égale, une photo
        douce sort à 90 Ko et une photo granuleuse à 350 Ko. On vise donc un POIDS, pas un chiffre
        de qualité. Le plancher à 64 est là pour que les photos les plus difficiles s'arrêtent un
        peu au-dessus du budget plutôt que de se faire massacrer (vérifié à l'œil : à 64, sur les
        pires cas du site, le grain et la broderie tiennent encore).

     3. LA MEILLEURE SOURCE DISPONIBLE — si les fichiers d'origine d'un album sont encore là
        (voir SOURCES ci-dessous), on repart d'eux plutôt que du JPEG déjà compressé du site :
        même consigne, moins d'artefacts ET un fichier plus léger, parce qu'on ne demande pas à
        WebP de réencoder le bruit de compression du passage précédent.

   Les fichiers remplacés ne sont pas perdus : ils partent dans _originaux/, à l'identique et
   au même endroit dans l'arborescence (dossier ignoré par git, voir .gitignore).

   APRÈS AVOIR LANCÉ CE SCRIPT : `node tools/scan-photos.js`, qui relit les dimensions et
   réécrit le manifeste DIM d'index.js. Sans ça la mosaïque compose avec les anciens ratios.
   ============================================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

let sharp;
try { sharp = require('sharp'); }
catch { console.error("sharp est introuvable. Installez-le : npm i -D sharp"); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const PHOTOS = path.join(ROOT, 'photographies', 'categories');
const RECUP = path.join(ROOT, '_originaux');
const CHECK = process.argv.includes('--check');

/* --- la consigne, en un seul endroit ------------------------------------------------------- */
const COTE_COURT = 1080;          // px — le côté court de toute photo de galerie
const BUDGET_KO = 200;            // au-delà, on redescend d'un cran de qualité
const QUALITES = [84, 80, 76, 72, 68, 64];

/* La bannière d'accueil est le seul cas à part, et pour une raison : elle est en
   `background-size:cover` sur TOUT l'écran, là où une photo de galerie occupe au plus la
   largeur de la colonne (1200 px). À 1080 de large elle serait visiblement molle sur un écran
   de bureau, donc on la juge sur sa LARGEUR (2000 px) avec un budget plus large. */
const BANNIERE = { dossier: 'banner', largeur: 2000, budgetKo: 400 };

/* --- sources de meilleure qualité, quand elles existent encore sur le disque ---------------
   `dossier` : un album de photographies/categories/
   `source`  : le dossier des fichiers d'origine, à la racine du projet
   L'appariement se fait sur le CONTENU de l'image (empreinte 24×32 en niveaux de gris), pas sur
   le nom de fichier : eom-16 vient de 18.jpeg et eom-5 de 16.jpeg, les numéros ne se suivent
   pas. Si le dossier source a disparu, on repart simplement du fichier du site. */
const SOURCES = [
  { dossier: 'portraits/echoes-of-morocco', source: 'maroc bonne qualité' },
];

/* Même idée, mais fichier par fichier, quand la source est un voisin de palier.
   Vide aujourd'hui : la bannière d'accueil venait de banner-1-lumi.jpeg, supprimé au
   nettoyage du 2026-09-17 avec les trois autres variantes du dossier banner/. Il ne reste
   donc plus que le banner-1.webp servi, déjà au format. ⚠ Pour RÉEXPORTER la bannière un
   jour, il faudra repartir de ce WebP 2000 px ou d'un original repris ailleurs — la source
   pleine résolution n'est plus dans le projet (elle est dans l'historique git, au commit
   qui précède le nettoyage). */
const SOURCE_FICHIER = {};

/* Fichiers qu'on laisse strictement tranquilles. Vide aujourd'hui : cette liste protégeait
   les quatre variantes de banner/, qui ne sont plus là. Elle reste en place parce que le
   cas se reposera — deux fichiers de même nom et d'extensions différentes se rejoindraient
   sur le même .webp, et c'est exactement ce que le garde-fou plus bas refuse de faire. */
const IGNORER = new Set([]);

/* --------------------------------------------------------------------------------------------
   Appariement par empreinte : on réduit les deux images à 24×32 en gris et on compare pixel à
   pixel. Une photo et sa version réduite se ressemblent énormément (distance < 8) là où deux
   photos différentes du même album restent loin (> 25) — la marge exigée ci-dessous évite
   d'apparier au hasard deux clichés pris à la suite.                                          */
async function empreinte(f) {
  return sharp(fs.readFileSync(f)).removeAlpha().resize(24, 32, { fit: 'fill' }).greyscale().raw().toBuffer();
}

/* OneDrive peut tenir un fichier une fraction de seconde au moment où on le déplace. On
   réessaie, puis on se rabat sur copier-puis-effacer : dans tous les cas l'original est
   à l'abri dans _originaux/ AVANT que le nouveau fichier ne soit écrit. */
function deplacer(de, vers) {
  for (let essai = 0; essai < 5; essai++) {
    try { fs.renameSync(de, vers); return; }
    catch (e) {
      if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
      const fin = Date.now() + 150; while (Date.now() < fin) { /* petite pause */ }
    }
  }
  fs.copyFileSync(de, vers);
  fs.unlinkSync(de);
}
function distance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s / a.length);
}
async function apparier(fichiersAlbum, dossierSource) {
  const src = [];
  for (const n of fs.readdirSync(dossierSource)) {
    if (!/[.](jpe?g|png|webp)$/i.test(n)) continue;
    src.push([path.join(dossierSource, n), await empreinte(path.join(dossierSource, n))]);
  }
  const map = new Map();
  for (const f of fichiersAlbum) {
    const e = await empreinte(f);
    const cl = src.map(([p, s]) => [p, distance(e, s)]).sort((x, y) => x[1] - y[1]);
    if (cl.length >= 2 && cl[0][1] < 8 && cl[1][1] - cl[0][1] > 4) map.set(f, cl[0][0]);
  }
  return map;
}

/* --- encodage : on descend la qualité jusqu'à tenir dans le budget --------------------------
   On passe à sharp les OCTETS du fichier, jamais son chemin : servi un chemin, libvips garde le
   fichier ouvert le temps de son traitement paresseux, et le renommage qui suit se heurte à un
   EBUSY — d'autant plus vite ici que le dossier est synchronisé par OneDrive.                 */
async function encoder(srcBuf, resize, budgetKo) {
  let dernier = null;
  for (const q of QUALITES) {
    const buf = await sharp(srcBuf).resize(resize).webp({ quality: q, effort: 6, smartSubsample: true }).toBuffer();
    dernier = { buf, q };
    if (buf.length <= budgetKo * 1024) return dernier;
  }
  return dernier;   // plancher de qualité atteint : on garde, même un peu au-dessus du budget
}

function ko(n) { return Math.round(n / 1024); }

/* --- parcours ------------------------------------------------------------------------------ */
function lister(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) lister(p, out);
    else if (/[.](jpe?g|png|webp)$/i.test(e.name)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(PHOTOS, p).split(path.sep).join('/');

(async () => {
  const fichiers = lister(PHOTOS).sort();

  /* sources d'origine, album par album */
  const meilleure = new Map();
  for (const s of SOURCES) {
    const dir = path.join(ROOT, s.source);
    if (!fs.existsSync(dir)) { console.log(`  (pas de dossier « ${s.source} » — album ${s.dossier} repris depuis le site)`); continue; }
    const album = fichiers.filter(f => rel(f).startsWith(s.dossier + '/'));
    const m = await apparier(album, dir);
    for (const [k, v] of m) meilleure.set(k, v);
    console.log(`  ${s.dossier} : ${m.size}/${album.length} photos retrouvées dans « ${s.source} »`);
  }

  let avant = 0, apres = 0, faits = 0, gardes = 0;
  const aFaire = [];

  for (const f of fichiers) {
    const r = rel(f);
    if (IGNORER.has(r)) { avant += fs.statSync(f).size; apres += fs.statSync(f).size; gardes++; continue; }
    const bannière = r.startsWith(BANNIERE.dossier + '/');
    const budgetKo = bannière ? BANNIERE.budgetKo : BUDGET_KO;
    const taille = fs.statSync(f).size;
    const octets = fs.readFileSync(f);
    const meta = await sharp(octets).metadata();
    avant += taille;

    /* Déjà conforme ? on n'y touche pas — c'est ce qui laisse Children of the Coast intact.
       Le critère est le FORMAT et les DIMENSIONS, jamais le poids : une photo granuleuse peut
       finir au-dessus du budget malgré le plancher de qualité, et la revoir à chaque passage
       ne ferait que la recompresser une génération de plus pour trois kilo-octets. Un WebP
       déjà à la bonne taille n'a rien à gagner d'un nouvel encodage — il n'y a plus rien à
       récupérer, seulement à perdre. C'est ce qui rend le script rejouable sans dégât. */
    const court = Math.min(meta.width, meta.height);
    const conforme = meta.format === 'webp'
      && (bannière ? meta.width <= BANNIERE.largeur : court <= COTE_COURT);
    if (conforme) { apres += taille; gardes++; continue; }

    /* garde-fou : une conversion ne doit jamais écraser une AUTRE photo déjà en place
       (deux fichiers de même nom et d'extensions différentes se rejoindraient sur le .webp) */
    const dest = f.replace(/[.][^.]+$/, '.webp');
    if (dest !== f && fs.existsSync(dest)) {
      console.warn(`  ! ${r} ignoré : ${path.basename(dest)} existe déjà (deux photos se disputent le même nom)`);
      apres += taille; gardes++; continue;
    }

    const src = SOURCE_FICHIER[r] ? path.join(ROOT, SOURCE_FICHIER[r]) : (meilleure.get(f) || f);
    const srcBuf = src === f ? octets : fs.readFileSync(src);
    const resize = bannière
      ? { width: BANNIERE.largeur, withoutEnlargement: true }
      : { width: COTE_COURT, height: COTE_COURT, fit: 'outside', withoutEnlargement: true };

    if (CHECK) { aFaire.push(r); apres += taille; continue; }

    const { buf, q } = await encoder(srcBuf, resize, budgetKo);
    const m2 = await sharp(buf).metadata();

    /* garde-fou : les proportions doivent être les mêmes à moins de 0,5 % près
       (le seul écart possible vient de l'arrondi au pixel entier) */
    const rAvant = meta.width / meta.height, rApres = m2.width / m2.height;
    if (Math.abs(rAvant - rApres) / rAvant > 0.005)
      throw new Error(`PROPORTIONS CHANGÉES sur ${r} : ${meta.width}x${meta.height} -> ${m2.width}x${m2.height}`);

    /* l'ancien fichier part dans _originaux/, au même endroit dans l'arborescence */
    const recup = path.join(RECUP, path.relative(PHOTOS, f));
    fs.mkdirSync(path.dirname(recup), { recursive: true });
    deplacer(f, recup);

    fs.writeFileSync(dest, buf);
    apres += buf.length;
    faits++;
    console.log(`  ${r.padEnd(46)} ${meta.width}x${meta.height} ${String(ko(taille)).padStart(5)} Ko`
      + `  ->  ${m2.width}x${m2.height} ${String(ko(buf.length)).padStart(4)} Ko  (q${q})`
      + (src !== f ? '  [depuis l\'original]' : ''));
  }

  console.log('');
  if (CHECK) {
    if (!aFaire.length) { console.log(`Toutes les photos sont déjà au format du site (${gardes} fichiers).`); process.exit(0); }
    console.log(`${aFaire.length} photos à convertir :`);
    for (const r of aFaire) console.log('   ' + r);
    console.log('\nLancez : node tools/optimiser-photos.js');
    process.exit(1);
  }
  console.log(`${faits} photos converties, ${gardes} déjà conformes et laissées telles quelles.`);
  console.log(`photographies/ : ${(avant / 1048576).toFixed(1)} Mo  ->  ${(apres / 1048576).toFixed(1)} Mo`
    + `   (-${Math.round(100 - apres / avant * 100)} %)`);
  if (faits) console.log(`Originaux conservés dans _originaux/.\nPensez maintenant à : node tools/scan-photos.js`);
})();
