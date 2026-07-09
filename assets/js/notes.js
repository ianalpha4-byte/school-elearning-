/* ========================================
   UTUGI JSS — NOTES PAGE ENGINE
   Loads, filters, searches, and renders note cards
   Depends on: search.js (DataService, FilterEngine, Paginator, utilities)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('notesSearch');
  const gradeFilter = document.getElementById('filterGrade');
  const subjectFilter = document.getElementById('filterSubject');
  const fileTypeFilter = document.getElementById('filterFileType');
  const sortFilter = document.getElementById('filterSort');
  const clearBtn = document.getElementById('filterClear');
  const resultsInfo = document.getElementById('resultsInfo');
  const notesList = document.getElementById('notesList');
  const paginationContainer = document.getElementById('pagination');

  // PDF Viewer Modal
  const pdfModal = document.getElementById('pdfModal');
  const pdfViewer = document.getElementById('pdfViewer');
  const pdfTitle = document.getElementById('pdfTitle');
  const pdfClose = document.getElementById('pdfClose');

  let allNotes = [];
  let currentPage = 1;
  const ITEMS_PER_PAGE = 10;

  // ========================================
  // INITIALIZE
  // ========================================
  async function init() {
    showLoading();
    allNotes = await DataService.getNotes();
    renderNotes();
    bindEvents();
  }

  // ========================================
  // RENDER NOTES
  // ========================================
  function renderNotes() {
    const filters = getCurrentFilters();
    const filtered = FilterEngine.apply(allNotes, filters);
    const paged = Paginator.getPage(filtered, currentPage, ITEMS_PER_PAGE);

    // Update results count
    if (resultsInfo) {
      resultsInfo.textContent = `${paged.total} note${paged.total !== 1 ? 's' : ''} found`;
    }

    if (paged.items.length === 0) {
      notesList.innerHTML = renderEmptyState();
    } else {
      notesList.innerHTML = paged.items.map(renderNoteCard).join('');
    }

    // Pagination
    Paginator.render(paginationContainer, paged.totalPages, paged.currentPage, (page) => {
      currentPage = page;
      renderNotes();
      notesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Animate
    requestAnimationFrame(() => {
      notesList.querySelectorAll('.note-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateX(0)';
        }, i * 80);
      });
    });
  }

  /**
   * Render a single note card
   */
  function renderNoteCard(note) {
    const iconClass = `note-card__icon--${note.fileType.toLowerCase()}`;
    const fileIcon = getFileIcon(note.fileType);
    const canView = note.fileType === 'PDF';

    return `
      <div class="note-card" data-id="${note.id}">
        <div class="note-card__icon ${iconClass}">
          <i class="${fileIcon}"></i>
        </div>
        <div class="note-card__content">
          <h3 class="note-card__title">${note.title}</h3>
          <p class="note-card__description">${note.description || ''}</p>
          <div class="note-card__tags">
            <span class="tag tag--grade">${note.grade}</span>
            <span class="tag tag--subject">${note.subject}</span>
            <span class="tag" style="background: rgba(108,117,125,0.1); color: var(--dark-gray);">${note.topic}</span>
          </div>
          <div class="note-card__meta">
            <span><i class="fa-solid fa-file"></i> ${note.fileType} · ${note.fileSize}</span>
            <span><i class="fa-regular fa-calendar"></i> ${formatDate(note.dateUploaded)}</span>
          </div>
        </div>
        <div class="note-card__actions">
          ${canView ? `<button class="btn-resource btn-view" onclick="openPDFViewer('${note.file}', '${note.title.replace(/'/g, "\\'")}')" title="View PDF"><i class="fa-solid fa-eye"></i> View</button>` : ''}
          <button class="btn-resource btn-download" onclick="downloadFile('${note.file}', '${note.title}')" title="Download">
            <i class="fa-solid fa-download"></i> Download
          </button>
          <button class="btn-resource btn-print" onclick="printFile('${note.file}', '${note.title}')" title="Print">
            <i class="fa-solid fa-print"></i> Print
          </button>
        </div>
      </div>
    `;
  }

  function getFileIcon(fileType) {
    const icons = {
      'PDF': 'fa-solid fa-file-pdf',
      'DOC': 'fa-solid fa-file-word',
      'DOCX': 'fa-solid fa-file-word'
    };
    return icons[fileType] || 'fa-solid fa-file';
  }

  function renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
        <h3 class="empty-state__title">No Notes Found</h3>
        <p class="empty-state__text">Try changing your search or filter settings.</p>
        <button class="btn btn-primary" onclick="document.getElementById('filterClear').click()" style="margin-top: 1rem;">Clear All Filters</button>
      </div>
    `;
  }

  function showLoading() {
    if (!notesList) return;
    let html = '';
    for (let i = 0; i < 4; i++) {
      html += `
        <div class="note-card" style="opacity: 0.5;">
          <div class="skeleton" style="width: 56px; height: 56px; border-radius: 8px;"></div>
          <div style="flex: 1;">
            <div class="skeleton" style="height: 18px; width: 60%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 14px; width: 90%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 12px; width: 40%;"></div>
          </div>
        </div>
      `;
    }
    notesList.innerHTML = html;
  }

  // ========================================
  // PDF VIEWER MODAL
  // ========================================
  window.openPDFViewer = function (filePath, title) {
    if (!pdfModal || !pdfViewer) return;
    pdfViewer.src = getAssetPath(filePath);
    if (pdfTitle) pdfTitle.textContent = title;
    pdfModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closePDFViewer() {
    if (!pdfModal) return;
    pdfModal.classList.remove('active');
    document.body.style.overflow = '';
    if (pdfViewer) pdfViewer.src = '';
  }

  pdfClose?.addEventListener('click', closePDFViewer);
  pdfModal?.addEventListener('click', (e) => {
    if (e.target === pdfModal) closePDFViewer();
  });

  // ========================================
  // FILTERS
  // ========================================
  function getCurrentFilters() {
    return {
      grade: gradeFilter?.value || 'all',
      subject: subjectFilter?.value || 'all',
      fileType: fileTypeFilter?.value || 'all',
      sort: sortFilter?.value || 'newest',
      search: searchInput?.value || ''
    };
  }

  function resetFilters() {
    if (gradeFilter) gradeFilter.value = 'all';
    if (subjectFilter) subjectFilter.value = 'all';
    if (fileTypeFilter) fileTypeFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'newest';
    if (searchInput) searchInput.value = '';
    currentPage = 1;
    renderNotes();
  }

  // ========================================
  // EVENT BINDINGS
  // ========================================
  function bindEvents() {
    [gradeFilter, subjectFilter, fileTypeFilter, sortFilter].forEach(el => {
      el?.addEventListener('change', () => {
        currentPage = 1;
        renderNotes();
      });
    });

    searchInput?.addEventListener('input', debounce(() => {
      currentPage = 1;
      renderNotes();
    }, 300));

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        currentPage = 1;
        renderNotes();
      }
    });

    clearBtn?.addEventListener('click', resetFilters);

    // ESC to close PDF viewer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePDFViewer();
    });
  }

  init();
});
