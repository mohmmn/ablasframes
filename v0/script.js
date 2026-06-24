document.addEventListener("DOMContentLoaded", () => {
  
  // --- GESTIONNAIRE DE NAVIGATION DE PAGES ---
  const pages = document.querySelectorAll(".page");
  const navBar = document.getElementById("main-nav");

  function switchPage(pageId) {
    pages.forEach(page => {
      page.classList.remove("active");
      if (page.id === pageId) {
        page.classList.add("active");
      }
    });

    // Gestion de la couleur adaptative de la Navbar selon la page active
    if (pageId === "chapter-thailand") {
      navBar.style.backgroundColor = "#FAF0CA";
      navBar.style.borderColor = "rgba(140,115,30,.15)";
    } else if (pageId === "chapter-highlands") {
      navBar.style.backgroundColor = "#dde3e7";
      navBar.style.borderColor = "rgba(100,120,130,.15)";
    } else {
      navBar.style.backgroundColor = "#faf8f5";
      navBar.style.borderColor = "rgba(0,0,0,.06)";
    }
    
    // Scroll automatique vers le haut
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Écouteurs de clics pour les éléments portant un attribut 'data-target'
  document.querySelectorAll("[data-target]").forEach(element => {
    element.addEventListener("click", () => {
      const target = element.getAttribute("data-target");
      switchPage(target);
    });
  });

  // Liens vers les chapitres individuels depuis les cartes d'aperçu
  document.querySelectorAll("[data-chapter]").forEach(card => {
    card.addEventListener("click", () => {
      const chapter = card.getAttribute("data-chapter");
      if (chapter === "thailand") switchPage("chapter-thailand");
      if (chapter === "highlands") switchPage("chapter-highlands");
      // Optionnel : ajouter amsterdam ici si la page existait
    });
  });


  // --- SYSTÈME DE FILTRES (PAGE CHAPITRES) ---
  const filterButtons = document.querySelectorAll(".filter-btn");
  const filterableItems = document.querySelectorAll(".filterable-item");

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Activer visuellement le bouton cliqué
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      filterableItems.forEach(item => {
        const itemCategory = item.getAttribute("data-category");
        if (filterValue === "all" || itemCategory === filterValue) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  });


  // --- ROBUSTE SYSTÈME DE LIGHTBOX INTÉRACTIVE ---
  const lightbox = document.getElementById("lightbox");
  const lightboxDisplay = document.getElementById("lightbox-display");
  const btnClose = document.getElementById("lightbox-close");
  const btnPrev = document.getElementById("lightbox-prev");
  const btnNext = document.getElementById("lightbox-next");

  let currentGalleryItems = [];
  let currentImgIndex = 0;

  // Ouvrir la Lightbox
  function openLightbox(items, index) {
    currentGalleryItems = Array.from(items);
    currentImgIndex = parseInt(index, 10);
    
    updateLightboxDisplay();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden"; // Bloque le scroll en arrière plan
  }

  // Mettre à jour l'image (le dégradé simulant le visuel) à l'intérieur
  function updateLightboxDisplay() {
    const targetItem = currentGalleryItems[currentImgIndex];
    // On extrait le background de l'image cliquée pour le cloner dans la lightbox
    const backgroundStyle = window.getComputedStyle(targetItem).backgroundImage;
    lightboxDisplay.style.backgroundImage = backgroundStyle;
  }

  // Navigation interne
  function nextImage() {
    currentImgIndex = (currentImgIndex + 1) % currentGalleryItems.length;
    updateLightboxDisplay();
  }

  function prevImage() {
    currentImgIndex = (currentImgIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
    updateLightboxDisplay();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "auto";
  }

  // Brancher les événements sur toutes les galeries du site
  document.querySelectorAll(".gallery-grid").forEach(gallery => {
    const items = gallery.querySelectorAll(".gallery-item");
    items.forEach(item => {
      item.addEventListener("click", () => {
        const index = item.getAttribute("data-index");
        openLightbox(items, index);
      });
    });
  });

  // Événements boutons Lightbox
  btnNext.addEventListener("click", (e) => { e.stopPropagation(); nextImage(); });
  btnPrev.addEventListener("click", (e) => { e.stopPropagation(); prevImage(); });
  btnClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", closeLightbox); // Ferme si on clique sur le fond sombre

  // Support des touches du clavier pour l'accessibilité
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });
});