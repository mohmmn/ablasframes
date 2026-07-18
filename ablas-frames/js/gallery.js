/* ============================================================
   gallery.js — builds each frame's masonry gallery from
   config.js: real <img> tags at their native aspect ratio,
   inserted into the CSS-columns container. No cropping, no
   span/fillGrid logic — the masonry balances itself.
   ============================================================ */
import { FRAMES, IMG_BASE } from './config.js';

export function initGalleries() {
  FRAMES.forEach(f => {
    const host = document.getElementById('gal-' + f.key);
    if (!host) return;
    const { dir, prefix, count } = f.gallery;

    const frag = document.createDocumentFragment();
    for (let i = 1; i <= count; i++) {
      const item = document.createElement('div');
      item.className = 'gitem reveal';
      // small stagger between neighbours for a softer scroll-in
      item.style.transitionDelay = ((i - 1) % 4) * 70 + 'ms';

      const img = document.createElement('img');
      img.src = `${IMG_BASE}${dir}/${prefix}-${i}.jpeg`;
      img.alt = `${f.label} — photo ${i}`;
      img.loading = 'lazy';

      const zoom = document.createElement('i');
      zoom.className = 'ti ti-zoom-in zoom';

      item.append(img, zoom);
      frag.appendChild(item);
    }
    host.appendChild(frag);
  });
}
