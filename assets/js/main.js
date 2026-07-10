/* ========================================
   UTUGI JUNIOR SECONDARY SCHOOL
   Main JavaScript File
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ========================================
  // NAVBAR - Scroll Effect & Mobile Menu
  // ========================================
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navOverlay = document.querySelector('.nav-overlay');
  const navLinks = document.querySelectorAll('.nav-menu a');

  // Navbar scroll effect
  function handleNavScroll() {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll);
  handleNavScroll();

  // Mobile menu toggle
  function toggleMenu() {
    hamburger?.classList.toggle('active');
    navMenu?.classList.toggle('active');
    navOverlay?.classList.toggle('active');
    document.body.style.overflow = navMenu?.classList.contains('active') ? 'hidden' : '';
  }

  hamburger?.addEventListener('click', toggleMenu);
  navOverlay?.addEventListener('click', toggleMenu);

  // Close menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu?.classList.contains('active')) {
        toggleMenu();
      }
    });
  });

  // ========================================
  // BACK TO TOP BUTTON
  // ========================================
  const backToTop = document.querySelector('.back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTop?.classList.add('visible');
    } else {
      backToTop?.classList.remove('visible');
    }
  });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ========================================
  // SCROLL ANIMATIONS (Intersection Observer)
  // ========================================
  const animateElements = document.querySelectorAll('.animate-on-scroll');

  if (animateElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(el => observer.observe(el));
  }

  // ========================================
  // FAQ ACCORDION
  // ========================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all FAQ items
      faqItems.forEach(i => i.classList.remove('active'));
      
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ========================================
  // GALLERY FILTERS
  // ========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-grid .gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active filter
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
          item.style.animation = 'fadeIn 0.5s ease';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ========================================
  // LIGHTBOX
  // ========================================
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
  const lightboxNext = lightbox?.querySelector('.lightbox-next');
  let currentImageIndex = 0;
  let lightboxImages = [];

  // Collect gallery images for lightbox
  document.querySelectorAll('.gallery-item[data-lightbox]').forEach((item, index) => {
    const img = item.querySelector('img');
    if (img) {
      lightboxImages.push(img.src);
      item.addEventListener('click', () => {
        currentImageIndex = index;
        openLightbox(img.src);
      });
    }
  });

  function openLightbox(src) {
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    lightbox?.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  lightboxPrev?.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + lightboxImages.length) % lightboxImages.length;
    if (lightboxImg) lightboxImg.src = lightboxImages[currentImageIndex];
  });

  lightboxNext?.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % lightboxImages.length;
    if (lightboxImg) lightboxImg.src = lightboxImages[currentImageIndex];
  });

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev?.click();
    if (e.key === 'ArrowRight') lightboxNext?.click();
  });

  // ========================================
  // GRADE TABS (Academics Page)
  // ========================================
  const gradeTabs = document.querySelectorAll('.grade-tab');
  const gradeContents = document.querySelectorAll('.grade-content');

  gradeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      gradeTabs.forEach(t => t.classList.remove('active'));
      gradeContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.grade);
      target?.classList.add('active');
    });
  });

  // ========================================
  // CONTACT FORM HANDLING
  // ========================================
  const contactForm = document.getElementById('contactForm');

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simple validation
    const formData = new FormData(contactForm);
    let isValid = true;

    for (const [key, value] of formData.entries()) {
      if (!value.toString().trim()) {
        isValid = false;
        const input = contactForm.querySelector(`[name="${key}"]`);
        input?.style.setProperty('border-color', 'var(--danger)');
        setTimeout(() => input?.style.removeProperty('border-color'), 2000);
      }
    }

    if (isValid) {
      // Show success message
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn?.textContent;
      if (btn) {
        btn.textContent = '✓ Message Sent!';
        btn.style.background = 'var(--success)';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          contactForm.reset();
        }, 3000);
      }
    }
  });

  // ========================================
  // LAZY LOADING IMAGES
  // ========================================
  const lazyImages = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window && lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // ========================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ========================================
  // ACTIVE NAV LINK HIGHLIGHT
  // ========================================
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || 
        (currentPage === '' && href === 'index.html') ||
        (currentPage === '/' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ========================================
  // COUNTER ANIMATION (Stats)
  // ========================================
  function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function update() {
      start += increment;
      if (start >= target) {
        element.textContent = target + '+';
        return;
      }
      element.textContent = Math.floor(start) + '+';
      requestAnimationFrame(update);
    }
    
    update();
  }

  const statNumbers = document.querySelectorAll('[data-count]');
  
  if (statNumbers.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.count);
          animateCounter(entry.target, target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => statsObserver.observe(stat));
  }

  // ========================================
  // CURRENT YEAR IN FOOTER
  // ========================================
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

});

/**
 * Homepage: Load latest gallery items dynamically
 */
async function loadHomeGallery() {
  const container = document.getElementById('homeGalleryGrid');
  if (!container) return;

  try {
    const gallery = await DataService.getGallery();
    // Sort by date uploaded (newest first) and get 4 items
    const recent = [...gallery]
      .sort((a, b) => new Date(b.dateUploaded || 0) - new Date(a.dateUploaded || 0))
      .slice(0, 4);

    container.innerHTML = recent.map(item => `
      <div class="gallery-item animate-on-scroll animated" style="display: block; opacity: 1; transform: translateY(0);">
        <img src="${getAssetPath(item.image)}" alt="${item.title}" loading="lazy">
        <div class="gallery-overlay"><span>${item.title}</span></div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load home gallery:', error);
  }
}
