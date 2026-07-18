/* ============================================================
   reveal.js — IntersectionObserver-driven scroll-in animations
   (re-armed on every SPA page change) + reading progress bar.
   ============================================================ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });

/** Observe every not-yet-revealed element of the active page. */
export function runReveal() {
  document.querySelectorAll('.page.active .reveal:not(.in)').forEach(el => io.observe(el));
}

export function initProgress() {
  const prog = document.getElementById('progress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? window.scrollY / h * 100 : 0) + '%';
  }, { passive: true });
}
