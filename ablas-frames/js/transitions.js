/* ============================================================
   transitions.js — cinematic entry into a frame page.
   A curtain (#tveil) in the destination frame's accent colour
   sweeps up over the viewport, the router swaps the page under
   it, then the curtain lifts away. Falls back to the regular
   page fade when prefers-reduced-motion is on.
   Timings mirror css/transitions.css (.38s cover / .45s lift).
   ============================================================ */
const veil = document.getElementById('tveil');
const COVER_MS = 400;
const LIFT_MS = 480;

let busy = false;

function reduced() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Run the frame-entry transition.
 * @param {HTMLElement} destEl  destination .frame-page element
 * @param {Function}    swap    callback that activates the new page
 */
export function frameTransition(destEl, swap) {
  if (reduced() || busy || !veil) { swap(); return; }
  busy = true;

  // colour the curtain with the destination palette's accent
  const accent = getComputedStyle(destEl).getPropertyValue('--faccent').trim();
  veil.style.setProperty('--veil-c', accent);

  veil.classList.remove('lift');
  veil.classList.add('cover');

  setTimeout(() => {
    swap();
    // hero image zoom-out + staggered title/meta on the new page
    destEl.classList.add('frame-enter');
    veil.classList.remove('cover');
    veil.classList.add('lift');
    setTimeout(() => {
      veil.classList.remove('lift');
      destEl.classList.remove('frame-enter');
      busy = false;
    }, LIFT_MS + 900); // keep .frame-enter until hero animations finish
  }, COVER_MS);
}
