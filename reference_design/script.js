/* ───────────────────────────────────────────────────────────
   Vicharanashala FAQ — Interactive JavaScript
   ─────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── Cache DOM references ──
  const header       = document.getElementById('site-header');
  const searchInput  = document.getElementById('faq-search');
  const searchShortcut = document.getElementById('search-shortcut');
  const expandAllBtn = document.getElementById('faq-expand-all');
  const collapseAllBtn = document.getElementById('faq-collapse-all');
  const faqCount     = document.getElementById('faq-count');
  const noResults    = document.getElementById('no-results');
  const backToTop    = document.getElementById('back-to-top');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const siteNav      = document.getElementById('site-nav');
  const tocNav       = document.getElementById('toc-nav');
  const categoryPills = document.querySelectorAll('.category-pill');

  const allItems     = document.querySelectorAll('.faq-item');
  const allSections  = document.querySelectorAll('.faq-section');
  const tocLinks     = document.querySelectorAll('.toc-link');

  let activeCategory = 'all';
  let currentSearch  = '';

  // ── Initialize ──
  function init() {
    updateQuestionCount();
    updateSectionCounts();
    bindAccordion();
    bindSearch();
    bindCategoryFilters();
    bindExpandCollapse();
    bindScrollEffects();
    bindBackToTop();
    bindMobileMenu();
    bindKeyboardShortcuts();
    handleHashNavigation();
    animateSectionsOnScroll();
  }

  // ── Accordion toggle ──
  function bindAccordion() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const answer = item.querySelector('.faq-answer');
        const isActive = item.classList.contains('active');

        if (isActive) {
          closeItem(item, answer, btn);
        } else {
          openItem(item, answer, btn);
        }
      });
    });
  }

  function openItem(item, answer, btn) {
    item.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    answer.style.opacity = '1';

    // Smooth scroll into view if partially hidden
    setTimeout(() => {
      const rect = item.getBoundingClientRect();
      if (rect.top < 80) {
        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 350);
  }

  function closeItem(item, answer, btn) {
    item.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = '0';
    answer.style.opacity = '0';
  }

  // ── Search ──
  function bindSearch() {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = searchInput.value.trim().toLowerCase();
        filterFAQ();
      }, 200);
    });

    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        currentSearch = '';
        filterFAQ();
        searchInput.blur();
      }
    });
  }

  function filterFAQ() {
    let visibleCount = 0;

    // Remove old highlights
    document.querySelectorAll('.highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });

    allItems.forEach(item => {
      const questionText = item.querySelector('.q-text').textContent.toLowerCase();
      const answerText = item.querySelector('.answer-content').textContent.toLowerCase();
      const categoryMatch = activeCategory === 'all' || item.dataset.category === activeCategory;
      const searchMatch = !currentSearch || questionText.includes(currentSearch) || answerText.includes(currentSearch);

      if (categoryMatch && searchMatch) {
        item.style.display = '';
        item.classList.remove('hidden');
        visibleCount++;

        // Highlight matching text
        if (currentSearch) {
          highlightText(item.querySelector('.q-text'), currentSearch);

          // Auto-open items matching search
          const answer = item.querySelector('.faq-answer');
          const btn = item.querySelector('.faq-question');
          if (!item.classList.contains('active')) {
            openItem(item, answer, btn);
          }
          highlightText(item.querySelector('.answer-content'), currentSearch);
        }
      } else {
        item.style.display = 'none';
        item.classList.add('hidden');
      }
    });

    // Show/hide sections
    allSections.forEach(section => {
      const categoryMatch = activeCategory === 'all' || section.dataset.category === activeCategory;
      const visibleItems = section.querySelectorAll('.faq-item:not(.hidden)');
      if (!categoryMatch || visibleItems.length === 0) {
        section.style.display = 'none';
      } else {
        section.style.display = '';
      }
    });

    // Update count and no-results
    updateQuestionCount(visibleCount);
    noResults.hidden = visibleCount > 0;

    // Close all if search cleared
    if (!currentSearch) {
      allItems.forEach(item => {
        if (item.classList.contains('active')) {
          const answer = item.querySelector('.faq-answer');
          const btn = item.querySelector('.faq-question');
          closeItem(item, answer, btn);
        }
      });
    }
  }

  function highlightText(element, term) {
    if (!term) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    textNodes.forEach(node => {
      const text = node.textContent;
      const lowerText = text.toLowerCase();
      const idx = lowerText.indexOf(term);
      if (idx === -1) return;

      const before = text.substring(0, idx);
      const match = text.substring(idx, idx + term.length);
      const after = text.substring(idx + term.length);

      const mark = document.createElement('mark');
      mark.className = 'highlight';
      mark.textContent = match;

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(mark);
      if (after) frag.appendChild(document.createTextNode(after));

      node.parentNode.replaceChild(frag, node);
    });
  }

  // ── Category Filters ──
  function bindCategoryFilters() {
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.dataset.category;

        // Clear search when changing category
        searchInput.value = '';
        currentSearch = '';

        filterFAQ();

        // Scroll to content
        const mainLayout = document.getElementById('main-layout');
        if (mainLayout) {
          mainLayout.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── Expand / Collapse all ──
  function bindExpandCollapse() {
    expandAllBtn.addEventListener('click', () => {
      allItems.forEach(item => {
        if (item.style.display === 'none') return;
        const answer = item.querySelector('.faq-answer');
        const btn = item.querySelector('.faq-question');
        openItem(item, answer, btn);
      });
    });

    collapseAllBtn.addEventListener('click', () => {
      allItems.forEach(item => {
        const answer = item.querySelector('.faq-answer');
        const btn = item.querySelector('.faq-question');
        closeItem(item, answer, btn);
      });
    });
  }

  // ── Scroll Effects ──
  function bindScrollEffects() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function handleScroll() {
    const scrollY = window.scrollY;

    // Header shrink
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Back to top visibility
    if (scrollY > 600) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    // Active TOC link
    updateActiveTOC();
  }

  function updateActiveTOC() {
    let current = '';
    allSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150) {
        current = section.id;
      }
    });

    tocLinks.forEach(link => {
      if (link.dataset.section === current) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ── Back to Top ──
  function bindBackToTop() {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Mobile Menu ──
  function bindMobileMenu() {
    if (!mobileMenuBtn) return;
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      siteNav.classList.toggle('open');
    });

    // Close when clicking a nav link on mobile
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        siteNav.classList.remove('open');
      });
    });
  }

  // ── Keyboard Shortcuts ──
  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // "/" to focus search
      if (e.key === '/' && !isTyping()) {
        e.preventDefault();
        searchInput.focus();
      }

      // Escape to clear search
      if (e.key === 'Escape') {
        searchInput.blur();
        if (mobileMenuBtn && mobileMenuBtn.classList.contains('active')) {
          mobileMenuBtn.classList.remove('active');
          siteNav.classList.remove('open');
        }
      }
    });
  }

  function isTyping() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
  }

  // ── Hash Navigation ──
  function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const target = document.querySelector(hash);
        if (target) {
          // If it's a FAQ item, open it
          if (target.classList.contains('faq-item')) {
            const answer = target.querySelector('.faq-answer');
            const btn = target.querySelector('.faq-question');
            openItem(target, answer, btn);
            setTimeout(() => {
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              target.classList.add('flash');
              setTimeout(() => target.classList.remove('flash'), 1500);
            }, 100);
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 300);
    }
  }

  // ── Question Count ──
  function updateQuestionCount(count) {
    const total = allItems.length;
    const visible = count !== undefined ? count : total;
    if (visible === total) {
      faqCount.textContent = `${total} questions`;
    } else {
      faqCount.textContent = `${visible} of ${total} questions`;
    }
  }

  function updateSectionCounts() {
    allSections.forEach(section => {
      const count = section.querySelectorAll('.faq-item').length;
      const countEl = section.querySelector('.section-count');
      if (countEl) {
        countEl.textContent = `${count} question${count !== 1 ? 's' : ''}`;
      }
    });
  }

  // ── Scroll animations ──
  function animateSectionsOnScroll() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
      });

      allSections.forEach(section => {
        observer.observe(section);
      });

      // Also observe individual FAQ items for staggered animation
      allItems.forEach((item, i) => {
        item.style.transitionDelay = `${Math.min(i % 6, 5) * 0.05}s`;
        observer.observe(item);
      });
    } else {
      // Fallback: show everything
      allSections.forEach(s => s.classList.add('visible'));
      allItems.forEach(i => i.classList.add('visible'));
    }
  }

  // ── TOC sidebar link clicks with smooth scroll ──
  if (tocNav) {
    tocNav.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          // Reset category filter to show all
          categoryPills.forEach(p => p.classList.remove('active'));
          document.querySelector('[data-category="all"]').classList.add('active');
          activeCategory = 'all';
          searchInput.value = '';
          currentSearch = '';
          filterFAQ();

          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      });
    });
  }

  // ── Start ──
  document.addEventListener('DOMContentLoaded', init);

  // ── Handle window resize for mobile menu ──
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
      if (siteNav) siteNav.classList.remove('open');
    }
  });

})();

/* ════════════════════════════════════════════════════════════════
   YAKSHA-MINI AI CHATBOT + VOICE AGENT
   ════════════════════════════════════════════════════════════════ */

// ── FAQ Knowledge Base — Scoring-based matching with FAQ references ──
const YAKSHA_KB = [
  // ═══ SECTION 1: About the Internship ═══
  {
    words: ['internship', 'vins', 'vicharanashala', 'about', 'programme', 'program', 'what', 'tell', 'explain', 'overview', 'info', 'information', 'know', 'details', 'summership', 'describe', 'introduction', 'intro', 'summary', 'brief', 'basic', 'vled'],
    faq: 'q-1-1',
    faqLabel: '1.1',
    answer: '<strong>VINS</strong> (Vicharanashala Internship) is a free, two-month online internship run by the Vicharanashala Lab at <strong>IIT Ropar</strong>. You work on a real open-source project under a mentor, after a short training phase. There is no charge and no stipend — the work is real, the certificate is real, and the programme itself is free.'
  },
  {
    words: ['vins full form', 'vins stand', 'meaning vins', 'abbreviation', 'acronym', 'what vins'],
    faq: 'q-1-2',
    faqLabel: '1.2',
    answer: '<strong>VINS</strong> stands for <strong>Vicharanashala Internship</strong>. It is an online programme open to anyone who clears the interview. The certificate is from the Vicharanashala Lab for Education Design at IIT Ropar. There is no stipend, and the programme is free.'
  },
  {
    words: ['phase', 'phases', 'bronze', 'silver', 'gold', 'platinum', 'badge', 'badges', 'stage', 'stages', 'structure', 'level', 'levels', 'tier', 'tiers', 'progression'],
    faq: 'q-1-3',
    faqLabel: '1.3',
    answer: 'VINS has <strong>4 phases</strong>:<br>\u{1F949} <strong>Bronze (Phase 1)</strong> — short training period<br>\u{1F948} <strong>Silver (Phase 2)</strong> — main project work, earns certificate<br>\u{1F947} <strong>Gold (Phase 3)</strong> — for significant features<br>\u{1F3C6} <strong>Platinum (Phase 4)</strong> — visit IIT Ropar with travel support<br><br>Most interns finish at Bronze + Silver.'
  },
  {
    words: ['eligible', 'eligibility', 'who', 'alumni', 'graduated', 'student', 'enrolled', 'qualify', 'apply', 'requirement', 'requirements', 'criteria', 'prerequisite', 'can join', 'allowed', 'year', 'degree', 'undergraduate', 'postgraduate', 'phd', 'doctoral', 'working professional'],
    faq: 'q-1-4',
    faqLabel: '1.4',
    answer: 'The internship is for <strong>currently-enrolled students</strong> at any college/university — UG, PG, or doctoral. Alumni who have already graduated are <strong>not eligible</strong> this cycle. Working professionals are also not eligible. If you re-enrol later, you can apply in a future cycle.'
  },
  {
    words: ['official', 'iit ropar', 'summer research', 'same', 'institute', 'institutional', 'different from', 'equivalent'],
    faq: 'q-1-5',
    faqLabel: '1.5',
    answer: 'No — VINS (Summership 2026) is a <strong>VLED Lab initiative</strong>. The certificate is issued by the Vicharanashala Lab for Education Design, not centrally by IIT Ropar. The institute runs a separate summer research internship.'
  },
  {
    words: ['leave', 'absent', 'class', 'classes', 'tomorrow', 'today', 'attendance', 'day off', 'sick', 'holiday', 'skip'],
    faq: 'q-1-6',
    faqLabel: '1.6',
    answer: '<strong>Leave is not permitted.</strong> If you are also attending classes or exams, you will be relieved from the internship immediately and will need to join the next batch.'
  },

  // ═══ SECTION 2: Timing & Dates ═══
  {
    words: ['start', 'begin', 'when', 'join', 'start date', 'joining', 'commence', 'starting', 'when start', 'can start', 'earliest'],
    faq: 'q-2-1',
    faqLabel: '2.1',
    answer: 'You can start any time in 2026, but your internship <strong>must finish by 31 December 2026</strong>. We strongly recommend starting in <strong>May\u2013July</strong> to catch the main cohort \u2014 that\u2019s when TA support, peer networking, and training sessions are concentrated.'
  },
  {
    words: ['duration', 'how long', 'months', 'weeks', 'length', 'period', 'time', 'days', '55', 'two months', '2 months', 'grace', 'grace period'],
    faq: 'q-2-2',
    faqLabel: '2.2',
    answer: 'The internship is <strong>two months</strong> from your chosen start date, with an optional <strong>one-month grace period</strong> if needed. Your end date must land on or before 31 December 2026.'
  },
  {
    words: ['exam', 'exams', 'examination', 'july', 'august', 'later', 'defer', 'postpone', 'delay', 'semester', 'college exam', 'university exam', 'end sem'],
    faq: 'q-2-3',
    faqLabel: '2.3',
    answer: 'Yes, you can start later if exams genuinely make an earlier start impossible \u2014 but <strong>do not juggle both</strong>. Wait until exams are done, then opt in and start. Make sure your end date is on or before 31 Dec 2026.'
  },
  {
    words: ['relaxation', 'gap', 'pause', 'break', 'midway', 'split', 'juggle', 'part time', 'partial', 'half'],
    faq: 'q-2-4',
    faqLabel: '2.4',
    answer: '<strong>No relaxation or break</strong> is offered. VINS is a full-attention internship (6\u201310 hrs/day). If your exams fall during the cohort, defer your start. Juggling can lead to <strong>termination or certificate withholding</strong>.'
  },
  {
    words: ['55 day', 'continuous', 'window', 'exemption', 'attendance rule', 'exam during', 'june exam'],
    faq: 'q-2-5',
    faqLabel: '2.5',
    answer: 'The attendance rule is firm \u2014 the 55-day continuous window is non-negotiable, and no exemption can be offered for an exam during this period.'
  },
  {
    words: ['orientation', 'recording', 'recordings', 'session recording', 'video', 'recorded', 'watch later'],
    faq: 'q-2-6',
    faqLabel: '2.6',
    answer: 'Recordings of orientation sessions will <strong>not</strong> be provided. An abridged version of important talks <em>may</em> be shared \u2014 not guaranteed for every session.'
  },

  // ═══ SECTION 3: NOC ═══
  {
    words: ['noc', 'no objection', 'objection certificate', 'noc dates', 'noc format'],
    faq: 'q-3-1',
    faqLabel: '3.1',
    answer: 'The <strong>NOC</strong> must have your chosen start date \u2192 start + 2 months (with up to 1 month grace), ending on or before 31 Dec 2026. Download the blank NOC from your <a href="https://samagama.in" target="_blank">samagama.in</a> dashboard, get it physically signed & stamped, scan it, and upload as a PDF (max 1 MB).'
  },
  {
    words: ['hod', 'principal', 'dean', 'director', 'sign noc', 'signatory', 'authority', 'who sign', 'who can sign', 'tpo', 'acting'],
    faq: 'q-3-2',
    faqLabel: '3.2',
    answer: 'Any authorised signatory at your college can sign: <strong>HOD, Acting HOD, Principal, Dean, Director, or TPO</strong>. For dual-degree students, either institution works.'
  },
  {
    words: ['noc deadline', 'noc submit', 'noc when', 'noc date', 'noc late', 'noc time', 'submit noc', 'when noc'],
    faq: 'q-3-3',
    faqLabel: '3.3',
    answer: 'There is <strong>no hard deadline</strong> for the NOC. But to start properly with the cohort, submit it as early as possible. Delaying means missing the concentrated TA + mentor support window.'
  },
  {
    words: ['noc format', 'download noc', 'upload noc', 'how noc', 'noc process', 'blank noc', 'signed noc', 'scan noc', 'pdf noc', 'noc steps'],
    faq: 'q-3-4',
    faqLabel: '3.4',
    answer: 'We provide a printable NOC format. Log in to samagama.in \u2192 click <strong>Download blank NOC</strong> \u2192 print it \u2192 get it physically signed & stamped \u2192 scan it \u2192 upload the signed PDF (max 1 MB) using the <strong>Upload signed NOC</strong> button.'
  },
  {
    words: ['college own format', 'own noc', 'custom format', 'college format'],
    faq: 'q-3-5',
    faqLabel: '3.5',
    answer: 'A college\'s own NOC format is acceptable, as long as it has: the signing authority\'s <strong>handwritten signature</strong>, their <strong>official email</strong>, your <strong>full name</strong>, and your <strong>signature</strong>.'
  },
  {
    words: ['handwritten', 'physical sign', 'rubber stamp', 'seal', 'digital signature', 'hand sign'],
    faq: 'q-3-6',
    faqLabel: '3.6',
    answer: 'Yes \u2014 the NOC needs a <strong>handwritten signature</strong>, an <strong>institutional rubber stamp/seal</strong>, and the signatory\'s <strong>email address</strong>. Digital signatures are not accepted on the PDF path. If a physical printout is impractical, use the email-forward path (FAQ 3.7).'
  },
  {
    words: ['email noc', 'hod email', 'email forward', 'digital noc', 'online noc', 'email path', 'forward', 'email instead'],
    faq: 'q-3-7',
    faqLabel: '3.7',
    answer: 'Yes \u2014 your HOD can <strong>forward the text NOC via email</strong> to <code>sudarshan@iitrpr.ac.in</code> from their official institutional email. Subject must start with: <strong>"NOC for my student"</strong>.'
  },
  {
    words: ['noc verify', 'verification', 'not verified', 'pending', 'self declaration', 'self-declaration', 'tentative', 'noc status'],
    faq: 'q-3-9',
    faqLabel: '3.9',
    answer: 'NOC verification takes 1 hour to 1 working day. If you need the offer letter sooner, upload a <strong>self-declaration</strong> \u2192 a tentative offer letter is issued immediately. The formal offer follows once your NOC clears.'
  },
  {
    words: ['online course', 'masai', 'nptel', 'coursera', 'udemy', 'online degree', 'iitm bs', 'certification course'],
    faq: 'q-3-10',
    faqLabel: '3.10',
    answer: 'The internship is open only to candidates enrolled in a <strong>full-time degree programme</strong> at a recognised college. Online-only courses don\'t qualify. If you\'re concurrently in a full-time degree, get the NOC from that college.'
  },
  {
    words: ['hod wants', 'hod needs', 'written confirmation', 'proof', 'show hod', 'convince hod'],
    faq: 'q-3-11',
    faqLabel: '3.11',
    answer: 'Use the <strong>tentative offer letter</strong> route: upload a self-declaration on your profile \u2192 a tentative offer letter is issued immediately \u2192 show it to your HOD as written confirmation.'
  },

  // ═══ SECTION 4: Selection & Offer Letter ═══
  {
    words: ['selected', 'selection', 'am i selected', 'know selected', 'chosen', 'result', 'yellow', 'panel', 'got in', 'shortlisted'],
    faq: 'q-4-1',
    faqLabel: '4.1',
    answer: 'If you can see the <strong>yellow VINS result panel</strong> on your samagama.in page, you are selected. No separate confirmation email is sent.'
  },
  {
    words: ['opt', 'opt in', 'optin', 'join vins', 'accept vins', 'take up', 'enroll', 'enrol', 'how to join', 'register', 'sign up for'],
    faq: 'q-4-2',
    faqLabel: '4.2',
    answer: 'Tell Yaksha in the chat: <em>"I want to take up the online internship without stipend."</em> Yaksha will confirm. Opting in <strong>is</strong> the selection.'
  },
  {
    words: ['offer letter', 'offer', 'when offer', 'get offer', 'formal offer', 'tentative offer', 'where offer', 'download offer'],
    faq: 'q-4-3',
    faqLabel: '4.3',
    answer: '<strong>Path 1:</strong> Formal offer letter \u2014 issued once your NOC is verified and dates confirmed.<br><strong>Path 2:</strong> Tentative offer letter \u2014 upload a self-declaration and get it immediately.<br>The offer letter lives on your <strong>samagama.in dashboard</strong>, not in email.'
  },
  {
    words: ['certificate', 'cert', 'e-certificate', 'digital cert', 'completion', 'credential', 'get certificate'],
    faq: 'q-4-4',
    faqLabel: '4.4',
    answer: 'Yes! Every intern who <strong>completes</strong> the internship gets a digital e-certificate from Vicharanashala, IIT Ropar \u2014 downloadable from your dashboard, digitally signed and verifiable. Dropouts do not get a certificate.'
  },
  {
    words: ['confirm dates', 'internship dates', 'date card', 'edit dates', 'change dates', 'pick dates', 'set dates'],
    faq: 'q-4-5',
    faqLabel: '4.5',
    answer: 'On the dashboard, find the yellow card titled <strong>"\u{1F5D3}\uFE0F Confirm your internship dates"</strong>. Pick your earliest realistic start \u2014 end must be \u2264 31 Dec 2026. <strong>Before offer letter:</strong> dates are editable. <strong>After:</strong> dates are final.'
  },
  {
    words: ['minor ai', 'major ai', 'minor major', 'certification course iit', 'different track'],
    faq: 'q-4-6',
    faqLabel: '4.6',
    answer: 'Minor/Major in AI course from IIT Ropar is a certification course \u2014 there will be a different track. You should be a registered student in a UG/PG programme to join VINS.'
  },
  {
    words: ['accept', 'acceptance', 'reply all', 'reply', 'confirm offer', 'format', 'exact', 'copy paste', 'acceptance format', 'acceptance statement'],
    faq: 'q-4-7',
    faqLabel: '4.7',
    answer: '<strong>Reply All</strong> on the offer-letter thread and paste <em>exactly</em>:<br><em>"I, [Full Name], confirm that I have read, understood, and accepted all terms, conditions, and obligations set out in this offer letter and in the program FAQ at samagama.in. I formally accept the offer of Summer Internship 2026."</em><br><br>Send within <strong>5 days</strong>. Wrong format = <strong>offer withdrawn</strong>.'
  },
  {
    words: ['wrong format', 'wrong reply', 'not exact', 'incorrect', 'withdraw', 'withdrawn', 'offer withdrawn'],
    faq: 'q-4-8',
    faqLabel: '4.8',
    answer: 'If you reply without the exact acceptance format, the offer is <strong>withdrawn</strong> immediately. This is a deliberate attention-to-detail check.'
  },
  {
    words: ['withdrawal reversed', 'reverse', 'appeal', 'reconsider', 'mistake acceptance', 'get back offer'],
    faq: 'q-4-9',
    faqLabel: '4.9',
    answer: 'There is an appeal path. Send a <strong>fresh email</strong> to sudarshansudarshan@gmail.com with subject: <strong>Request to Reconsider: Confirmation Reply Error</strong>. If genuine, we respond within 24 hours.'
  },
  {
    words: ['after acceptance', 'dashboard not update', 'acceptance status', 'what next', 'after sending'],
    faq: 'q-4-10',
    faqLabel: '4.10',
    answer: 'The dashboard does <strong>not</strong> track the acceptance email \u2014 this is normal. We process them manually. If your reply was compliant, no further action is needed.'
  },
  {
    words: ['zoom link', 'kickoff', 'kick off', 'meeting link', 'orientation meeting', 'first meeting'],
    faq: 'q-4-12',
    faqLabel: '4.12',
    answer: 'The Zoom link is delivered via <strong>email</strong> and your <strong>Yaksha chat portal</strong>. The kickoff is for the main summer cohort only.'
  },
  {
    words: ['vise', 'offline', 'online offline', 'switch track', 'on campus', 'campus'],
    faq: 'q-4-15',
    faqLabel: '4.15',
    answer: 'VINS (online) and VISE (offline) are separate tracks finalised at the interview stage. <strong>Switching between tracks is not allowed.</strong>'
  },
  {
    words: ['standup', 'daily standup', 'daily zoom', 'standup link', 'mandatory standup', 'zoom standup'],
    faq: 'q-4-17',
    faqLabel: '4.17',
    answer: 'Daily Zoom standup links are posted in the <strong>Announcements section</strong> on samagama.in. <strong>Attending daily standups is mandatory</strong> for all interns.'
  },

  // ═══ SECTION 5: Work & Mentorship ═══
  {
    words: ['work', 'project', 'what will', 'assigned', 'area', 'domain', 'ai', 'ml', 'web', 'nlp', 'open source', 'annam', 'portfolio', 'type of work'],
    faq: 'q-5-1',
    faqLabel: '5.1',
    answer: 'You will work on a <strong>real open-source project</strong> from Vicharanashala\'s portfolio \u2014 assigned based on your background. Areas include AI/ML, web development, NLP, computer vision, agriculture-tech (Annam.AI), education-tech (ViBe), and more.'
  },
  {
    words: ['hours', 'per day', 'daily', 'full time', 'fulltime', 'full-time', 'how many hours', 'workload', 'time commitment'],
    faq: 'q-5-2',
    faqLabel: '5.2',
    answer: 'Plan for <strong>6 to 10 hours a day</strong>, sometimes more during the build phase. This is a full-time internship \u2014 not a side project.'
  },
  {
    words: ['mentor', 'mentorship', 'guide', 'supervisor', 'assigned mentor', 'who mentor', 'mentor not assigned', 'when mentor'],
    faq: 'q-5-3',
    faqLabel: '5.3',
    answer: 'Mentors are assigned when you move to the <strong>project phase</strong> (after Bronze coursework). The model is fluid \u2014 you\'ll get help from a senior researcher one day, a peer the next.'
  },
  {
    words: ['stipend', 'paid', 'salary', 'money', 'free', 'cost', 'charge', 'fee', 'payment', 'unpaid', 'remuneration', 'compensation', 'get paid'],
    faq: 'q-5-4',
    faqLabel: '5.4',
    answer: 'The VINS internship is <strong>unpaid \u2014 there is no stipend</strong>. It is also free (no charge). Exceptional performers <em>may</em> receive a discretionary stipend, but this is not promised or expected.'
  },
  {
    words: ['laptop', 'computer', 'hardware', 'setup', 'os', 'linux', 'mac', 'macos', 'windows', 'wsl', 'software', 'putty', 'need laptop'],
    faq: 'q-5-5',
    faqLabel: '5.5',
    answer: 'A <strong>personal laptop is required</strong>. We prefer Linux or macOS. If you use Windows, install WSL or PuTTY. A stable internet connection and webcam are also needed for ViBe.'
  },
  {
    words: ['email', 'different email', 'github email', 'mismatch', 'registered', 'wrong email', 'same email'],
    faq: 'q-5-6',
    faqLabel: '5.6',
    answer: 'Your registered email is your <strong>sole identifier</strong> across all programme platforms (samagama, ViBe, GitHub, Zoom). Mismatches cannot be retroactively corrected \u2014 use the same email everywhere.'
  },

  // ═══ SECTION 6: Communication ═══
  {
    words: ['communication', 'channel', 'contact', 'reach', 'whatsapp', 'escalate', 'announce', 'announcement', 'support', 'help channel'],
    faq: 'q-6-1',
    faqLabel: '6.1',
    answer: 'Official channels: <strong>1.</strong> Announcements on samagama.in, <strong>2.</strong> Yaksha chat (use <code>#escalate</code> for a human), <strong>3.</strong> Discussion forum, <strong>4.</strong> Email to sudarshansudarshan@gmail.com (last resort). <br><strong>WhatsApp is cancelled</strong> \u2014 unofficial groups lead to immediate termination.'
  },

  // ═══ SECTION 7: Interviews ═══
  {
    words: ['interview', 'interviews', 'incomplete', 'not marked', 'dashboard incomplete', 'interview status'],
    faq: 'q-7-1',
    faqLabel: '7.1',
    answer: 'If your interview is not marked as complete on the dashboard, it\'s a data-sync issue. The team will check and fix it within 1\u20132 hours. If it persists, email sudarshansudarshan@gmail.com.'
  },

  // ═══ SECTION 8: Certificate ═══
  {
    words: ['grade report', 'university report', 'send to college'],
    faq: 'q-8-1',
    faqLabel: '8.1',
    answer: 'No \u2014 we don\'t send grade reports to universities. The certificate you receive upon completion is the document you can submit to your college.'
  },
  {
    words: ['hardcopy', 'physical certificate', 'print certificate', 'e-certificate', 'digital certificate', 'certificate format'],
    faq: 'q-8-3',
    faqLabel: '8.3',
    answer: 'It is issued as an <strong>e-certificate</strong> \u2014 downloaded from your dashboard. We do not print and mail physical copies. It is digitally signed and verifiable.'
  },
  {
    words: ['whatsapp group', 'candidate group', 'telegram', 'discord', 'unofficial group'],
    faq: 'q-8-4',
    faqLabel: '8.4',
    answer: 'There is <strong>no WhatsApp group</strong> for candidates. See FAQ 6.1 for official channels. Unofficial groups are strictly prohibited and lead to termination.'
  },

  // ═══ SECTION 9: Rosetta Journal ═══
  {
    words: ['rosetta', 'journal', 'diary', 'daily writing', 'entry', 'reflection', 'thinking routine', 'daily journal'],
    faq: 'q-9-1',
    faqLabel: '9.1',
    answer: '<strong>Rosetta</strong> is your 65-day internship journal \u2014 one entry per day using a rotating "thinking routine" prompt. It takes 10\u201320 minutes daily.'
  },
  {
    words: ['rosetta purpose', 'why rosetta', 'why journal', 'busywork'],
    faq: 'q-9-2',
    faqLabel: '9.2',
    answer: 'Rosetta is not busywork. It helps you process and articulate your learning experience. Students who reflect regularly get more out of it.'
  },
  {
    words: ['get rosetta', 'how rosetta', 'rosetta template', 'google doc', 'rosetta doc'],
    faq: 'q-9-4',
    faqLabel: '9.4',
    answer: 'Shared as a Google Doc template during orientation. Make a copy to your own Drive and rename it <code>Rosetta \u2014 [Your Name] \u2014 Summership 2026</code>.'
  },
  {
    words: ['chatgpt', 'ai tool', 'ai write', 'generated', 'ai entry', 'cheat journal'],
    faq: 'q-9-8',
    faqLabel: '9.8',
    answer: '<strong>No.</strong> AI-generated entries will not be counted. The journal must be in your voice, from your actual experience.'
  },
  {
    words: ['submit rosetta', 'rosetta submit', 'share rosetta', 'end rosetta', 'submit journal'],
    faq: 'q-9-12',
    faqLabel: '9.12',
    answer: 'Share your Google Doc with the coordinator\'s email as <strong>Viewer</strong>. Ensure your name is in the title, all 65 entries are filled, and your cover page is complete.'
  },
  {
    words: ['self paced', 'self-paced', 'flexible', 'other activity', 'part time internship'],
    faq: 'q-9-14',
    faqLabel: '9.14',
    answer: 'This is <strong>not a self-paced internship</strong> \u2014 it is very rigorous and time-demanding. It is not permitted for one to be part of any other activity during this period.'
  },

  // ═══ SECTION 10: Phase 1 & ViBe LMS ═══
  {
    words: ['vibe', 'lms', 'platform', 'learning', 'course', 'coursework', 'ai fundamentals', 'mern', 'registration', 'register'],
    faq: 'q-10-2',
    faqLabel: '10.2',
    answer: 'ViBe is the learning management system for Phase 1. Register via the link in Announcements \u2192 sign in with your registered Gmail \u2192 open the link again \u2192 complete the form \u2192 the course appears on your dashboard.'
  },
  {
    words: ['returning intern', 'previous intern', 'repeat course', 'exempt', 'exemption course', 'done before'],
    faq: 'q-10-1',
    faqLabel: '10.1',
    answer: 'If you completed the MERN Stack coursework previously, you don\'t need to repeat it. However, the <strong>AI Fundamentals course is mandatory for everyone</strong>, including returning interns.'
  },
  {
    words: ['live session', 'live sessions', 'mandatory session', 'viva', 'daily session', 'session schedule'],
    faq: 'q-10-4',
    faqLabel: '10.4',
    answer: '<strong>Live sessions are mandatory</strong> for every intern, regardless of path. Check the daily schedule in the Announcements section on samagama.in.'
  },

  // ═══ SECTION 11: Yaksha Chat ═══
  {
    words: ['yaksha', 'chat', 'type', 'unable', 'cannot type', 'interact', 'chatbot', 'bot', 'typing issue'],
    faq: 'q-11-1',
    faqLabel: '11.1',
    answer: 'If you can\'t type in the chat after clicking "Interact with Yaksha", scroll to the <strong>top of the window</strong> and click the <strong>"Chat with Yaksha"</strong> button to activate it.'
  },

  // ═══ SECTION 12: ViBe Platform ═══
  {
    words: ['vibe login', 'log in vibe', 'vibe sign up', 'vibe signup', 'vibe access'],
    faq: 'q-12-1',
    faqLabel: '12.1',
    answer: 'Go to <a href="https://vibe.vicharanashala.ai/auth" target="_blank">vibe.vicharanashala.ai/auth</a>. Sign up as a student with your registered email. Accept the course invite in Notifications.'
  },
  {
    words: ['no course', 'no course enrolled', 'course not showing', 'invite accepted', 'vibe empty'],
    faq: 'q-12-2',
    faqLabel: '12.2',
    answer: 'If it shows "No course enrolled" after accepting: check your email, try logging out/in, allow third-party cookies, set DNS to Google DNS (8.8.8.8 / 8.8.4.4), and flush DNS cache.'
  },
  {
    words: ['video stuck', 'repeating', 'pausing', 'camera', 'webcam', 'proctoring', 'quiet helper', 'penalty', 'face', 'video issue'],
    faq: 'q-12-3',
    faqLabel: '12.3',
    answer: 'ViBe\'s proctored system requires: face visible, only you in frame, good lighting, no background voices, and staying on the ViBe tab. Videos may repeat or pause if these conditions aren\'t met \u2014 it\'s by design, not a bug.'
  },
  {
    words: ['mobile', 'tablet', 'phone', 'ipad', 'android', 'device'],
    faq: 'q-12-4',
    faqLabel: '12.4',
    answer: 'No, only <strong>desktop/laptop</strong> is supported for ViBe. Mobile and tablets are not supported.'
  },
  {
    words: ['troubleshoot', 'vibe error', 'vibe bug', 'vibe issue', 'vibe not working', 'vibe fix'],
    faq: 'q-12-5',
    faqLabel: '12.5',
    answer: 'Try: refresh page \u2192 inspect console \u2192 log out/in \u2192 different browser \u2192 clear cache. If the issue persists, mention <code>#escalate-ViBe</code> in Yaksha.'
  },
  {
    words: ['quiz', 'mcq', 'msq', 'nat', 'true false', 'question type', 'quiz type', 'quiz format'],
    faq: 'q-12-16',
    faqLabel: '12.16',
    answer: 'ViBe has four quiz formats: <strong>Pick one (MCQ)</strong>, <strong>Pick one or more (MSQ)</strong>, <strong>Type a number (NAT)</strong>, and <strong>True or False</strong>.'
  },
  {
    words: ['progress', 'percentage', '100', 'complete', 'linear', 'skip', 'jump', 'access restricted', 'restricted'],
    faq: 'q-12-6',
    faqLabel: '12.6',
    answer: 'ViBe uses <strong>linear progression</strong> \u2014 each item unlocks after the previous one is completed. Use <strong>Next Quiz / Next Lesson</strong> on the right panel \u2014 don\'t use the left nav to jump ahead.'
  },
  {
    words: ['consent', 'camera permission', 'mic permission', 'microphone', 'privacy', 'record', 'consent form'],
    faq: 'q-12-8',
    faqLabel: '12.8',
    answer: 'ViBe consent is <strong>mandatory</strong>. Camera and microphone access are required. ViBe does <strong>not</strong> continuously record you \u2014 camera/mic are used for real-time checks only.'
  },
  {
    words: ['bypass vibe', 'skip vibe', 'exception vibe', 'proctored exam', 'alternative exam'],
    faq: 'q-12-7',
    faqLabel: '12.7',
    answer: 'There is a formal alternative: a three-hour proctored exam with two cameras and a live proctor. Score below 60% = join next cohort. Above 80% = passed. The standard ViBe flow is usually faster.'
  },
  {
    words: ['window behind', 'lighting', 'backlight', 'dark face', 'study corner', 'study setup'],
    faq: 'q-12-20',
    faqLabel: '12.20',
    answer: 'The most common avoidable mistake is <strong>sitting with a window directly behind you</strong>. Move the window to your side or in front of the laptop. Sit in a quiet, well-lit spot.'
  },

  // ═══ SECTION 13: Team Formation ═══
  {
    words: ['team', 'teams', 'team formation', 'team size', 'teammate', 'members', 'group', 'four members', 'team compulsory'],
    faq: 'q-13-1',
    faqLabel: '13.1',
    answer: 'Yes, team formation is compulsory. Teams are fixed at <strong>4 members from different institutions</strong>. Early joiners formed teams through a structured activity; later joiners are randomly assigned. Team activities begin in <strong>Phase 2</strong>.'
  },
  {
    words: ['team name', 'team change', 'switch team', 'team conflict', 'inactive', 'not contributing'],
    faq: 'q-13-10',
    faqLabel: '13.10',
    answer: 'Team names can be changed (frequent changes discouraged). <strong>Switching teams is not allowed</strong> except in admin-approved cases. If a member is inactive, report to your mentor/scholar early.'
  },
  {
    words: ['same college', 'same institution', 'iitm', 'mbs', 'friend team'],
    faq: 'q-13-8',
    faqLabel: '13.8',
    answer: 'No \u2014 teams must consist of members from <strong>different institutions</strong>. You cannot team up with students from your own college.'
  },
  {
    words: ['project assignment', 'project change', 'different project', 'priority', 'assigned project', 'project final'],
    faq: 'q-13-16',
    faqLabel: '13.16',
    answer: '<strong>Project assignments are final.</strong> Even if you were assigned a different project than your top priority, it cannot be changed.'
  },
  {
    words: ['team communication', 'team chat', 'communicate team', 'team linkedin', 'team email'],
    faq: 'q-13-23',
    faqLabel: '13.23',
    answer: 'Teams self-organise over <strong>LinkedIn or email</strong> only. WhatsApp team groups are not permitted.'
  },
  {
    words: ['drop out', 'dropout', 'leave internship', 'quit', 'exit', 'withdraw internship'],
    faq: 'q-13-26',
    faqLabel: '13.26',
    answer: 'If you drop out, your team will be adjusted \u2014 remaining members continue as a team of three or receive a replacement. Dropouts do not get a certificate.'
  },
  {
    words: ['team performance', 'individual evaluation', 'team evaluation', 'team marks'],
    faq: 'q-13-22',
    faqLabel: '13.22',
    answer: 'Yes \u2014 team deliverables are a key part of evaluation. Team performance <strong>does</strong> affect individual evaluation.'
  },

  // ═══ GENERAL / GREETINGS ═══
  {
    words: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'namaste', 'hola', 'greetings'],
    faq: null,
    faqLabel: null,
    answer: 'Hello! \uD83D\uDC4B I\'m <strong>Yaksha-mini</strong>, your AI assistant for the VINS FAQ. Ask me anything \u2014 try <em>"What is VINS?"</em>, <em>"How do I submit my NOC?"</em>, or <em>"Is there a stipend?"</em>'
  },
  {
    words: ['thank', 'thanks', 'thank you', 'thankyou', 'ty', 'appreciate', 'helpful', 'awesome', 'great'],
    faq: null,
    faqLabel: null,
    answer: 'You\'re welcome! \uD83D\uDE0A If you have more questions, feel free to ask \u2014 or browse the FAQ sections on the left. For live help, use Yaksha on <a href="https://samagama.in" target="_blank">samagama.in</a>.'
  },
  {
    words: ['help', 'how to use', 'what can you', 'what do you', 'features', 'guide', 'usage'],
    faq: null,
    faqLabel: null,
    answer: 'I can answer questions about the VINS internship! Try asking about:<br>\u2022 <strong>NOC</strong> \u2014 how to get & submit<br>\u2022 <strong>Stipend & Certificate</strong><br>\u2022 <strong>Timing & Dates</strong><br>\u2022 <strong>ViBe platform</strong><br>\u2022 <strong>Team formation</strong><br>\u2022 <strong>Rosetta journal</strong><br>\u2022 <strong>Offer letter & acceptance</strong><br>\u2022 <strong>Exams & leave policy</strong><br>\u2022 <strong>Daily standups</strong><br><br>I\'ll also point you to the exact FAQ number for more details!'
  },
];

// ── Fallback answers ──
const FALLBACK_ANSWERS = [
  'I couldn\'t find an exact match for that. Try keywords like <strong>NOC</strong>, <strong>stipend</strong>, <strong>certificate</strong>, <strong>ViBe</strong>, <strong>team</strong>, or <strong>dates</strong>. You can also search the FAQ above using the search bar. 🔍',
  'I\'m not sure about that one — try rephrasing or use specific terms like <em>"offer letter"</em>, <em>"Rosetta journal"</em>, or <em>"exam leave"</em>. For live support, use <code>#escalate</code> on <a href="https://samagama.in" target="_blank">samagama.in</a>.',
  'Hmm, I don\'t have a direct answer for that. Here\'s what I can help with: NOC, stipend, certificate, dates, ViBe, teams, Rosetta, offer letters, and more. Try asking about one of those! 💡',
];

// ── Smart scoring-based matcher ──
function yakshaFindAnswer(query) {
  const q = query.toLowerCase().replace(/[?!.,;:'"]/g, '');
  const qWords = q.split(/\s+/).filter(w => w.length > 1);

  // Stop-words to ignore during scoring
  const stopWords = new Set(['the', 'is', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'or', 'it', 'me', 'my', 'can', 'you', 'i', 'do', 'this', 'that', 'on', 'with', 'be', 'are', 'was', 'have', 'has', 'how', 'please', 'about', 'does', 'will', 'am', 'us', 'we', 'its', 'so', 'if', 'at', 'by', 'up']);

  let bestScore = 0;
  let bestEntry = null;

  for (const entry of YAKSHA_KB) {
    let score = 0;

    // 1. Check each query word against entry keywords
    for (const qw of qWords) {
      if (stopWords.has(qw)) continue;
      for (const kw of entry.words) {
        // Exact match → +3, partial match (keyword contains query word or vice versa) → +1
        if (kw === qw) {
          score += 3;
        } else if (kw.includes(qw) || qw.includes(kw)) {
          score += 1.5;
        }
      }
    }

    // 2. Check full query as phrase against keywords
    for (const kw of entry.words) {
      if (q.includes(kw) && kw.length > 3) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Minimum threshold to consider a match
  if (bestScore >= 2 && bestEntry) {
    let response = bestEntry.answer;
    if (bestEntry.faq && bestEntry.faqLabel) {
      response += `<br><br>📌 <a href="#${bestEntry.faq}" class="yaksha-faq-ref" onclick="yakshaGoToFaq('${bestEntry.faq}')">See FAQ ${bestEntry.faqLabel} for more details →</a>`;
    }
    return response;
  }

  return FALLBACK_ANSWERS[Math.floor(Math.random() * FALLBACK_ANSWERS.length)];
}

// ── Navigate to FAQ item from chatbot ──
function yakshaGoToFaq(faqId) {
  const item = document.getElementById(faqId);
  if (!item) return;

  // Reset filters to show all
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => p.classList.remove('active'));
  const allPill = document.querySelector('[data-category="all"]');
  if (allPill) allPill.classList.add('active');

  // Show all sections and items
  document.querySelectorAll('.faq-section').forEach(s => s.style.display = '');
  document.querySelectorAll('.faq-item').forEach(i => { i.style.display = ''; i.classList.remove('hidden'); });

  // Open the FAQ item
  const answer = item.querySelector('.faq-answer');
  const btn = item.querySelector('.faq-question');
  if (!item.classList.contains('active') && answer && btn) {
    item.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    answer.style.opacity = '1';
  }

  // Scroll to it with flash
  setTimeout(() => {
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    item.classList.add('flash');
    setTimeout(() => item.classList.remove('flash'), 1500);
  }, 150);
}

function yakshaNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function yakshaAddMsg(text, role = 'bot') {
  const messages = document.getElementById('yaksha-messages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = `yaksha-msg yaksha-msg--${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'yaksha-bubble';
  bubble.innerHTML = text;
  const time = document.createElement('span');
  time.className = 'yaksha-time';
  time.textContent = yakshaNow();
  msg.appendChild(bubble);
  msg.appendChild(time);
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  return msg;
}

function yakshaShowTyping() {
  const messages = document.getElementById('yaksha-messages');
  if (!messages) return null;
  const msg = document.createElement('div');
  msg.className = 'yaksha-msg yaksha-msg--bot yaksha-typing';
  msg.id = 'yaksha-typing-indicator';
  const bubble = document.createElement('div');
  bubble.className = 'yaksha-bubble';
  bubble.innerHTML = '<div class="yaksha-typing-dots"><span></span><span></span><span></span></div>';
  msg.appendChild(bubble);
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  return msg;
}

function yakshaRemoveTyping() {
  const el = document.getElementById('yaksha-typing-indicator');
  if (el) el.remove();
}

function yakshaSendMessage(text) {
  if (!text.trim()) return;
  yakshaAddMsg(text, 'user');
  const typing = yakshaShowTyping();
  setTimeout(() => {
    yakshaRemoveTyping();
    const answer = yakshaFindAnswer(text);
    yakshaAddMsg(answer, 'bot');
  }, 900 + Math.random() * 500);
}

// ── Bind Yaksha chatbot UI ──
document.addEventListener('DOMContentLoaded', () => {
  const input   = document.getElementById('yaksha-input');
  const sendBtn = document.getElementById('yaksha-send');
  const micBtn  = document.getElementById('yaksha-input-mic');
  const voiceBtn = document.getElementById('yaksha-voice-btn');
  const voicePanel = document.getElementById('yaksha-voice-panel');
  const voiceLabel = document.getElementById('yaksha-voice-label');

  if (sendBtn && input) {
    sendBtn.addEventListener('click', () => {
      yakshaSendMessage(input.value);
      input.value = '';
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        yakshaSendMessage(input.value);
        input.value = '';
      }
    });
  }

  // ── Yaksha voice panel toggle ──
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      const isActive = voicePanel && voicePanel.classList.contains('active');
      if (isActive) {
        stopVoiceMode();
      } else {
        startVoiceMode();
      }
    });
  }

  // ── Yaksha input mic ──
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (micBtn.classList.contains('active')) {
        stopInputVoice();
      } else {
        startInputVoice(micBtn, input);
      }
    });
  }
});

// ── Voice mode (Yaksha sidebar panel) ──
let sidebarRecognition = null;

function startVoiceMode() {
  const panel = document.getElementById('yaksha-voice-panel');
  const voiceBtn = document.getElementById('yaksha-voice-btn');
  const label = document.getElementById('yaksha-voice-label');
  const ring = document.getElementById('yaksha-voice-ring');

  if (!panel) return;
  panel.classList.add('active');
  if (voiceBtn) voiceBtn.classList.add('listening');
  if (ring) ring.classList.add('listening');
  if (label) label.textContent = 'Listening…';

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    if (label) label.textContent = 'Voice not supported in this browser';
    return;
  }
  sidebarRecognition = new SR();
  sidebarRecognition.lang = 'en-IN';
  sidebarRecognition.interimResults = true;
  sidebarRecognition.continuous = false;

  sidebarRecognition.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    if (label) label.textContent = `"${transcript}"`;
    if (e.results[e.results.length - 1].isFinal) {
      stopVoiceMode();
      yakshaSendMessage(transcript);
    }
  };
  sidebarRecognition.onerror = () => {
    if (label) label.textContent = 'Could not hear you. Try again.';
    setTimeout(stopVoiceMode, 1500);
  };
  sidebarRecognition.onend = () => stopVoiceMode();
  sidebarRecognition.start();
}

function stopVoiceMode() {
  const panel = document.getElementById('yaksha-voice-panel');
  const voiceBtn = document.getElementById('yaksha-voice-btn');
  const ring = document.getElementById('yaksha-voice-ring');
  const label = document.getElementById('yaksha-voice-label');

  if (sidebarRecognition) { try { sidebarRecognition.stop(); } catch(e) {} sidebarRecognition = null; }
  if (panel) panel.classList.remove('active');
  if (voiceBtn) voiceBtn.classList.remove('listening');
  if (ring) ring.classList.remove('listening');
  if (label) label.textContent = 'Tap mic to speak';
}

// ── Yaksha input mic (inline) ──
let inputRecognition = null;

function startInputVoice(btn, input) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('Voice input is not supported in this browser. Try Chrome or Edge.');
    return;
  }
  btn.classList.add('active');
  inputRecognition = new SR();
  inputRecognition.lang = 'en-IN';
  inputRecognition.interimResults = true;
  inputRecognition.continuous = false;

  inputRecognition.onresult = (e) => {
    let t = '';
    for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
    if (input) input.value = t;
    if (e.results[e.results.length - 1].isFinal) stopInputVoice();
  };
  inputRecognition.onerror = () => stopInputVoice();
  inputRecognition.onend = () => stopInputVoice();
  inputRecognition.start();
}

function stopInputVoice() {
  const btn = document.getElementById('yaksha-input-mic');
  if (inputRecognition) { try { inputRecognition.stop(); } catch(e) {} inputRecognition = null; }
  if (btn) btn.classList.remove('active');
}

/* ────────────────────────────────────────────────
   VOICE AGENT MODAL (Header "Voice" button)
   ──────────────────────────────────────────────── */

function openVoiceAgent(e) {
  if (e) e.preventDefault();
  const overlay = document.getElementById('voice-modal-overlay');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVoiceAgent(e) {
  if (e && e.target !== document.getElementById('voice-modal-overlay') && e.type === 'click' && !e.target.closest('#voice-modal-close')) return;
  const overlay = document.getElementById('voice-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  stopModalVoice();
}

// Override close to work without the target check issue
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('voice-modal-overlay');
  const closeBtn = document.getElementById('voice-modal-close');
  const modal = document.getElementById('voice-modal');

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        stopModalVoice();
      }
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
      stopModalVoice();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      stopModalVoice();
    }
  });
});

let modalRecognition = null;

function startModalVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const startBtn = document.getElementById('voice-modal-start');
  const stopBtn  = document.getElementById('voice-modal-stop');
  const status   = document.getElementById('voice-modal-status');
  const transcript = document.getElementById('voice-modal-transcript');
  const ring     = document.getElementById('voice-modal-ring');

  if (!SR) {
    if (status) status.textContent = '⚠ Voice not supported in this browser';
    return;
  }

  if (startBtn) startBtn.style.display = 'none';
  if (stopBtn)  stopBtn.style.display  = 'inline-flex';
  if (status)   status.textContent = '🎤 Listening…';
  if (transcript) transcript.textContent = '';
  if (ring) ring.classList.add('listening');

  modalRecognition = new SR();
  modalRecognition.lang = 'en-IN';
  modalRecognition.interimResults = true;
  modalRecognition.continuous = false;

  modalRecognition.onresult = (e) => {
    let t = '';
    for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
    if (transcript) transcript.textContent = t;
    if (e.results[e.results.length - 1].isFinal) {
      stopModalVoice();
      // Send answer to Yaksha sidebar too
      setTimeout(() => {
        yakshaSendMessage(t);
        // Close modal after short delay
        setTimeout(() => {
          const overlay = document.getElementById('voice-modal-overlay');
          if (overlay) overlay.classList.remove('open');
          document.body.style.overflow = '';
        }, 600);
      }, 300);
    }
  };
  modalRecognition.onerror = (err) => {
    if (status) status.textContent = `⚠ Error: ${err.error}. Try again.`;
    stopModalVoice();
  };
  modalRecognition.onend = () => stopModalVoice();
  modalRecognition.start();
}

function stopModalVoice() {
  const startBtn = document.getElementById('voice-modal-start');
  const stopBtn  = document.getElementById('voice-modal-stop');
  const status   = document.getElementById('voice-modal-status');
  const ring     = document.getElementById('voice-modal-ring');

  if (modalRecognition) { try { modalRecognition.stop(); } catch(e) {} modalRecognition = null; }
  if (startBtn) startBtn.style.display = 'inline-flex';
  if (stopBtn)  stopBtn.style.display  = 'none';
  if (status)   status.textContent = 'Ready to listen';
  if (ring) ring.classList.remove('listening');
}

