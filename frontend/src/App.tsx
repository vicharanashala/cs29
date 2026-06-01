import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { onAuthStateChanged } from 'firebase/auth';
import './reference.css';
import './mobile.css';
import FaqDashboard from './components/FaqDashboard';
import { YakshaChat } from './components/YakshaChat';
import { getAllFaqs, getTopFaqs } from './api/faqs';
import { auth } from './firebase';
import { logout, syncUser, type SyncedUser } from './api/auth';

type TabId = 'all' | 'most-asked' | 'latest' | 'bookmarked' | 'resolve';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  view_count?: number;
}

const TAB_HEADINGS: Record<TabId, { title: string; subtitle: string }> = {
  'all':        { title: 'Frequently Asked\nQuestions',       subtitle: 'Everything you need to know about the Vicharanashala Internship Programme (VINS). Search or browse by category below.' },
  'most-asked': { title: 'Trending\nQuestions',               subtitle: 'The most-viewed questions across all categories — updated in real time as everyone asks.' },
  'latest':     { title: 'Latest\nFAQs',                       subtitle: 'Newly added questions, fresh from the VINS team.' },
  'bookmarked': { title: 'Your\nBookmarks',                    subtitle: 'Questions you\'ve saved for quick access.' },
  'resolve':    { title: 'Submit a\nTicket',                   subtitle: 'Can\'t find your answer? Our team will follow up within 48 hours.' },
};

const HERO_TABS: { id: TabId; label: string }[] = [
  { id: 'all',        label: 'All FAQs' },
  { id: 'most-asked', label: 'Most Asked' },
  { id: 'latest',     label: 'Latest FAQs' },
  { id: 'bookmarked', label: 'Bookmarked' },
];

function App() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab]       = useState<TabId>('all');
  const [searchQuery, setSearchQuery]   = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [tocOpen, setTocOpen]           = useState<boolean>(false);
  const [activeTocSection, setActiveToc]= useState<string>('s-1');
  const [chatOpen, setChatOpen]         = useState<boolean>(false);


  // Auth state — initialise from localStorage for instant display, then sync with Firebase
  const [user, setUser] = useState<SyncedUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as SyncedUser) : null;
  });

  useEffect(() => {
    if (!auth) return;
    const firebaseAuth = auth;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        // Fast path: use cached user object if already stored
        const stored = localStorage.getItem('user');
        if (stored) {
          setUser(JSON.parse(stored) as SyncedUser);
        }
        // Always re-sync to pick up any role changes
        try {
          const { user: synced } = await syncUser(fbUser);
          localStorage.setItem('user', JSON.stringify(synced));
          setUser(synced);
        } catch {
          // Sync failed (backend down?) — keep the cached object
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('user');
    setUser(null);
    navigate({ to: '/' });
  };

  const { data: allFaqsData } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => getAllFaqs().then((r) => r.data as FaqItem[]),
  });
  const allFaqs = allFaqsData ?? [];

  const { data: topFaqsData } = useQuery({
    queryKey: ['faqs', 'top'],
    queryFn: () => getTopFaqs().then((r) => r.data as FaqItem[]),
    enabled: activeTab === 'most-asked',
  });
  const topFaqs = topFaqsData ?? [];

  const displayedFaqs: FaqItem[] =
    activeTab === 'most-asked' ? topFaqs : allFaqs;

  const { distinctCategories, numbersMap, sectionNumbersMap } = useMemo(() => {
    const sortedCats = Array.from(new Set(allFaqs.map((faq) => faq.category))).sort();
    const grouped: Record<string, FaqItem[]> = {};
    allFaqs.forEach((faq) => {
      if (!grouped[faq.category]) grouped[faq.category] = [];
      grouped[faq.category].push(faq);
    });
    const numMap: Record<string, string> = {};
    const secMap: Record<string, string>  = {};
    sortedCats.forEach((cat, catIdx) => {
      secMap[cat] = String(catIdx + 1).padStart(2, '0');
      (grouped[cat] || []).forEach((faq, faqIdx) => {
        numMap[faq._id] = `${catIdx + 1}.${faqIdx + 1}`;
      });
    });
    return { distinctCategories: sortedCats, numbersMap: numMap, sectionNumbersMap: secMap };
  }, [allFaqs]);

  const TOC_ITEMS = useMemo(() => {
    return distinctCategories.map((cat, idx) => {
      let label = cat;
      if (cat.startsWith('NOC'))             label = 'NOC';
      else if (cat.startsWith('About'))      label = 'About the Internship';
      else if (cat.startsWith('Selection'))  label = 'Selection & Offer';
      else if (cat.startsWith('Work'))       label = 'Work & Mentorship';
      else if (cat.startsWith('Rosetta'))    label = 'Rosetta Journal';
      else if (cat.startsWith('ViBe'))       label = 'ViBe Platform';
      else if (cat.startsWith('Yaksha'))     label = 'Yaksha-mini Chat';
      else if (cat.startsWith('Interviews')) label = 'Interviews';
      else if (cat.startsWith('Code of Conduct')) label = 'Code of Conduct';
      else if (cat.startsWith('Team'))       label = 'Team Formation';
      else if (cat.startsWith('Phase 1'))    label = 'Phase 1 Coursework';
      else if (cat.startsWith('Certificate'))label = 'Certificate';
      return { num: String(idx + 1).padStart(2, '0'), label, section: `s-${idx + 1}` };
    });
  }, [distinctCategories]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.faq-section');
      let current = '';
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 180) current = section.id;
      });
      if (current) setActiveToc(current);
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
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const heading = TAB_HEADINGS[activeTab] ?? TAB_HEADINGS['all'];

  return (
    <>

      {/* ─── LIQUID GLASS HEADER ─── */}
      <header className="site-header liquid-glass-header" id="site-header">
        <div className="header-inner header-inner--widescreen">
          <a href="/" className="logo" onClick={(e) => { e.preventDefault(); navigate({ to: '/' }); }}>
            <span className="logo-mark">V</span>
            <span className="logo-text">Vicharanashala</span>
          </a>
          <nav className="header-nav-pills">
            <span className="nav-pill">FAQ Portal</span>
            <span className="nav-pill-divider" />
            {user?.role === 'ADMIN' && (
              <button className="nav-pill nav-pill--accent" onClick={() => navigate({ to: '/admin' })}>
                Admin Panel
              </button>
            )}
            <button className="nav-pill nav-pill--action" onClick={() => setActiveTab('resolve')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Resolve Query
            </button>
            <span className="nav-pill-divider" />
            {user ? (
              <>
                <span className="nav-pill nav-user-name">{user.name}</span>
                <button className="nav-pill nav-pill--action" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="nav-pill nav-pill--action" onClick={() => navigate({ to: '/login' })}>
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ─── HERO (updates with active tab) ─── */}
      <section className="hero" id="hero">
        <div className="hero-inner">
          <p className="hero-badge">IIT Ropar · Applied AI · Open-Source</p>
          <div className="hero-tab-bar" role="tablist" aria-label="FAQ views">
            {HERO_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`hero-tab-btn${activeTab === tab.id ? ' hero-tab-btn--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>
            {heading.title}
          </h1>
          <p className="hero-subtitle">{heading.subtitle}</p>
        </div>
      </section>

      {/* ─── MOBILE TOC TOGGLE ─── */}
      <div className="mobile-toc-wrapper">
        <button
          className={`mobile-toc-toggle${tocOpen ? ' open' : ''}`}
          aria-expanded={tocOpen}
          aria-controls="mobile-toc-panel"
          onClick={() => setTocOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="15" y2="18" />
          </svg>
          Contents
          <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div id="mobile-toc-panel" className={`mobile-toc-panel${tocOpen ? ' open' : ''}`}>
          <nav className="toc-nav">
            {TOC_ITEMS.map((item) => (
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

      {/* ─── MAIN LAYOUT — 3-column grid (TOC | FAQ content | Yaksha chat) ─── */}
      <div className="main-layout">

        {/* Column 1: TOC sidebar — hugs left edge */}
        <aside className="toc-sidebar" id="toc-sidebar">
          <h2 className="toc-heading">Contents</h2>
          <nav className="toc-nav" id="toc-nav">
            {TOC_ITEMS.map((item) => (
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
        </aside>

        {/* Column 2: FAQ content — wide expanded center workspace */}
        <main className="center-content">
          <FaqDashboard
            faqs={displayedFaqs}
            activeTab={activeTab}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            distinctCategories={distinctCategories}
            numbersMap={numbersMap}
            sectionNumbersMap={sectionNumbersMap}
          />
        </main>

        {/* Column 3: Yaksha AI chat sidebar */}
        <aside className="yaksha-sidebar" id="yaksha-sidebar">
          <div className="yaksha-sidebar-sticky">
            <YakshaChat isModal={false} onClose={() => {}} />
          </div>
        </aside>

      </div>

      {/* ─── FOOTER ─── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-mark">V</span>
            <p>Vicharanashala Lab for Education Design · IIT Ropar</p>
          </div>
          <div className="footer-links">
            <a href="https://samagama.in" target="_blank" rel="noopener">samagama.in</a>
            <a href="https://samagama.in/internship" target="_blank" rel="noopener">Internship Overview</a>
          </div>
          <p className="footer-note">
            FAQs are maintained by the VINS team. For queries not covered here, contact us via the{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setChatOpen(true); }}>Yaksha chat</a>.
          </p>
        </div>
      </footer>

      {/* ─── YAKSHA FAB (mobile only) ─── */}
      <button
        className="yaksha-fab"
        aria-label="Open Yaksha chat"
        onClick={() => setChatOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* ─── YAKSHA MODAL (mobile only) ─── */}
      <div
        className={`yaksha-modal-overlay${chatOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}
        aria-modal="true"
        role="dialog"
        aria-label="Yaksha-mini chat"
      >
        <div className="yaksha-modal-sheet">
          <YakshaChat isModal={true} onClose={() => setChatOpen(false)} />
        </div>
      </div>

    </>
  );
}

export default App;
