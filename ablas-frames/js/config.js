/* ============================================================
   config.js — single source of truth for the site's data.
   To add a new frame: add an entry to FRAMES below, add its
   page markup in index.html, and its palette in css/themes.css.
   ============================================================ */

/** Base path to the photo library (relative to index.html). */
export const IMG_BASE = '../photographies/categories/';

/**
 * The frames (photo chapters), in narrative order.
 * `key`     — hash key (#thailand) and data-chapter value
 * `el`      — id of the page <section> in index.html
 * `label`   — display name (chip, prev/next nav)
 * `dot`     — accent dot colour used in the desktop nav chip
 * `gallery` — folder (under IMG_BASE), filename prefix, photo count
 */
export const FRAMES = [
  { key: 'thailand',     el: 'page-thailand',     label: 'Thailand on Film',    dot: '#cf9f4e',
    gallery: { dir: 'travel/thailand',            prefix: 'thai',         count: 25 } },
  { key: 'bali',         el: 'page-bali',         label: 'Bali',                dot: '#4a9d8e',
    gallery: { dir: 'travel/bali',                prefix: 'bali',         count: 15 } },
  { key: 'hydepark',     el: 'page-hydepark',     label: 'Hyde Park Nostalgia', dot: '#8a9a6b',
    gallery: { dir: 'travel/hyde-park-nostalgia', prefix: 'hpn',          count: 6 } },
  { key: 'nightmarkets', el: 'page-nightmarkets', label: 'Night Markets',       dot: '#c96b4a',
    gallery: { dir: 'travel/night-markets',       prefix: 'nightmarkets', count: 3 } },
  { key: 'morocco',      el: 'page-morocco',      label: 'Echoes of Morocco',   dot: '#b5734a',
    gallery: { dir: 'portraits/echoes-of-morocco', prefix: 'eom',         count: 17 } },
  { key: 'wildlife',     el: 'page-wildlife',     label: 'Wildlife',            dot: '#7d8a4a',
    gallery: { dir: 'wildlife',                   prefix: 'wild',         count: 6 } },
];

/** All routable pages: static pages + one entry per frame. */
export const PAGES = {
  home:    { el: 'page-home' },
  frames:  { el: 'page-frames' },
  about:   { el: 'page-about' },
  contact: { el: 'page-contact' },
};
FRAMES.forEach(f => { PAGES[f.key] = { el: f.el, label: f.label, dot: f.dot, frame: true }; });

/** Keys that map to a top-level nav link. */
export const NAVKEYS = ['home', 'frames', 'about', 'contact'];
