/* ============================================================
   router.js — hash-based SPA navigation (#home, #thailand, …),
   active-page handling, history/popstate, desktop nav chip,
   previous/next frame links, and the frame-entry transition.
   ============================================================ */
import { FRAMES, PAGES, NAVKEYS } from './config.js';
import { retintNav } from './theme.js';
import { frameTransition } from './transitions.js';
import { runReveal } from './reveal.js';

const navchip = document.getElementById('navchip');
const navchipT = document.getElementById('navchip-t');
const navBack = document.getElementById('nav-back');

/** Activate a page and refresh everything that depends on it. */
function activate(key) {
  const p = PAGES[key];
  document.querySelectorAll('.page').forEach(s => s.classList.remove('active'));
  document.getElementById(p.el).classList.add('active');

  // desktop chip + mobile back arrow
  if (p.frame) {
    navchip.classList.add('show');
    navchipT.textContent = p.label;
    navchip.querySelector('.dot').style.background = p.dot;
    navBack.classList.add('show');
  } else {
    navchip.classList.remove('show');
    navBack.classList.remove('show');
  }

  retintNav();

  // highlight the matching top-level link (desktop + dropdown)
  const navKey = NAVKEYS.includes(key) ? key : 'frames';
  document.querySelectorAll('.nav a[data-nav], .menu-drop a[data-nav]')
    .forEach(a => a.classList.toggle('current', a.dataset.nav === navKey));

  window.scrollTo({ top: 0 });
  runReveal();
}

/** Navigate to a page key, with the curtain effect for frames. */
export function go(key) {
  const p = PAGES[key];
  if (!p) return;
  const current = document.querySelector('.page.active');
  const dest = document.getElementById(p.el);
  if (current === dest) return;

  if (location.hash !== '#' + key) history.pushState({ key }, '', '#' + key);

  if (p.frame) frameTransition(dest, () => activate(key));
  else activate(key);
}

/** Resolve the current hash to a valid page key. */
function hashKey() {
  const k = (location.hash || '#home').slice(1);
  return PAGES[k] ? k : 'home';
}

export function initRouter() {
  // top nav links, logo, dropdown links
  document.querySelectorAll('[data-nav]').forEach(e =>
    e.addEventListener('click', () => go(e.dataset.nav)));

  // frame rows on home + listing cards (delegated)
  document.body.addEventListener('click', e => {
    const c = e.target.closest('[data-chapter]');
    if (c) go(c.dataset.chapter);
  });

  // mobile back arrow returns to the listing
  navBack.addEventListener('click', () => go('frames'));

  // browser back/forward
  window.addEventListener('popstate', () => activate(hashKey()));

  buildChapNav();
  activate(hashKey());
}

/** Build the previous/next navigation at the bottom of each frame. */
function buildChapNav() {
  const link = (key, label, dir) => {
    const a = document.createElement('a');
    a.className = dir;
    const ttl = key === 'frames' ? 'All frames' : PAGES[key].label;
    a.innerHTML = '<i class="ti ti-arrow-' + (dir === 'prev' ? 'left' : 'right') + '"></i>'
      + '<span><span class="lbl">' + label + '</span><span class="ttl serif">' + ttl + '</span></span>';
    a.addEventListener('click', () => go(key));
    return a;
  };

  FRAMES.forEach((f, i) => {
    const wrap = document.querySelector('#' + f.el + ' .chap-body .wrap');
    if (!wrap) return;
    const prev = FRAMES[i - 1], next = FRAMES[i + 1];
    const box = document.createElement('div');
    box.className = 'chap-nav reveal';
    box.appendChild(prev ? link(prev.key, 'Previous frame', 'prev') : link('frames', 'Back', 'prev'));
    box.appendChild(next ? link(next.key, 'Next frame', 'next') : link('frames', 'Back', 'next'));
    wrap.appendChild(box);
  });
}
