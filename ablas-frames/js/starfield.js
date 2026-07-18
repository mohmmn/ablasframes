/* ============================================================
   starfield.js — animated golden stars + diamond sparkles in
   the fixed background layer (#sky). Density is reduced when
   prefers-reduced-motion is active.
   ============================================================ */
export function initStarfield() {
  const sky = document.getElementById('sky');
  if (!sky) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = reduce ? 40 : 78;
  const NS = 'http://www.w3.org/2000/svg';

  for (let i = 0; i < N; i++) {
    const left = Math.random() * 100 + '%';
    const top = Math.random() * 100 + '%';
    const dur = (2.8 + Math.random() * 3.6) + 's';
    const delay = (Math.random() * 5) + 's';

    if (Math.random() > 0.62) {
      // diamond sparkle
      const sz = Math.random() * 9 + 7;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 10 10');
      svg.setAttribute('class', 'sparkle-svg');
      svg.setAttribute('width', sz);
      svg.setAttribute('height', sz);
      svg.style.left = left;
      svg.style.top = top;
      svg.style.animationDuration = dur;
      svg.style.animationDelay = delay;
      svg.innerHTML = '<path d="M5,0 L5.8,3.3 L9,5 L5.8,6.7 L5,10 L4.2,6.7 L1,5 L4.2,3.3 Z" fill="var(--star)"/>';
      sky.appendChild(svg);
    } else {
      // round star
      const sz = Math.random() * 2.4 + 1.4;
      const el = document.createElement('span');
      el.className = 'star';
      el.style.cssText = `width:${sz}px;height:${sz}px;left:${left};top:${top};animation-duration:${dur};animation-delay:${delay}`;
      sky.appendChild(el);
    }
  }
}
