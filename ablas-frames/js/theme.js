/* ============================================================
   theme.js — day/night toggle (persisted in localStorage, the
   default follows local time: night from 7pm to 7am) + nav
   retint following the active frame's palette.
   ============================================================ */
const STORAGE_KEY = 'af-theme';

const nav = document.getElementById('nav');
const toggle = document.getElementById('toggle');
const ticon = document.getElementById('ticon');

/**
 * Tint the navbar and page background with the active frame's
 * palette; reset when no frame page is active.
 */
export function retintNav() {
  const el = document.querySelector('.page.active');
  if (el && el.classList.contains('frame-page')) {
    const cs = getComputedStyle(el);
    nav.style.background = cs.getPropertyValue('--fbg').trim();
    nav.style.borderColor = cs.getPropertyValue('--fline').trim();
    nav.classList.toggle('on-dark', cs.getPropertyValue('--fdark').trim() === '1');
    document.body.style.background = cs.getPropertyValue('--fbg').trim();
  } else {
    nav.style.background = '';
    nav.style.borderColor = '';
    nav.classList.remove('on-dark');
    document.body.style.background = '';
  }
}

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  ticon.className = t === 'night' ? 'ti ti-moon' : 'ti ti-sun';
  try { localStorage.setItem(STORAGE_KEY, t); } catch (e) { /* private mode */ }
  retintNav();
}

export function initTheme() {
  toggle.addEventListener('click', () =>
    applyTheme(document.documentElement.dataset.theme === 'night' ? 'day' : 'night'));

  let t;
  try { t = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
  if (!t) {
    const h = new Date().getHours();
    t = (h < 7 || h >= 19) ? 'night' : 'day';
  }
  applyTheme(t);
}
