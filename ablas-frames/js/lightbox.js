/* ============================================================
   lightbox.js — full-screen viewer: opens on gallery click,
   prev/next via buttons, arrow keys and touch swipe, counter,
   closes on outside click or Escape.
   ============================================================ */
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lb-img');
const lbCap = document.getElementById('lb-cap');
const lbCount = document.getElementById('lb-count');

let items = [];
let idx = 0;
let scrollMem = 0;

function render() {
  const it = items[idx];
  const img = it.querySelector('img');
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  const c = it.querySelector('.cap');
  lbCap.textContent = c ? c.textContent : '';
  lbCount.textContent = (idx + 1) + ' / ' + items.length;
}

function move(d) {
  idx = (idx + d + items.length) % items.length;
  render();
}

function close() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
  window.scrollTo({ top: scrollMem });
}

export function initLightbox() {
  // open on any gallery item of the active page
  document.addEventListener('click', e => {
    const it = e.target.closest('.gitem');
    if (!it) return;
    items = Array.from(document.querySelectorAll('.page.active .gitem'));
    idx = items.indexOf(it);
    scrollMem = window.scrollY;
    render();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('lb-next').addEventListener('click', e => { e.stopPropagation(); move(1); });
  document.getElementById('lb-prev').addEventListener('click', e => { e.stopPropagation(); move(-1); });
  document.getElementById('lb-close').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowLeft') move(-1);
  });

  // touch swipe
  let sx = 0;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
  });
}
