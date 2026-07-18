/* ============================================================
   main.js — entry point: wires up every module.
   Order matters slightly: galleries must exist before the
   router runs its first reveal pass.
   ============================================================ */
import { initStarfield } from './starfield.js';
import { initTheme } from './theme.js';
import { initGalleries } from './gallery.js';
import { initMenu } from './menu.js';
import { initFilters } from './filters.js';
import { initLightbox } from './lightbox.js';
import { initProgress } from './reveal.js';
import { initRouter } from './router.js';

initStarfield();
initGalleries();
initMenu();
initFilters();
initLightbox();
initProgress();
initTheme();
initRouter();
