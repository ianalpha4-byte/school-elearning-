/* ========================================
   UTUGI JSS — RESOURCES PAGE ENGINE
   Loads, filters, searches, and renders resource cards
   Depends on: search.js (DataService, FilterEngine, Paginator, utilities)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('resourceSearch');
  const searchBtn = document.getElementById('resourceSearchBtn');
  const gradeFilter = document.getElementById('filterGrade');
  const subjectFilter = document.getElementById('filterSubject');
  const typeFilter = document.getElementById('filterType');
  const sortFilter = document.getElementById('filterSort');
  const clearBtn = document.getElementById('filterClear');
  const resultsInfo = document.getElementById('resultsInfo');
  const resourcesGrid = document.getElementById('resourcesGrid');
  const paginationContainer = document.getElementById('pagination');

  let allResources = [];
  let currentPage = 1;
  const ITEMS_PER_PAGE = 12;

  // ========================================
  // INITIALIZE
  // ========================================
  async function init() {
    showLoadingSkeletons();
    allResources = await DataService.getResources();
    renderResources();
    bindEvents();
  }

  // ========================================
  // RENDER RESOURCES
  // ========================================
  function renderResources() {
    const filters = getCurrentFilters();
    const filtered = FilterEngine.apply(allResources, filters);
    const paged = Paginator.getPage(filtered, currentPage, ITEMS_PER_PAGE);

    // Update results count
    if (resultsInfo) {
      resultsInfo.textContent = `${paged.total} resource${paged.total !== 1 ? 's' : ''} found`;
    }

    // Render cards
    if (paged.items.length === 0) {
      resourcesGrid.innerHTML = renderEmptyState();
    } else {
      resourcesGrid.innerHTML = paged.items.map(renderResourceCard).join('');
    }

    // Render pagination
    Paginator.render(paginationContainer, paged.totalPages, paged.currentPage, (page) => {
      currentPage = page;
      renderResources();
      resourcesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Animate cards
    requestAnimationFrame(() => {
      resourcesGrid.querySelectorAll('.resource-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });
  }

  /**
   * Render a single resource card
   */
  function renderResourceCard(resource) {
    const thumbnailSrc = resource.thumbnail
      ? getAssetPath(resource.thumbnail)
      : getPlaceholderSVG(resource.subject);

    return `
      <div class="resource-card" data-id="${resource.id}">
        <div class="resource-card__thumbnail">
          <img src="${thumbnailSrc}" alt="${resource.title}" loading="lazy"
               onerror="this.src='${getPlaceholderSVG(resource.subject)}'">
          <span class="resource-card__type-badge ${getTypeBadgeClass(resource.type)}">${resource.type}</span>
        </div>
        <div class="resource-card__body">
          <div class="resource-card__tags">
            <span class="tag tag--grade">${resource.grade}</span>
            <span class="tag tag--subject">${resource.subject}</span>
          </div>
          <h3 class="resource-card__title">${resource.title}</h3>
          <p class="resource-card__topic"><i class="fa-solid fa-bookmark"></i> ${resource.topic}</p>
          <p class="resource-card__description">${resource.description}</p>
          <div class="resource-card__meta">
            <span><i class="fa-solid fa-file"></i> ${resource.fileSize}</span>
            <span><i class="fa-regular fa-calendar"></i> ${formatDate(resource.dateUploaded)}</span>
          </div>
          <div class="resource-card__actions">
            <button class="btn-resource btn-download" onclick="downloadFile('${resource.file}', '${resource.title}')" title="Download">
              <i class="fa-solid fa-download"></i> Download
            </button>
            <button class="btn-resource btn-print" onclick="printFile('${resource.file}', '${resource.title}')" title="Print">
              <i class="fa-solid fa-print"></i> Print
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state when no results found
   */
  function renderEmptyState() {
    return `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state__icon">🔍</div>
        <h3 class="empty-state__title">No Resources Found</h3>
        <p class="empty-state__text">Try adjusting your search or filters to find what you're looking for.</p>
        <button class="btn btn-primary" onclick="document.getElementById('filterClear').click()" style="margin-top: 1rem;">Clear All Filters</button>
      </div>
    `;
  }

  /**
   * Show loading skeletons while data loads
   */
  function showLoadingSkeletons() {
    if (!resourcesGrid) return;
    let skeletons = '';
    for (let i = 0; i < 6; i++) {
      skeletons += `
        <div class="skeleton-card">
          <div class="skeleton skeleton-card__img"></div>
          <div class="skeleton skeleton-card__line" style="margin-top: 16px;"></div>
          <div class="skeleton skeleton-card__line skeleton-card__line--short"></div>
          <div class="skeleton skeleton-card__line skeleton-card__line--medium"></div>
          <div class="skeleton skeleton-card__line skeleton-card__line--short" style="margin-bottom: 16px;"></div>
        </div>
      `;
    }
    resourcesGrid.innerHTML = skeletons;
  }

  // ========================================
  // FILTERS
  // ========================================
  function getCurrentFilters() {
    return {
      grade: gradeFilter?.value || 'all',
      subject: subjectFilter?.value || 'all',
      type: typeFilter?.value || 'all',
      sort: sortFilter?.value || 'newest',
      search: searchInput?.value || ''
    };
  }

  function resetFilters() {
    if (gradeFilter) gradeFilter.value = 'all';
    if (subjectFilter) subjectFilter.value = 'all';
    if (typeFilter) typeFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'newest';
    if (searchInput) searchInput.value = '';
    currentPage = 1;
    renderResources();
  }

  // ========================================
  // EVENT BINDINGS
  // ========================================
  function bindEvents() {
    // Filter dropdowns
    [gradeFilter, subjectFilter, typeFilter, sortFilter].forEach(el => {
      el?.addEventListener('change', () => {
        currentPage = 1;
        renderResources();
      });
    });

    // Search input with debounce
    searchInput?.addEventListener('input', debounce(() => {
      currentPage = 1;
      renderResources();
    }, 300));

    // Search button
    searchBtn?.addEventListener('click', () => {
      currentPage = 1;
      renderResources();
    });

    // Enter key in search
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        currentPage = 1;
        renderResources();
      }
    });

    // Clear filters
    clearBtn?.addEventListener('click', resetFilters);
  }

  // ========================================
  // URL Parameters (shareable filtered views)
  // ========================================
  function readURLParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('grade') && gradeFilter) gradeFilter.value = params.get('grade');
    if (params.get('subject') && subjectFilter) subjectFilter.value = params.get('subject');
    if (params.get('type') && typeFilter) typeFilter.value = params.get('type');
    if (params.get('search') && searchInput) searchInput.value = params.get('search');
  }

  // Read URL params before init
  readURLParams();
  init();
});
