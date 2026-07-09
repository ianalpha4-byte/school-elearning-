/* ========================================
   UTUGI JSS — GLOBAL SEARCH MODULE
   Searches across all JSON data sources
   ======================================== */

/**
 * DataService — Singleton for fetching and caching JSON data
 * Used by all resource pages to avoid duplicate network requests
 */
const DataService = (() => {
  const cache = {};
  const basePath = '';

  /**
   * Detect the correct base path for JSON data files.
   * Pages in /pages/ need '../data/' while root pages need 'data/'
   */
  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
      return '../data/';
    }
    return 'data/';
  }

  /**
   * Fetch JSON data from a file, using cache if available
   * @param {string} filename - Name of the JSON file (e.g., 'resources.json')
   * @returns {Promise<Array>} Parsed JSON array
   */
  async function fetchData(filename) {
    if (cache[filename]) {
      return cache[filename];
    }

    try {
      const response = await fetch(getBasePath() + filename);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status}`);
      }
      let data = await response.json();
      
      // Handle Decap CMS nested list widget structure
      if (!Array.isArray(data)) {
        data = data.items || [];
      }
      
      cache[filename] = data;
      return data;
    } catch (error) {
      console.error(`DataService error loading ${filename}:`, error);
      return [];
    }
  }

  /**
   * Get all resources
   */
  async function getResources() {
    return fetchData('resources.json');
  }

  /**
   * Get all notes
   */
  async function getNotes() {
    return fetchData('notes.json');
  }

  /**
   * Get all announcements
   */
  async function getAnnouncements() {
    return fetchData('announcements.json');
  }

  /**
   * Get all gallery images
   */
  async function getGallery() {
    return fetchData('gallery.json');
  }

  /**
   * Search across all data sources
   * @param {string} query - Search term
   * @returns {Promise<Array>} Unified results with source type
   */
  async function searchAll(query) {
    if (!query || query.trim().length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();

    const [resources, notes, announcements, gallery] = await Promise.all([
      getResources(),
      getNotes(),
      getAnnouncements(),
      getGallery()
    ]);

    const results = [];

    // Search resources
    resources.forEach(item => {
      if (matchesQuery(item, normalizedQuery, ['title', 'subject', 'grade', 'topic', 'description', 'type'])) {
        results.push({ ...item, _source: 'resource' });
      }
    });

    // Search notes
    notes.forEach(item => {
      if (matchesQuery(item, normalizedQuery, ['title', 'subject', 'grade', 'topic', 'description'])) {
        results.push({ ...item, _source: 'note' });
      }
    });

    // Search gallery
    gallery.forEach(item => {
      if (matchesQuery(item, normalizedQuery, ['title', 'subject', 'grade', 'topic', 'description'])) {
        results.push({ ...item, _source: 'gallery' });
      }
    });

    // Search announcements
    announcements.forEach(item => {
      if (matchesQuery(item, normalizedQuery, ['title', 'content', 'category'])) {
        results.push({ ...item, _source: 'announcement' });
      }
    });

    return results;
  }

  /**
   * Check if an item matches a search query across specified fields
   */
  function matchesQuery(item, query, fields) {
    return fields.some(field => {
      const value = item[field];
      return value && value.toLowerCase().includes(query);
    });
  }

  return {
    getResources,
    getNotes,
    getAnnouncements,
    getGallery,
    searchAll,
    matchesQuery
  };
})();


/**
 * FilterEngine — Shared filtering logic for resource pages
 */
const FilterEngine = {
  /**
   * Filter an array of items by multiple criteria
   * @param {Array} items - Data array
   * @param {Object} filters - { grade, subject, type, sort }
   * @returns {Array} Filtered and sorted items
   */
  apply(items, filters = {}) {
    let result = [...items];

    if (filters.grade && filters.grade !== 'all') {
      result = result.filter(item => item.grade === filters.grade);
    }

    if (filters.subject && filters.subject !== 'all') {
      result = result.filter(item => item.subject === filters.subject);
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter(item => item.type === filters.type);
    }

    if (filters.fileType && filters.fileType !== 'all') {
      result = result.filter(item => item.fileType === filters.fileType);
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(item =>
        DataService.matchesQuery(item, query, ['title', 'subject', 'grade', 'topic', 'description', 'type', 'content', 'category'])
      );
    }

    // Sort
    if (filters.sort === 'newest') {
      result.sort((a, b) => new Date(b.dateUploaded || b.date) - new Date(a.dateUploaded || a.date));
    } else if (filters.sort === 'oldest') {
      result.sort((a, b) => new Date(a.dateUploaded || a.date) - new Date(b.dateUploaded || b.date));
    } else if (filters.sort === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }
};


/**
 * Pagination helper
 */
const Paginator = {
  /**
   * Get a page of items
   * @param {Array} items - Full data array
   * @param {number} page - Current page (1-indexed)
   * @param {number} perPage - Items per page
   * @returns {{ items: Array, totalPages: number, currentPage: number, total: number }}
   */
  getPage(items, page = 1, perPage = 12) {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * perPage;
    const paginatedItems = items.slice(start, start + perPage);

    return { items: paginatedItems, totalPages, currentPage, total };
  },

  /**
   * Render pagination buttons into a container
   * @param {HTMLElement} container - DOM element for pagination
   * @param {number} totalPages
   * @param {number} currentPage
   * @param {Function} onPageChange - Callback with new page number
   */
  render(container, totalPages, currentPage, onPageChange) {
    if (!container || totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';

    // Previous button
    html += `<button class="pagination__btn pagination__btn--arrow" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" aria-label="Previous page">‹</button>`;

    // Page buttons
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination__btn" data-page="1">1</button>`;
      if (startPage > 2) html += `<span class="pagination__dots">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="pagination__dots">…</span>`;
      html += `<button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    html += `<button class="pagination__btn pagination__btn--arrow" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" aria-label="Next page">›</button>`;

    container.innerHTML = html;

    // Attach click handlers
    container.querySelectorAll('.pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (!isNaN(page)) onPageChange(page);
      });
    });
  }
};


/**
 * Utility: Format a date string to readable format
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-KE', options);
}


/**
 * Utility: Get correct asset path based on current page location
 * Pages inside /pages/ need '../' prefix for root-level assets
 */
function getAssetPath(path) {
  if (!path) return '';
  const currentPath = window.location.pathname;
  if (currentPath.includes('/pages/')) {
    return '../' + path;
  }
  return path;
}


/**
 * Utility: Trigger file download
 * @param {string} url - File URL
 * @param {string} filename - Suggested filename
 */
function downloadFile(url, filename) {
  const resolvedUrl = getAssetPath(url);
  const a = document.createElement('a');
  a.href = resolvedUrl;
  a.download = filename || url.split('/').pop();
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


/**
 * Utility: Open print dialog for an image or document
 * @param {string} url - File URL to print
 * @param {string} title - Title for the print window
 */
function printFile(url, title) {
  const resolvedUrl = getAssetPath(url);
  const ext = url.split('.').pop().toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    // Print image
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print — ${title || 'Image'}</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { max-width: 100%; max-height: 100vh; }
          @media print {
            body { margin: 0; }
            img { max-width: 100%; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <img src="${resolvedUrl}" alt="${title || 'Image'}" onload="window.print(); window.close();">
      </body>
      </html>
    `);
    printWindow.document.close();
  } else if (ext === 'pdf') {
    // Open PDF in new tab for printing
    const printWindow = window.open(resolvedUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  } else {
    // For DOC/DOCX — trigger download since browsers can't natively print these
    downloadFile(url, title);
  }
}


/**
 * Utility: Debounce function for search input
 */
function debounce(func, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}


/**
 * Utility: Get type badge CSS class
 */
function getTypeBadgeClass(type) {
  const map = {
    'Pictures': 'resource-card__type-badge--pictures',
    'Notes': 'resource-card__type-badge--notes',
    'Assignments': 'resource-card__type-badge--assignments',
    'Revision Papers': 'resource-card__type-badge--revision-papers',
    'Worksheets': 'resource-card__type-badge--worksheets'
  };
  return map[type] || '';
}


/**
 * Utility: Get category badge CSS class
 */
function getCategoryClass(category) {
  const map = {
    'Academic': 'announcement-card-full__category--academic',
    'Meeting': 'announcement-card-full__category--meeting',
    'Sports': 'announcement-card-full__category--sports',
    'Examinations': 'announcement-card-full__category--examinations',
    'Events': 'announcement-card-full__category--events'
  };
  return map[category] || 'announcement-card-full__category--academic';
}


/**
 * Utility: Generate a placeholder SVG for missing thumbnails
 */
function getPlaceholderSVG(text, color = '#1a3a5c') {
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">
      <rect fill="${color}" width="300" height="180" rx="8"/>
      <text fill="rgba(255,255,255,0.3)" font-family="Arial,sans-serif" font-size="14" font-weight="bold" text-anchor="middle" x="150" y="90">${text || 'No Image'}</text>
      <text fill="rgba(255,255,255,0.15)" font-family="Arial,sans-serif" font-size="40" text-anchor="middle" x="150" y="105">📄</text>
    </svg>
  `);
  return `data:image/svg+xml,${encoded}`;
}
