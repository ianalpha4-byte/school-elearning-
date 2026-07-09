/* ========================================
   UTUGI JSS — ENHANCED GALLERY ENGINE
   Educational image library with preview, download, print
   Depends on: search.js (DataService, FilterEngine, utilities)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('gallerySearch');
  const gradeFilter = document.getElementById('filterGrade');
  const subjectFilter = document.getElementById('filterSubject');
  const clearBtn = document.getElementById('filterClear');
  const resultsInfo = document.getElementById('resultsInfo');
  const galleryGrid = document.getElementById('galleryEduGrid');

  // Lightbox elements
  const lightbox = document.getElementById('lightboxEnhanced');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxSubject = document.getElementById('lightboxSubject');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxDownload = document.getElementById('lightboxDownload');
  const lightboxPrint = document.getElementById('lightboxPrint');

  let allImages = [];
  let filteredImages = [];
  let currentLightboxIndex = 0;

  // ========================================
  // INITIALIZE
  // ========================================
  async function init() {
    showLoading();
    allImages = await DataService.getGallery();
    renderGallery();
    bindEvents();
  }

  // ========================================
  // RENDER GALLERY
  // ========================================
  function renderGallery() {
    const filters = getCurrentFilters();
    filteredImages = FilterEngine.apply(allImages, filters);

    if (resultsInfo) {
      resultsInfo.textContent = `${filteredImages.length} image${filteredImages.length !== 1 ? 's' : ''} found`;
    }

    if (filteredImages.length === 0) {
      galleryGrid.innerHTML = renderEmptyState();
    } else {
      galleryGrid.innerHTML = filteredImages.map((img, index) => renderGalleryItem(img, index)).join('');
    }

    // Animate
    requestAnimationFrame(() => {
      galleryGrid.querySelectorAll('.gallery-edu-item').forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        }, i * 50);
      });
    });
  }

  /**
   * Render a single gallery item
   */
  function renderGalleryItem(image, index) {
    const imgSrc = getAssetPath(image.image);
    const placeholderSrc = getPlaceholderSVG(image.subject, '#2d8f4e');

    return `
      <div class="gallery-edu-item" data-index="${index}" onclick="openGalleryLightbox(${index})">
        <div class="gallery-edu-item__img">
          <img src="${imgSrc}" alt="${image.title}" loading="lazy"
               onerror="this.src='${placeholderSrc}'">
          <div class="gallery-edu-item__overlay">
            <div class="gallery-edu-item__overlay-actions">
              <button onclick="event.stopPropagation(); downloadFile('${image.image}', '${image.title}')" title="Download" aria-label="Download ${image.title}">
                <i class="fa-solid fa-download"></i>
              </button>
              <button onclick="event.stopPropagation(); printFile('${image.image}', '${image.title}')" title="Print" aria-label="Print ${image.title}">
                <i class="fa-solid fa-print"></i>
              </button>
              <button onclick="event.stopPropagation(); openGalleryLightbox(${index})" title="Preview" aria-label="Preview ${image.title}">
                <i class="fa-solid fa-expand"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="gallery-edu-item__info">
          <h4 class="gallery-edu-item__title">${image.title}</h4>
          <span class="gallery-edu-item__subject">${image.subject} · ${image.grade}</span>
        </div>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state__icon">🖼️</div>
        <h3 class="empty-state__title">No Images Found</h3>
        <p class="empty-state__text">Try adjusting your search or filters.</p>
      </div>
    `;
  }

  function showLoading() {
    if (!galleryGrid) return;
    let html = '';
    for (let i = 0; i < 6; i++) {
      html += `
        <div class="gallery-edu-item" style="opacity: 0.5;">
          <div class="skeleton" style="height: 200px;"></div>
          <div style="padding: 12px;">
            <div class="skeleton" style="height: 14px; width: 70%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 12px; width: 50%;"></div>
          </div>
        </div>
      `;
    }
    galleryGrid.innerHTML = html;
  }

  // ========================================
  // LIGHTBOX
  // ========================================
  window.openGalleryLightbox = function (index) {
    if (!lightbox || !lightboxImg) return;
    currentLightboxIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function updateLightbox() {
    const image = filteredImages[currentLightboxIndex];
    if (!image) return;

    lightboxImg.src = getAssetPath(image.image);
    lightboxImg.alt = image.title;
    if (lightboxTitle) lightboxTitle.textContent = image.title;
    if (lightboxSubject) lightboxSubject.textContent = `${image.subject} · ${image.grade} · ${image.topic}`;
  }

  function closeLightbox() {
    lightbox?.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  lightboxPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex - 1 + filteredImages.length) % filteredImages.length;
    updateLightbox();
  });

  lightboxNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex + 1) % filteredImages.length;
    updateLightbox();
  });

  lightboxDownload?.addEventListener('click', () => {
    const image = filteredImages[currentLightboxIndex];
    if (image) downloadFile(image.image, image.title);
  });

  lightboxPrint?.addEventListener('click', () => {
    const image = filteredImages[currentLightboxIndex];
    if (image) printFile(image.image, image.title);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev?.click();
    if (e.key === 'ArrowRight') lightboxNext?.click();
  });

  // ========================================
  // FILTERS
  // ========================================
  function getCurrentFilters() {
    return {
      grade: gradeFilter?.value || 'all',
      subject: subjectFilter?.value || 'all',
      search: searchInput?.value || '',
      sort: 'newest'
    };
  }

  function resetFilters() {
    if (gradeFilter) gradeFilter.value = 'all';
    if (subjectFilter) subjectFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    renderGallery();
  }

  // ========================================
  // EVENT BINDINGS
  // ========================================
  function bindEvents() {
    [gradeFilter, subjectFilter].forEach(el => {
      el?.addEventListener('change', renderGallery);
    });

    searchInput?.addEventListener('input', debounce(renderGallery, 300));

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderGallery();
      }
    });

    clearBtn?.addEventListener('click', resetFilters);
  }

  init();
});
