/* ============================================================
   menu.js — mobile dropdown menu: burger toggles a panel
   anchored under the navbar. Closes on link select, outside
   click, or Escape.
   ============================================================ */
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
const drop = document.getElementById('menu-drop');

export function setMenu(open) {
  nav.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  drop.setAttribute('aria-hidden', String(!open));
}

export function initMenu() {
  burger.addEventListener('click', e => {
    e.stopPropagation();
    setMenu(!nav.classList.contains('menu-open'));
  });

  // selecting a nav link closes the menu (router handles the navigation)
  drop.querySelectorAll('a[data-nav]').forEach(a =>
    a.addEventListener('click', () => setMenu(false)));

  // outside click
  document.addEventListener('click', e => {
    if (!nav.classList.contains('menu-open')) return;
    if (!e.target.closest('.menu-drop') && !e.target.closest('.burger')) setMenu(false);
  });

  // Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setMenu(false);
  });
}
