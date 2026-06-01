import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../reference.css';
import '../mobile.css';
import FaqDashboard from '../components/FaqDashboard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  view_count?: number;
}

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [tocOpen, setTocOpen] = useState(false);
  const [activeTocSection, setActiveToc] = useState('s-1');
  const [activeTab, setActiveTab] = useState<'all' | 'most-asked' | 'latest' | 'bookmarked'>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { user, isAuthenticated, isAdmin } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      const saved = JSON.parse(localStorage.getItem(`bookmarks_${user.email}`) || '[]');
      setBookmarkedIds(saved);
    } else {
      setBookmarkedIds([]);
    }
  }, [isAuthenticated, user]);

  const handleToggleBookmark = (faqId: string) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setBookmarkedIds((prev) => {
      const next = prev.includes(faqId) ? prev.filter((id) => id !== faqId) : [...prev, faqId];
      localStorage.setItem(`bookmarks_${user?.email}`, JSON.stringify(next));
      return next;
    });
  };

  const displayFaqs = useMemo(() => {
    switch (activeTab) {
      case 'most-asked':
        // Sort by view_count descending and limit to top 10
        return [...faqs]
          .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 10);
      case 'latest':
        // Sort by _id descending (ObjectId creation order) and limit to max 7
        return [...faqs]
          .sort((a, b) => b._id.localeCompare(a._id))
          .slice(0, 7);
      case 'bookmarked':
        if (!isAuthenticated) return [];
        return faqs.filter((f) => bookmarkedIds.includes(f._id));
      case 'all':
      default:
        return faqs;
    }
  }, [faqs, activeTab, isAuthenticated, bookmarkedIds]);

  const fetchFaqsData = () => {
    setIsLoading(true);
    axios.get<FaqItem[]>(`${import.meta.env.VITE_API_URL}/api/faqs`)
      .then((response) => {
        setFaqs(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching FAQs:', error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchFaqsData();
  }, []);

  // Handle hash navigation on page load (when user clicks FAQ card link from Yaksha)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const id = hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('faq-item--highlighted');
          setTimeout(() => el.classList.remove('faq-item--highlighted'), 2000);
        }
      }, 200);
    }
  }, []);

  // Compute stable categories, question numbers, and section numbers
  const { distinctCategories, numbersMap, sectionNumbersMap } = useMemo(() => {
    const sortedCats = Array.from(new Set(faqs.map((faq) => faq.category))).sort();
    
    // Group unfiltered faqs by category to assign stable item indices
    const grouped: Record<string, FaqItem[]> = {};
    faqs.forEach((faq) => {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push(faq);
    });

    const numMap: Record<string, string> = {};
    const secMap: Record<string, string> = {};

    sortedCats.forEach((cat, catIdx) => {
      secMap[cat] = String(catIdx + 1).padStart(2, '0');
      const items = grouped[cat] || [];
      items.forEach((faq, faqIdx) => {
        numMap[faq._id] = `${catIdx + 1}.${faqIdx + 1}`;
      });
    });

    return {
      distinctCategories: sortedCats,
      numbersMap: numMap,
      sectionNumbersMap: secMap,
    };
  }, [faqs]);

  // Generate dynamic TOC items with clean, shortened labels
  const TOC_ITEMS = useMemo(() => {
    return distinctCategories.map((cat, idx) => {
      let label = cat;
      if (cat.startsWith('NOC')) label = 'NOC';
      else if (cat.startsWith('About')) label = 'About the Internship';
      else if (cat.startsWith('Timing')) label = 'Timing & Dates';
      else if (cat.startsWith('Selection')) label = 'Selection & Offer';
      else if (cat.startsWith('Work')) label = 'Work & Mentorship';
      else if (cat.startsWith('Rosetta')) label = 'Rosetta Journal';
      else if (cat.startsWith('ViBe')) label = 'ViBe Platform';
      else if (cat.startsWith('Yaksha')) label = 'Yaksha-mini Chat';
      else if (cat.startsWith('Interviews')) label = 'Interviews';
      else if (cat.startsWith('Code of Conduct')) label = 'Code of Conduct';
      else if (cat.startsWith('Team')) label = 'Team Formation';
      else if (cat.startsWith('Phase 1')) label = 'Phase 1 Coursework';
      else if (cat.startsWith('Certificate')) label = 'Certificate';

      return {
        num: String(idx + 1).padStart(2, '0'),
        label,
        section: `s-${idx + 1}`,
      };
    });
  }, [distinctCategories]);

  // Update active TOC link on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.faq-section');
      let current = '';
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 180) {
          current = section.id;
        }
      });
      if (current) {
        setActiveToc(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTocClick = (section: string) => {
    setActiveCategory('All');
    setSearchQuery('');
    setActiveToc(section);
    setTocOpen(false);

    setTimeout(() => {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const { title, subtitle } = useMemo(() => {
    switch (activeTab) {
      case 'most-asked':
        return {
          title: 'Most asked FAQs',
          subtitle: 'The most commonly queried topics and solutions curated from all intern interactions.',
        };
      case 'latest':
        return {
          title: 'Latest FAQs',
          subtitle: 'Stay up-to-date with the recently added and revised answers for the internship.',
        };
      case 'bookmarked':
        return {
          title: 'Your Bookmarks',
          subtitle: 'Your handpicked selection of key guidelines, schedules, and helpful guidelines.',
        };
      case 'all':
      default:
        return {
          title: t.faqPage.title,
          subtitle: 'Everything you need to know about the Vicharanashala Internship Programme (VINS). Search or browse by category below.',
        };
    }
  }, [activeTab, t]);

  return (
    <>
      <section className="hero" id="hero">
        <div className="hero-inner">

          {/* Sub-page Navigation Tabs */}
          <div className="faq-subpage-tabs">
            <button
              type="button"
              className={`faq-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              {t.faqPage.tabs.all}
            </button>
            <button
              type="button"
              className={`faq-tab-btn ${activeTab === 'most-asked' ? 'active' : ''}`}
              onClick={() => setActiveTab('most-asked')}
            >
              {t.faqPage.tabs.mostAsked}
            </button>
            <button
              type="button"
              className={`faq-tab-btn ${activeTab === 'latest' ? 'active' : ''}`}
              onClick={() => setActiveTab('latest')}
            >
              {t.faqPage.tabs.latest}
            </button>
            {!isAdmin && (
              <button
                type="button"
                className={`faq-tab-btn ${activeTab === 'bookmarked' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookmarked')}
              >
                {t.faqPage.tabs.bookmarked}
              </button>
            )}
          </div>

          <h1 className="hero-title" style={{ color: 'var(--accent)' }}>{title}</h1>
          <p className="hero-subtitle">
            {subtitle}
          </p>
          <div className="search-container" style={{ marginTop: '24px', maxWidth: '600px', margin: '24px auto 0' }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              id="faq-search"
              placeholder={t.faqPage.searchPlaceholder}
              aria-label="Search FAQ"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {!(activeTab === 'bookmarked' && !isAuthenticated) && (
        <div className="mobile-toc-wrapper">
          <button
            className={`mobile-toc-toggle${tocOpen ? ' open' : ''}`}
            aria-expanded={tocOpen}
            aria-controls="mobile-toc-panel"
            onClick={() => setTocOpen(v => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="15" y2="18" />
            </svg>
            Contents
            <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                 style={{ marginLeft: 'auto' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div id="mobile-toc-panel" className={`mobile-toc-panel${tocOpen ? ' open' : ''}`}>
            <nav className="toc-nav">
              {TOC_ITEMS.map(item => (
                <a
                  key={item.section}
                  href={`#${item.section}`}
                  className={`toc-link${activeTocSection === item.section ? ' active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleTocClick(item.section); }}
                >
                  <span className="toc-num">{item.num}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className={`main-layout ${activeTab !== 'all' && !isLoading ? 'full-width-layout' : ''}`} id="main-layout">
        {activeTab === 'bookmarked' && !isAuthenticated ? (
          <div className="login-promo-card">
            <div className="promo-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2>View Your Bookmarks</h2>
            <p>Login to save your most important questions, coursework details, and policy guides for quick, customized access.</p>
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="promo-btn"
            >
              Sign In to Continue
            </button>
          </div>
        ) : (
          <>
            {isLoading ? (
              <aside className="toc-sidebar" id="toc-sidebar">
                <div className="toc-sticky">
                  <div className="skeleton-pulse" style={{ height: '24px', width: '100px', borderRadius: '4px', marginBottom: '24px' }}></div>
                  <nav className="toc-nav" id="toc-nav" style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="skeleton-pulse" style={{ height: '18px', width: `${90 - i * 5}%`, borderRadius: '4px' }} />
                    ))}
                  </nav>
                </div>
              </aside>
            ) : activeTab === 'all' && (
              <aside className="toc-sidebar" id="toc-sidebar">
                <div className="toc-sticky">
                  <h2 className="toc-heading">Contents</h2>
                  <nav className="toc-nav" id="toc-nav">
                    {TOC_ITEMS.map(item => (
                      <a
                        key={item.section}
                        href={`#${item.section}`}
                        className={`toc-link${activeTocSection === item.section ? ' active' : ''}`}
                        data-section={item.section}
                        onClick={(e) => { e.preventDefault(); handleTocClick(item.section); }}
                      >
                        <span className="toc-num">{item.num}</span>
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            <FaqDashboard
              faqs={displayFaqs}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              distinctCategories={distinctCategories}
              numbersMap={numbersMap}
              sectionNumbersMap={sectionNumbersMap}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              isAdmin={isAdmin}
              activeTab={activeTab}
              isLoading={isLoading}
              onRefreshFaqs={fetchFaqsData}
            />
          </>
        )}
      </div>
    </>
  );
};
