/* ============================================================
   filters.js — category filter pills on the "Frames" listing.
   ============================================================ */
export function initFilters() {
  document.querySelectorAll('.pills .pill').forEach(b =>
    b.addEventListener('click', () => {
      const grp = b.closest('.pills');
      grp.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const f = b.dataset.filter;
      if (!f) return;
      document.querySelectorAll('#listgrid .list-card').forEach(c =>
        c.classList.toggle('hide', !(f === 'all' || c.dataset.cat === f)));
    }));
}
