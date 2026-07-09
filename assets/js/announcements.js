/* ========================================
   UTUGI JSS — ANNOUNCEMENTS PAGE ENGINE
   Loads, filters, and renders announcement cards
   Depends on: search.js (DataService, FilterEngine, utilities)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('announcementSearch');
  const categoryFilter = document.getElementById('filterCategory');
  const sortFilter = document.getElementById('filterSort');
  const clearBtn = document.getElementById('filterClear');
  const resultsInfo = document.getElementById('resultsInfo');
  const announcementsList = document.getElementById('announcementsList');

  let allAnnouncements = [];

  // ========================================
  // INITIALIZE
  // ========================================
  async function init() {
    showLoading();
    allAnnouncements = await DataService.getAnnouncements();
    renderAnnouncements();
    bindEvents();
  }

  // ========================================
  // RENDER ANNOUNCEMENTS
  // ========================================
  function renderAnnouncements() {
    const filters = getCurrentFilters();
    const filtered = FilterEngine.apply(allAnnouncements, filters);

    if (resultsInfo) {
      resultsInfo.textContent = `${filtered.length} announcement${filtered.length !== 1 ? 's' : ''} found`;
    }

    if (filtered.length === 0) {
      announcementsList.innerHTML = renderEmptyState();
    } else {
      announcementsList.innerHTML = filtered.map(renderAnnouncementCard).join('');
    }

    // Animate
    requestAnimationFrame(() => {
      announcementsList.querySelectorAll('.announcement-card-full').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 80);
      });
    });
  }

  /**
   * Render a single announcement card
   */
  function renderAnnouncementCard(announcement) {
    const date = new Date(announcement.date);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-KE', { month: 'short' });
    const year = date.getFullYear();
    const categoryClass = getCategoryClass(announcement.category);

    return `
      <div class="announcement-card-full ${announcement.important ? 'is-important' : ''}">
        <div class="announcement-card-full__date">
          <div class="announcement-card-full__day">${day}</div>
          <div class="announcement-card-full__month">${month} ${year}</div>
        </div>
        <div class="announcement-card-full__body">
          <span class="announcement-card-full__category ${categoryClass}">${announcement.category}</span>
          ${announcement.important ? '<span class="announcement-card-full__important-badge"><i class="fa-solid fa-star"></i> Important</span>' : ''}
          <h3 class="announcement-card-full__title">${announcement.title}</h3>
          <p class="announcement-card-full__content">${announcement.content}</p>
        </div>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">📢</div>
        <h3 class="empty-state__title">No Announcements Found</h3>
        <p class="empty-state__text">Try changing your search or filter settings.</p>
      </div>
    `;
  }

  function showLoading() {
    if (!announcementsList) return;
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += `
        <div class="announcement-card-full" style="opacity: 0.5;">
          <div class="skeleton" style="width: 100px; min-height: 100px;"></div>
          <div style="flex: 1; padding: 1rem;">
            <div class="skeleton" style="height: 14px; width: 80px; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 20px; width: 60%; margin-bottom: 10px;"></div>
            <div class="skeleton" style="height: 14px; width: 90%;"></div>
          </div>
        </div>
      `;
    }
    announcementsList.innerHTML = html;
  }

  // ========================================
  // FILTERS
  // ========================================
  function getCurrentFilters() {
    return {
      category: categoryFilter?.value || 'all',
      sort: sortFilter?.value || 'newest',
      search: searchInput?.value || ''
    };
  }

  function resetFilters() {
    if (categoryFilter) categoryFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'newest';
    if (searchInput) searchInput.value = '';
    renderAnnouncements();
  }

  // ========================================
  // EVENT BINDINGS
  // ========================================
  function bindEvents() {
    [categoryFilter, sortFilter].forEach(el => {
      el?.addEventListener('change', renderAnnouncements);
    });

    searchInput?.addEventListener('input', debounce(renderAnnouncements, 300));

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderAnnouncements();
      }
    });

    clearBtn?.addEventListener('click', resetFilters);
  }

  init();
});


/**
 * Homepage: Load latest announcements dynamically
 * Call this from the homepage to populate the announcements section
 */
async function loadHomeAnnouncements() {
  const container = document.getElementById('homeAnnouncementsGrid');
  if (!container) return;

  try {
    const announcements = await DataService.getAnnouncements();
    // Get 3 most recent announcements
    const recent = [...announcements]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    container.innerHTML = recent.map(ann => {
      const date = new Date(ann.date);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-KE', { month: 'short' });

      return `
        <div class="card announcement-card animate-on-scroll">
          <div class="announcement-date">
            <div class="day">${day}</div>
            <div class="month">${month}</div>
          </div>
          <div>
            <h4>${ann.title}</h4>
            <p>${ann.content.substring(0, 120)}${ann.content.length > 120 ? '...' : ''}</p>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load home announcements:', error);
  }
}
