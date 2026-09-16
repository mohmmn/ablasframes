/* ============================================================
   index.js — tout le comportement du site.
   Extrait tel quel du <script> qui vivait en bas d'index.html :
   aucune ligne n'a été modifiée, seulement déplacée.
   Appelé par <script src="index.js"></script> juste avant </body>,
   à la MÊME place que l'ancien bloc : le DOM est donc déjà là quand
   le fichier s'exécute, exactement comme avant.
   ============================================================ */

/* [A4] active le blur-up des photos de galerie (voir CSS .blur-up).
   Posé tout en haut du script : si le JS ne s'exécute pas, les photos restent visibles. */
document.documentElement.classList.add('blur-up');

/* (starfield retiré) */

(function(){const d=document.getElementById('discover');if(d)d.addEventListener('click',()=>document.getElementById('home-hero').scrollIntoView({behavior:'smooth'}));})();

/* ===================== GALERIES (génération auto · toutes les photos · sans vide) ===================== */
/* ---- ALBUMS : où trouver les photos ----
   `order` (facultatif) impose l'ordre d'affichage ; sans lui, les photos sortent par n° croissant.
   Le n° 0 désigne la BANNIÈRE de l'album (banner.<ext>) : elle ouvre donc la galerie.
   Toute photo absente de `order` est simplement ajoutée à la suite — ajouter un fichier ne
   casse jamais l'affichage, même sans toucher à cette liste.

   `ext` (facultatif, 'jpeg' par défaut) donne l'EXTENSION des photos de l'album — c'est ce qui
   permet à un album d'être en WebP pendant que les autres restent en JPEG.
   ⚠ ELLE VAUT POUR TOUT L'ALBUM, BANNIÈRE COMPRISE : un album en `ext:'webp'` attend
   `banner.webp`, pas `banner.jpeg`. Un album ne se mélange pas — c'est ce qui permet à
   buildGallery de composer chaque URL sans avoir à deviner, et au scanner de signaler net un
   fichier resté dans l'ancien format au lieu de le laisser disparaître en silence.
   Après avoir touché à `ext`, relancer `node tools/scan-photos.js`. */
const GAL={
  thailand:{dir:'travel/thailand',pre:'thai',label:'Thailand'},
  // Bali n'a plus de liste `order`, et c'est un choix de rangement : l'alternance
  // paysage / portrait qu'elle imposait (les 6 photos horizontales étaient toutes en tête,
  // ce qui donnait un gros bloc avant tout le reste) est maintenant INSCRITE DANS LES NOMS —
  // bali-1, bali-2, bali-3… se suivent déjà dans le bon ordre. L'ordre du dossier et l'ordre
  // du site sont donc le même, ce qui n'était pas le cas tant que la liste les faisait
  // diverger. Pour réordonner : renommer les fichiers, puis `node tools/scan-photos.js`.
  bali:{dir:'travel/bali',pre:'bali',label:'Bali'},
  hydepark:{dir:'travel/hyde-park-nostalgia',pre:'hpn',label:'Hyde Park Nostalgia'},
  nightmarkets:{dir:'travel/night-markets',pre:'nightmarkets',label:'Night Markets'},
  morocco:{dir:'portraits/echoes-of-morocco',pre:'eom',ext:'webp',label:'Echoes of Morocco'},
  coast:{dir:'portraits/children-of-the-coast',pre:'cotc',ext:'webp',label:'Children of the Coast'},
  wildlife:{dir:'wildlife',pre:'wild',label:'Wildlife'},
  scotland:{dir:'travel/scotland',pre:'scotland',label:'Scotland'},
  muaythai:{dir:'sports/muay-thai',pre:'mt',label:'Muay Thai'},
};

/* ---- DIMENSIONS RÉELLES DE CHAQUE PHOTO ----------------------------------------------------
   La mosaïque a besoin du RATIO de chaque photo pour se composer. S'il n'est connu qu'une fois
   l'image téléchargée, la galerie se dessine « au jugé » puis se réagence à chaque arrivée de
   photo — d'où l'impression, sur mobile, qu'il faut attendre que ça se range.
   Les vraies largeur/hauteur sont donc fournies ICI, en amont : la mise en page est exacte dès
   le tout premier rendu, avant le moindre octet d'image.

   Format : album:{ n° de photo:[largeur,hauteur], … }
   Un numéro ABSENT = photo inexistante : aucune case n'est réservée pour elle.

   ⚠ BLOC GÉNÉRÉ — ne pas éditer à la main.
   Après tout ajout / suppression / remplacement de photo, régénérer avec :
       node tools/scan-photos.js
   (le script relit les fichiers du dossier photographies/ et réécrit ce bloc tout seul)         */
/* >>> PHOTO-DIM-START <<< */
const DIM={
  thailand:{0:[1600,1066],1:[1066,1600],2:[1066,1600],3:[1600,1066],4:[1066,1600],5:[1066,1600],6:[1066,1600],7:[1066,1600],8:[1066,1600],9:[1066,1600],10:[1066,1600],11:[1066,1600],12:[1600,1066,"jpg"],13:[1600,1066],14:[1066,1600],15:[1066,1600],16:[1066,1600],17:[1066,1600],18:[1600,1066],19:[1066,1600],20:[1600,1066],21:[1066,1600],22:[1066,1600],23:[1066,1600],24:[1600,1066],25:[1600,1066],26:[1066,1600],27:[1066,1600],28:[1600,1066,"jpg"]},
  bali:{0:[1600,1066],1:[1600,1066],2:[1066,1600],3:[1066,1600],4:[1066,1600],5:[1200,1600],6:[1066,1600],7:[1600,1066],8:[1600,1066],9:[1200,1600],10:[1600,1068],11:[1600,1066],12:[1600,1066],13:[1066,1600],14:[1600,1066],15:[1600,1066,"jpg"],16:[1066,1600],17:[1600,1066]},
  hydepark:{0:[1066,1600],1:[1066,1600],2:[1066,1600],3:[1066,1600],4:[1066,1600],5:[1066,1600]},
  nightmarkets:{0:[1600,1066],1:[1600,1066],2:[1600,1066]},
  morocco:{0:[1865,2797],1:[1904,2856],2:[1904,2856],3:[1904,2856],4:[1832,2747],5:[1868,2802],6:[1904,2856],7:[1904,2856],8:[1847,2770],9:[1904,2856],10:[1904,2856],11:[1904,2856],12:[1904,2856],13:[1904,2856],14:[1904,2856],15:[1904,2856],16:[1904,2856],17:[1904,2856]},
  coast:{0:[1080,1440],1:[1080,1440],2:[1080,1440],3:[1080,1440],4:[1080,1440],5:[1080,1440],6:[1080,1440],7:[1080,1440],8:[1080,1440],9:[1080,1440],10:[1080,1620],11:[1080,1440],12:[1080,1441],13:[1080,1440],14:[1080,1440]},
  wildlife:{0:[1066,1600],1:[1066,1600],2:[1600,1066],3:[1066,1600],4:[1066,1600],5:[1066,1600],6:[1066,1600],7:[1066,1600]},
  scotland:{0:[1066,1600],1:[1066,1600],2:[1200,1600],3:[1066,1600],4:[1200,1600],5:[1066,1600],6:[1066,1600],7:[1200,1600],8:[3413,5120]},
  muaythai:{0:[1066,1600],1:[1066,1600],2:[1600,1066],3:[1066,1600],4:[1066,1600],5:[1066,1600],6:[1600,1066]},
};
/* >>> PHOTO-DIM-END <<< */

/* Chaque image devient une <img> réelle, dont les proportions sont connues d'avance (DIM),
   puis on dispose la galerie en « mosaïque justifiée » (rangées de même hauteur,
   pleine largeur, sans recadrage). */
function ratioOf(fig){return fig._ratio||1.5;}
function justify(gallery){
  if(!gallery)return;
  const items=[...gallery.children].filter(el=>el.classList&&el.classList.contains('gitem'));
  if(!items.length)return;
  // ⚠ MESURER AVEC clientWidth, JAMAIS AVEC getBoundingClientRect().
  //
  // À l'ouverture d'une frame, la page joue `frameIn` (voir CSS), qui part de
  // `transform:scale(1.045)` pendant 850ms. Or getBoundingClientRect() renvoie la taille
  // VISUELLE, donc AGRANDIE DE 4,5% tant que l'animation tourne : on mesurait 403px au lieu
  // de 386px sur iPhone. La mosaïque était donc calculée trop large, les rangées débordaient,
  // et le navigateur renvoyait des photos à la ligne (rangées 2+3 rendues en 1+2+2).
  // Puis, l'animation finie, le premier recalcul (scroll, rotation…) retrouvait la vraie
  // largeur et tout se remettait en place — d'où l'effet « ça se range après quelques secondes ».
  // clientWidth est une valeur de MISE EN PAGE : les transformations ne l'affectent pas.
  //
  // SAFE : clientWidth arrondit au pixel le PLUS PROCHE, donc peut MAJORER de 0,5px (une largeur
  // réelle de 327,6px est lue 328px). Sans marge, une rangée remplie pile à la largeur lue
  // déborde et la dernière photo repart à la ligne. 2px garantissent au moins 1,5px de jeu réel
  // quel que soit l'arrondi — imperceptible à l'œil (0,5% de la largeur), mais le débordement
  // devient impossible.
  const SAFE=2;
  const W=gallery.clientWidth-SAFE;
  if(W<=1)return;                              // page masquée : on réessaiera à l'affichage
  const gap=parseFloat(getComputedStyle(gallery).gap)||10;
  // hauteur de rangée cible + nb max d'images par rangée, selon la largeur (mobile → images plus grandes)
  let target,maxN;
  if(W<480){target=Math.min(Math.round(W*0.78),300);maxN=2;}
  else if(W<760){target=225;maxN=3;}
  else if(W<1100){target=238;maxN=6;}
  else{target=252;maxN=8;}
  items.forEach(it=>{it.style.width='';it.style.height='';it.style.flex='';}); // reset
  // 1) découpe en rangées : on remplit jusqu'à la hauteur cible OU le nb max d'images
  const rows=[]; let row=[],sum=0;
  items.forEach(it=>{
    row.push(it);sum+=ratioOf(it);
    if(row.length>=maxN || (W-gap*(row.length-1))/sum<=target){rows.push({items:row,sum});row=[];sum=0;}
  });
  let partial=row.length?{items:row,sum}:null; // dernière rangée incomplète (le cas échéant)
  // 2) une rangée occupe TOUJOURS exactement la largeur disponible : largeurs ∝ ratio, et la
  //    dernière image absorbe le reste des arrondis → bord droit net, jamais de vide.
  const layout=(r,h)=>{
    const n=r.items.length, gaps=gap*(n-1), avail=W-gaps;
    let used=0;
    r.items.forEach((it,i)=>{
      it.style.flex='0 0 auto';
      it.style.height=Math.round(h)+'px';
      if(i===n-1){it.style.width=(avail-used)+'px';}      // reste exact = aucun pixel perdu
      else{const w=Math.max(1,Math.floor(avail*ratioOf(it)/r.sum));it.style.width=w+'px';used+=w;}
    });
  };
  // 2b) une dernière rangée d'UNE seule photo serait étirée sur toute la largeur en un bandeau
  //     panoramique (recadrage excessif — ex. Scotland, 8 photos = rangée de 7 + 1). On la fusionne
  //     alors avec la rangée pleine précédente, qui se redistribue sur toute la largeur avec une image
  //     de plus (un peu plus petites) → aucun vide à droite ET aucun bandeau déformé.
  if(partial && partial.items.length===1 && rows.length){
    const last=rows.pop();
    rows.push({items:last.items.concat(partial.items), sum:last.sum+partial.sum});
    partial=null;
  }
  rows.forEach(r=>layout(r,(W-gap*(r.items.length-1))/r.sum)); // rangées pleines : vraies proportions, largeur remplie
  // 3) dernière rangée incomplète (≥ 2 photos) : elle s'ÉTIRE pour occuper TOUTE la largeur — aucun
  //    vide à droite. Les images grandissent proportionnellement (largeur ∝ ratio) et la hauteur est
  //    bornée pour ne pas devenir démesurée ; object-fit:cover recadre alors proprement, sans
  //    déformer. La galerie reste un rectangle plein.
  if(partial){
    const hFull=(W-gap*(partial.items.length-1))/partial.sum;
    layout(partial,Math.min(hFull,target*1.35));
  }
}
const _justifyQ=new Set();
function justifyQueued(gallery){
  if(_justifyQ.has(gallery))return;_justifyQ.add(gallery);
  requestAnimationFrame(()=>{_justifyQ.delete(gallery);justify(gallery);});
}
function justifyActive(){document.querySelectorAll('.page.active .gallery').forEach(justify);}

/* ===== CONSTRUCTION D'UNE GALERIE, À LA DEMANDE =====
   Auparavant les SEPT galeries étaient montées au chargement : 85 balises <img> insérées dans le
   document et sept passes de mise en page `justify()`, pour zéro galerie visible — la page
   d'accueil n'en affiche aucune. Les photos ne se téléchargeaient pas (loading="lazy"), mais le
   navigateur devait tout de même créer et disposer chaque nœud.
   Une galerie n'est désormais construite qu'à la première ouverture de sa frame, puis mémorisée
   (`_built`) : les visites suivantes ne repayent rien. */
const _built=new Set();
function buildGallery(key){
  if(_built.has(key))return;
  const g=GAL[key];if(!g)return;
  const host=document.getElementById('gal-'+key);if(!host)return;
  _built.add(key);
  const dim=DIM[key]||{};
  let html='';
  // Ordre d'affichage : on ne retient que les photos RÉELLEMENT présentes (clés de DIM).
  // `order` passe en premier, puis tout le reste par n° croissant → une photo ajoutée au dossier
  // apparaît même si elle n'est pas listée dans `order`.
  const nums=Object.keys(dim).map(Number);
  const wanted=(g.order||[]).filter(i=>dim[i]);
  const seq=wanted.concat(nums.filter(i=>!wanted.includes(i)).sort((a,b)=>a-b));
  seq.forEach(i=>{
    const w=dim[i][0],h=dim[i][1];
    // 3e valeur du manifeste = extension propre à CETTE photo, quand elle sort du défaut de
    // l'album (un .jpg glissé dans un album en .jpeg, par exemple). Absente = défaut.
    const ext=dim[i][2]||g.ext||'jpeg';
    const file=(i===0)?'banner.'+ext:g.pre+'-'+i+'.'+ext;   // 0 = bannière de l'album
    const src='photographies/categories/'+g.dir+'/'+file;
    const alt=(i===0)?g.label:g.label+' — '+i;
    // width/height sur la balise : le navigateur réserve nativement le bon rapport d'aspect
    html+='<figure class="gitem" data-r="'+(w/h).toFixed(4)+'"><img class="gimg" width="'+w+'" height="'+h+'" src="'+src+'" alt="'+alt+'" loading="lazy"></figure>';
  });
  host.innerHTML=html;
  host.querySelectorAll('img.gimg').forEach(img=>{
    const fig=img.closest('.gitem');
    fig._ratio=parseFloat(fig.dataset.r)||1.5;   // dimensions déclarées → 1re mise en page déjà juste
    // Filet de sécurité si le manifeste n'a pas été régénéré : photo supprimée mais encore listée
    // → on retire la vignette. Aucune icône cassée ni case vide, la mosaïque se recompose seule.
    const fail=()=>{fig.remove();justifyQueued(host);};
    // [A4] .ready déclenche le passage flou → net.
    const done=()=>{
      img.classList.add('ready');
      if(!img.naturalWidth||!img.naturalHeight)return;
      const r=img.naturalWidth/img.naturalHeight;
      // conforme au format déclaré → on NE retouche PAS la mise en page (plus aucun réagencement)
      if(Math.abs(r-fig._ratio)<0.01)return;
      fig._ratio=r;justifyQueued(host);
    };
    if(img.complete){img.naturalWidth?done():fail();}
    else{img.addEventListener('load',done);img.addEventListener('error',fail);}
  });
  justify(host);
}
/* re-dispose automatiquement dès que la largeur d'une galerie change → vraiment responsive */
const _lastW=new WeakMap();
function justifyIfWidthChanged(gallery){
  // MÊME mesure que justify() (clientWidth, insensible aux transformations) : avec
  // getBoundingClientRect(), l'animation d'ouverture `frameIn` faisait mémoriser ici une largeur
  // agrandie de 4,5%, et le recalcul légitime d'après l'animation était ensuite ignoré.
  const w=gallery.clientWidth; if(w<=1)return;
  if(_lastW.get(gallery)===w)return;            // largeur inchangée → évite une boucle inutile
  _lastW.set(gallery,w); justify(gallery);
}
if('ResizeObserver' in window){
  const ro=new ResizeObserver(entries=>entries.forEach(e=>justifyIfWidthChanged(e.target)));
  document.querySelectorAll('.frame-page .gallery').forEach(g=>ro.observe(g));
}
let _rjt;window.addEventListener('resize',()=>{clearTimeout(_rjt);_rjt=setTimeout(justifyActive,140);},{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(justifyActive,220));

/* ===================== MENU MOBILE (burger → menu déroulant) ===================== */
(function(){
  const burger=document.getElementById('burger'),menu=document.getElementById('menu');
  if(!burger||!menu)return;
  function setMenu(open){
    document.body.classList.toggle('menu-open',open);
    burger.setAttribute('aria-expanded',open?'true':'false');
    burger.setAttribute('aria-label',open?'Close menu':'Open menu');
  }
  burger.addEventListener('click',e=>{e.stopPropagation();setMenu(!document.body.classList.contains('menu-open'));});
  document.addEventListener('click',e=>{
    if(!document.body.classList.contains('menu-open'))return;
    if(!e.target.closest('#menu')&&!e.target.closest('#burger'))setMenu(false);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open'))setMenu(false);});
})();

/* ===================== ROUTING ===================== */
/* `dot` = la pastille affichée à droite de la navbar, à côté du nom de l'album (le « navchip »).
   ⚠ Ce n'est PAS la couleur de thème de la frame : celle-ci vit dans le CSS (voir « THÈME DE
   COULEUR PAR FRAME »). Les deux sont volontairement indépendantes — Bali a un thème bleu et
   une pastille sable, par exemple.
   ⚠ `dot` sert aussi de MARQUEUR : c'est sa présence qui fait qu'une page est traitée comme une
   frame (obturateur à l'ouverture, flèches prev/next). Ne jamais la vider — la retirer
   transformerait la frame en page ordinaire. */
const FRAMES=[
  {key:'thailand',    el:'page-thailand',    label:'Thailand',      dot:'#A43032'},   // inchangé
  {key:'bali',        el:'page-bali',        label:'Bali',                  dot:'#C2B280'},  // sable
  {key:'hydepark',    el:'page-hydepark',    label:'Hyde Park Nostalgia',   dot:'#4A4A4A'},  // gris foncé
  {key:'nightmarkets',el:'page-nightmarkets',label:'Night Markets',         dot:'#000000'},  // noir
  {key:'morocco',     el:'page-morocco',     label:'Echoes of Morocco',     dot:'#C62828'},  // rouge
  {key:'coast',       el:'page-coast',       label:'Children of the Coast', dot:'#A97B50'},  // ocre de la roche
  {key:'wildlife',    el:'page-wildlife',    label:'Wildlife',              dot:'#795C5F'},  // inchangé
  {key:'scotland',    el:'page-scotland',    label:'Scotland',              dot:'#758AD1'},  // inchangé
  {key:'muaythai',    el:'page-muaythai',    label:'Muay Thai',             dot:'#C80217'},  // rouge des gants
];
const PAGES={home:{el:'page-home'},frames:{el:'page-frames'},about:{el:'page-about'},contact:{el:'page-contact'}};
FRAMES.forEach(f=>PAGES[f.key]={el:f.el,label:f.label,dot:f.dot});
const NAVKEYS=['home','frames','about','contact'];

/* ----- PC : bloc « album précédent / suivant » ajouté en bas de chaque frame -----
   Construit ici plutôt que recopié 7 fois dans le HTML : les voisins d'un album se déduisent de
   l'ordre de FRAMES ci-dessus, donc réordonner cette seule liste réordonne aussi la navigation.
   La liste boucle : après la dernière frame vient la première (comme les flèches mobiles).
   Chaque bouton porte le `data-chapter` de sa DESTINATION → il en reprend la couleur de thème. */
FRAMES.forEach((f,i)=>{
  const page=document.getElementById(f.el);if(!page)return;
  const prev=FRAMES[(i-1+FRAMES.length)%FRAMES.length],next=FRAMES[(i+1)%FRAMES.length];
  const el=document.createElement('nav');
  el.className='frame-nav';el.setAttribute('aria-label','Other frames');
  el.innerHTML=
    '<button class="fn-btn fn-prev" data-goframe="'+prev.key+'" data-chapter="'+prev.key+'">'+
      '<span class="fn-k"><span class="dot"></span>Previous frame</span>'+
      '<span class="fn-t">'+prev.label+'</span></button>'+
    '<button class="fn-all" data-goframe="*">All frames</button>'+
    '<button class="fn-btn fn-next" data-goframe="'+next.key+'" data-chapter="'+next.key+'">'+
      '<span class="fn-k">Next frame<span class="dot"></span></span>'+
      '<span class="fn-t">'+next.label+'</span></button>';
  page.appendChild(el);
  // l'ornement AF passe SOUS le bloc de navigation : il ferme la page, il ne s'intercale pas
  // entre la galerie et les boutons. Sur mobile le bloc est masqué, l'ornement reprend donc
  // naturellement sa place juste après la galerie.
  const breath=page.querySelector('.breath');
  if(breath)el.after(breath);
});
document.body.addEventListener('click',e=>{
  const b=e.target.closest('[data-goframe]');if(!b)return;
  if(b.dataset.goframe==='*')go('frames');else navTo(b.dataset.goframe);
});
/* ← / → font aussi défiler les frames (au clavier, donc de fait sur PC).
   La lightbox se sert déjà de ces deux touches : quand elle est ouverte, elle garde la main. */
document.addEventListener('keydown',e=>{
  if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const lbEl=document.getElementById('lb');
  if(lbEl&&lbEl.classList.contains('open'))return;
  if(document.body.classList.contains('menu-open'))return;
  const a=document.querySelector('.page.active');
  if(!a||!a.classList.contains('frame-page'))return;
  goFrameRel(e.key==='ArrowRight'?1:-1);
});

/* ----- sélecteur de frame (navbar mobile) + navigation prev/next ----- */
let currentFrameIdx=-1;
const fsEl=document.getElementById('frameswitch'),fsT=document.getElementById('fs-t'),
      fsDot=document.getElementById('fs-dot');
function goFrameRel(dir){
  if(currentFrameIdx<0)return;
  const n=FRAMES.length;
  navTo(FRAMES[(currentFrameIdx+dir+n)%n].key);  // boucle : après la dernière → la première
}
(function(){
  const p=document.getElementById('fs-prev'),n=document.getElementById('fs-next');
  if(p)p.addEventListener('click',e=>{e.stopPropagation();goFrameRel(-1);});
  if(n)n.addEventListener('click',e=>{e.stopPropagation();goFrameRel(1);});
})();

const nav=document.getElementById('nav'),navchip=document.getElementById('navchip'),navchipT=document.getElementById('navchip-t');
const menuEl=document.getElementById('menu');
/* teinte navbar + menu déroulant + fond selon la palette (et le mode jour/nuit) de la frame active */
const MENU_VARS=['--bg','--text','--muted','--faint','--line','--accent'];
function retintNav(){
  const el=document.querySelector('.page.active');
  if(el&&el.classList.contains('frame-page')){
    const cs=getComputedStyle(el);
    const fbg=cs.getPropertyValue('--fbg').trim();
    const fline=cs.getPropertyValue('--fline').trim();
    const dark=cs.getPropertyValue('--fdark').trim()==='1';
    nav.style.background=fbg;
    nav.style.borderColor=fline;
    nav.classList.toggle('on-dark',dark);
    nav.classList.toggle('on-light',!dark);   // frame à fond clair → logo/texte foncés
    document.body.style.background=fbg;
    if(menuEl){                                   // le menu déroulant hérite de la palette de la frame
      const fmuted=cs.getPropertyValue('--fmuted').trim();
      menuEl.style.setProperty('--bg',fbg);
      menuEl.style.setProperty('--text',cs.getPropertyValue('--ftext').trim());
      menuEl.style.setProperty('--muted',fmuted);
      menuEl.style.setProperty('--faint',fmuted);
      menuEl.style.setProperty('--line',fline);
      menuEl.style.setProperty('--accent',cs.getPropertyValue('--faccent').trim());
      menuEl.classList.toggle('on-dark',dark);
      menuEl.classList.toggle('on-light',!dark);
    }
  }else{
    nav.style.background='';nav.style.borderColor='';nav.classList.remove('on-dark','on-light');
    document.body.style.background='';
    if(menuEl){MENU_VARS.forEach(p=>menuEl.style.removeProperty(p));menuEl.classList.remove('on-dark','on-light');}
  }
}
function go(key,skipReveal){
  const p=PAGES[key];if(!p)return;
  document.querySelectorAll('.page').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(p.el);el.classList.add('active');
  // la galerie de la frame est montée ICI, après l'affichage de la page : justify() mesure une
  // largeur réelle, ce qu'il ne pourrait pas faire sur un conteneur encore masqué
  if(GAL[key])buildGallery(key);
  if(p.dot){navchip.classList.add('show');navchipT.textContent=p.label;navchip.querySelector('.dot').style.background=p.dot;}
  else navchip.classList.remove('show');
  retintNav();
  // sélecteur de frame dans la navbar (mobile)
  currentFrameIdx=FRAMES.findIndex(f=>f.key===key);
  if(currentFrameIdx>=0){
    nav.classList.add('is-frame');
    if(fsT)fsT.textContent=p.label;
    if(fsDot)fsDot.style.background=p.dot||'';
    if(fsEl)fsEl.setAttribute('aria-hidden','false');
  }else{
    nav.classList.remove('is-frame');
    if(fsEl)fsEl.setAttribute('aria-hidden','true');
  }
  const navKey=NAVKEYS.includes(key)?key:'frames';
  document.querySelectorAll('.nav a[data-nav],.menu-links a[data-nav]').forEach(a=>a.classList.toggle('current',a.dataset.nav===navKey));
  document.body.classList.remove('menu-open');
  const bg=document.getElementById('burger');if(bg){bg.setAttribute('aria-expanded','false');bg.setAttribute('aria-label','Open menu');}
  if(location.hash!=='#'+key)history.pushState({key},'','#'+key);
  window.scrollTo({top:0});if(!skipReveal)runReveal();
  requestAnimationFrame(()=>el.querySelectorAll('.gallery').forEach(justify)); // (re)dispose la mosaïque une fois la page visible
}
/* ===================== [A1] OUVERTURE D'UNE FRAME : OBTURATEUR ===================== */
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
const shutter=document.getElementById('shutter');
let shBusy=false;
/* ouvre une frame derrière un obturateur : volets qui se ferment → bascule de page → flash → réouverture */
function openFrame(key){
  const p=PAGES[key];
  if(REDUCE||!shutter||!p||shBusy){go(key);return;}
  shBusy=true;
  // l'obturateur emprunte la palette de la frame visée
  const target=document.getElementById(p.el);
  const cs=target?getComputedStyle(target):null;
  const dark=cs&&cs.getPropertyValue('--fdark').trim()==='1';
  shutter.style.setProperty('--sh-bg',dark?'#0B0906':'#1C1610');
  shutter.style.setProperty('--sh-accent',(cs&&cs.getPropertyValue('--faccent').trim())||'var(--gold)');
  shutter.classList.add('run','close');
  setTimeout(()=>{                       // volets fermés : on change de page à l'abri des regards
    go(key);
    shutter.classList.remove('close');
    shutter.classList.add('open');
    setTimeout(()=>{shutter.classList.remove('run','open');shBusy=false;},540);
  },360);
}
/* une frame s'ouvre avec l'obturateur ; les pages normales gardent la transition existante */
function navTo(key){ (PAGES[key]&&PAGES[key].dot) ? openFrame(key) : go(key); }

document.querySelectorAll('[data-nav]').forEach(e=>e.addEventListener('click',()=>navTo(e.dataset.nav)));
document.querySelectorAll('.frame-row[data-chapter]').forEach(f=>f.addEventListener('click',()=>navTo(f.dataset.chapter)));
document.body.addEventListener('click',e=>{
  const c=e.target.closest('.list-card[data-chapter]');if(c){navTo(c.dataset.chapter);return;}
});
window.addEventListener('popstate',()=>go((location.hash||'#home').slice(1)));

/* swipe horizontal sur une frame (mobile) → frame suivante / précédente */
(function(){
  let sx=0,sy=0,track=false;
  document.addEventListener('touchstart',e=>{
    const lbEl=document.getElementById('lb');
    if((lbEl&&lbEl.classList.contains('open'))||document.body.classList.contains('menu-open')){track=false;return;}
    const a=document.querySelector('.page.active');
    if(!a||!a.classList.contains('frame-page')){track=false;return;}
    const t=e.touches[0];sx=t.clientX;sy=t.clientY;track=true;
  },{passive:true});
  document.addEventListener('touchend',e=>{
    if(!track)return;track=false;
    const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.6)goFrameRel(dx<0?1:-1);
  },{passive:true});
})();

/* (bloc « Previous frame / Next frame » en bas de page retiré — on passe d'une frame à l'autre
   par le sélecteur de la navbar, le balayage horizontal ou le menu) */

/* ===================== FILTRES ===================== */
document.querySelectorAll('.pills .pill').forEach(b=>b.addEventListener('click',()=>{
  const grp=b.closest('.pills');grp.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  const f=b.dataset.filter;if(!f)return;
  const grid=document.getElementById('listgrid');
  const cards=[...grid.querySelectorAll('.list-card')];
  // 1) on retire D'ABORD toutes les cartes — la grille est vide avant que la suite ne s'affiche,
  //    donc aucun album de la catégorie précédente ne reste visible pendant le changement.
  cards.forEach(c=>{c.classList.add('hide');c.classList.remove('show-in');});
  // 2) PUIS on affiche uniquement celles de la catégorie demandée
  const keep=cards.filter(c=>f==='all'||c.dataset.cat===f);
  keep.forEach(c=>c.classList.remove('hide'));
  void grid.offsetWidth;                       // reflow : relance l'animation même si la carte était déjà là
  keep.forEach(c=>c.classList.add('show-in'));
  // catégorie sans album (Sports, Events) → on affiche un message plutôt qu'une zone vide
  const empty=document.getElementById('listempty');
  if(empty)empty.hidden=keep.length>0;
}));

/* ===================== REVEAL + PROGRESS ===================== */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
/* [A3] cascade : au sein d'un même parent, chaque élément révélé part légèrement après le précédent */
function stagger(){
  const seen=new Map();
  document.querySelectorAll('.page.active .reveal:not(.in)').forEach(el=>{
    const p=el.parentElement;const i=seen.get(p)||0;seen.set(p,i+1);
    el.style.setProperty('--rd',Math.min(i*0.07,0.42)+'s');
  });
}
function runReveal(){stagger();document.querySelectorAll('.page.active .reveal:not(.in)').forEach(el=>io.observe(el));}
const prog=document.getElementById('progress');

/* [A5] navbar compacte + [A6] parallaxe de bannière, calculés dans un seul écouteur de scroll */
const bannerBg=document.querySelector('.banner .bg');
let ticking=false;
/* ===== HYSTÉRÉSIS DE LA BARRE COMPACTE — deux seuils, et c'est délibéré =====
   Avec un seuil unique (l'ancien `y>70`), la barre palpitait dès qu'on s'arrêtait de défiler
   juste à cette hauteur. La barre est `position:sticky`, donc elle occupe sa place DANS LE FLUX :
   en se compactant elle perd 20px de padding, la page raccourcit d'autant et tout le contenu
   remonte — ce qui suffit à repasser sous le seuil, à redéployer la barre, à rallonger la page…
   et la bascule s'entretient toute seule. Chaque aller-retour rejouant la transition de 0,4s,
   l'effet est un battement bien visible.
   Deux seuils écartés cassent la boucle : une fois compactée, il faut REMONTER franchement
   (sous 50px) pour la redéployer — les 40px de zone tampon sont hors de portée du décalage de
   20px qu'elle provoque elle-même. La fonctionnalité est identique, seul le rebond disparaît. */
const NAV_COMPACT_ON=90, NAV_COMPACT_OFF=50;
function onScroll(){
  const y=window.scrollY;
  const h=document.documentElement.scrollHeight-window.innerHeight;
  prog.style.width=(h>0?y/h*100:0)+'%';
  if(y>NAV_COMPACT_ON)nav.classList.add('compact');
  else if(y<NAV_COMPACT_OFF)nav.classList.remove('compact');   // entre les deux : on ne touche à rien
  // [A6] la photo de bannière glisse moins vite que la page.
  // Volontairement SANS scale() : un agrandissement dégraderait la netteté (les sources font
  // 1600px max). Une translation vers le bas ne découvre aucun vide — la bannière défile plus
  // vite que la photo, donc son bord haut reste toujours couvert.
  if(bannerBg&&!REDUCE&&y<window.innerHeight*1.1){
    bannerBg.style.transform='translate3d(0,'+(y*0.28).toFixed(1)+'px,0)';
  }
  ticking=false;
}
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});


/* [A2] titre de frame : découpé en mots pour une arrivée en cascade */
document.querySelectorAll('.frame-page .chap-cap h1,.frame-page .chap-txt h1').forEach(h=>{
  const words=h.textContent.trim().split(/\s+/);
  h.innerHTML=words.map((w,i)=>'<span class="w" style="animation-delay:'+(0.26+i*0.09).toFixed(2)+'s">'+w+'</span>').join(' ');
});

/* [A7] onde au clic sur les pastilles de filtre */
document.querySelectorAll('.pills .pill').forEach(b=>b.addEventListener('click',e=>{
  if(REDUCE)return;
  const rect=b.getBoundingClientRect(),d=Math.max(rect.width,rect.height);
  const r=document.createElement('span');r.className='ripple';
  r.style.width=r.style.height=d+'px';
  r.style.left=(e.clientX-rect.left-d/2)+'px';r.style.top=(e.clientY-rect.top-d/2)+'px';
  b.appendChild(r);setTimeout(()=>r.remove(),580);
}));

/* [A8] léger relief 3D du cadre photo (pointeur fin uniquement, jamais au doigt) */
(function(){
  const hf=document.querySelector('.hero-frame');
  if(!hf||REDUCE||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  hf.addEventListener('mousemove',e=>{
    const r=hf.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    hf.style.transform='perspective(900px) rotateY('+(x*4.5).toFixed(2)+'deg) rotateX('+(-y*4.5).toFixed(2)+'deg)';
  });
  hf.addEventListener('mouseleave',()=>{hf.style.transform='';});
})();

/* [A9] boutons de contact magnétiques : ils viennent légèrement vers le curseur */
(function(){
  if(REDUCE||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  document.querySelectorAll('.ig-btn').forEach(b=>{
    b.addEventListener('mousemove',e=>{
      const r=b.getBoundingClientRect();
      b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)*.28).toFixed(1)+'px)';
    });
    b.addEventListener('mouseleave',()=>{b.style.transform='';});
  });
})();

/* [A11] retour tactile des flèches prev/next */
['fs-prev','fs-next'].forEach(id=>{
  const el=document.getElementById(id);if(!el)return;
  el.addEventListener('pointerdown',()=>el.classList.add('tap'));
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>el.addEventListener(ev,()=>el.classList.remove('tap')));
});

/* ===================== LIGHTBOX ===================== */
const lb=document.getElementById('lb'),lbImg=document.getElementById('lb-img'),lbCap=document.getElementById('lb-cap'),lbCount=document.getElementById('lb-count');
let items=[],idx=0,scrollMem=0;
function lbRender(){
  const it=items[idx];
  // `.gitem` porte une <img class="gimg">, `.sel-cell` une <img class="img"> : dans les deux cas
  // c'est une vraie balise, on lit donc simplement son `src`.
  const g=it.querySelector('img.gimg')||it.querySelector('img.img')||it.querySelector('.img');
  let src='';
  if(g)src=g.tagName==='IMG'?g.getAttribute('src'):(g.style.backgroundImage||'').replace(/^url\(["']?/,'').replace(/["']?\)$/,'');
  lbImg.src=src;                       // la scène se redimensionne d'elle-même autour de l'image
  const c=it.querySelector('.cap');lbCap.textContent=c?c.textContent:'';lbCount.textContent=(idx+1)+' / '+items.length;
}
function move(d){idx=(idx+d+items.length)%items.length;lbRender();}
function closeLB(){lb.classList.remove('open');document.body.style.overflow='';window.scrollTo({top:scrollMem});}
/* `.sel-cell` = les tirages de la section « Gallery » de l'accueil, ajoutés ici aux `.gitem`
   des galeries de frame : mêmes flèches, mêmes raccourcis clavier, même balayage tactile.
   Le lot parcouru est celui de la PAGE ACTIVE, et les deux sélecteurs ne coexistent jamais sur
   une même page — l'accueil n'a que des .sel-cell, une frame que des .gitem. */
const LB_SEL='.gitem,.sel-cell';
document.addEventListener('click',e=>{const it=e.target.closest(LB_SEL);if(!it)return;const set=Array.from(document.querySelectorAll('.page.active .gitem,.page.active .sel-cell'));items=set;idx=set.indexOf(it);scrollMem=window.scrollY;lbRender();lb.classList.add('open');document.body.style.overflow='hidden';});
document.getElementById('lb-next').addEventListener('click',e=>{e.stopPropagation();move(1);});
document.getElementById('lb-prev').addEventListener('click',e=>{e.stopPropagation();move(-1);});
document.getElementById('lb-close').addEventListener('click',closeLB);
lb.addEventListener('click',e=>{if(e.target===lb)closeLB();});
document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')closeLB();if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1);});
let sx=0;lb.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});lb.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)move(dx<0?1:-1);});

/* ===================== BOUTON « SEND AN EMAIL » SUR MOBILE =====================
   Sur PC, le lien du HTML ouvre le formulaire de rédaction de Gmail dans un onglet : c'est le
   bon comportement, on n'y touche pas. Sur téléphone en revanche, cette même adresse
   mail.google.com reste dans le navigateur — elle n'ouvre PAS l'application Gmail.

   On passe donc par les liens profonds de l'application, et par eux SEULEMENT sur mobile :
     Android  intent://…;package=com.google.android.gm;…  — Chrome ouvre l'app, et si elle
              n'est pas installée il suit tout seul `browser_fallback_url` (le lien web).
     iOS      googlegmail://co?…  — schéma propre à l'app Gmail. Il n'existe aucun repli natif :
              si l'app est absente, rien ne se passe, d'où la temporisation ci-dessous qui
              renvoie alors vers le web.

   LE BROUILLON EST VIDE, ET C'EST VOULU : ni objet ni corps pré-écrits, sur aucune des trois
   plateformes — le visiteur écrit son message lui-même. Seul le DESTINATAIRE est repris, et
   il est lu dans le href du bouton, qui reste l'unique endroit où l'adresse est écrite.
   (Pour re-pré-remplir un jour : ajouter `&su=…` / `&body=…` au href, puis les relire ici
   sous les noms `subject` / `body` — c'est ainsi que les applications les nomment.) */
(function(){
  const btn=document.getElementById('mail-btn');if(!btn)return;
  const WEB=btn.href;                                   // repli commun : Gmail dans le navigateur
  const ua=navigator.userAgent;
  const android=/Android/i.test(ua);
  // iPadOS se présente comme un Mac : l'écran tactile est ce qui le distingue d'un vrai Mac
  const ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!android&&!ios)return;                             // PC : le lien du HTML fait déjà le travail
  const p=new URL(WEB).searchParams;
  const q='to='+encodeURIComponent(p.get('to')||'');
  btn.addEventListener('click',e=>{
    e.preventDefault();
    if(android){
      location.href='intent://co?'+q+'#Intent;scheme=googlegmail;package=com.google.android.gm;'
        +'S.browser_fallback_url='+encodeURIComponent(WEB)+';end';
      return;
    }
    // iOS : si l'app s'ouvre, l'onglet passe en arrière-plan → on annule le repli.
    const t=setTimeout(()=>{if(!document.hidden)location.href=WEB;},1200);
    const stop=()=>clearTimeout(t);
    window.addEventListener('pagehide',stop,{once:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{once:true});
    location.href='googlegmail://co?'+q;
  });
})();

/* ===================== DIAGNOSTIC DE DÉBORDEMENT (?diag) =====================
   N'existe QUE si l'URL contient `?diag` — sur une visite normale, rien de tout ceci ne
   s'exécute et le coût est nul.
   À quoi ça sert : un débordement horizontal ne se voit pas dans le code, il dépend de
   l'appareil, de la police réellement chargée et du moteur. Sur un iPhone il n'y a pas de
   console pour aller le chercher. Ce bloc affiche donc le résultat À L'ÉCRAN : il suffit
   d'ouvrir …/?diag#thailand et d'envoyer une capture.
   À retirer une fois la cause trouvée. */
if(location.search.indexOf('diag')>=0){
  const panneau=document.createElement('div');
  panneau.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:9999;max-height:45vh;'
    +'overflow:auto;background:#111;color:#0f0;font:11px/1.45 monospace;padding:10px;white-space:pre-wrap;';
  document.body.appendChild(panneau);
  const analyser=()=>{
    const L=document.documentElement.clientWidth;
    const fautifs=[];
    document.querySelectorAll('*').forEach(el=>{
      const c=getComputedStyle(el);
      if(c.display==='none'||c.visibility==='hidden'||el===panneau||panneau.contains(el))return;
      const r=el.getBoundingClientRect();
      if(!r.width)return;
      if(r.right>L+1||r.left<-1){
        let d=0,n=el;while(n.parentElement){d++;n=n.parentElement;}
        fautifs.push({d,t:el.tagName.toLowerCase()
          +(el.id?'#'+el.id:'')
          +(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'')
          +' ['+Math.round(r.left)+'→'+Math.round(r.right)+']'});
      }
    });
    fautifs.sort((a,b)=>b.d-a.d);
    const lignes=[
      'ecran '+L+'px  |  document '+document.documentElement.scrollWidth+'px'
        +'  |  ecart '+(document.documentElement.scrollWidth-L)+'px',
      'devicePixelRatio '+devicePixelRatio+'  |  visualViewport '
        +(window.visualViewport?Math.round(visualViewport.width)+'x'+Math.round(visualViewport.scale*100)+'%':'n/a')
    ].concat(fautifs.length?fautifs.slice(0,14).map(f=>'-> '+f.t):['aucun element ne depasse']);
    panneau.textContent=lignes.join('\n');
  };
  addEventListener('load',()=>setTimeout(analyser,900));
  addEventListener('hashchange',()=>setTimeout(analyser,900));
  addEventListener('resize',()=>setTimeout(analyser,400));
  setTimeout(analyser,1500);
}

go((location.hash||'#home').slice(1));runReveal();
