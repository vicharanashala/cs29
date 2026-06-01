import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import FAQPromoterCard from './admin/faq/FAQPromoterCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import '../styles/admin.css';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  view_count?: number;
  helpful_count?: number;
  not_helpful_count?: number;
}

interface FaqDashboardProps {
  faqs: FaqItem[];
  searchQuery: string;

  activeCategory: string;
  setActiveCategory: (category: string) => void;
  distinctCategories: string[];
  numbersMap: Record<string, string>;
  sectionNumbersMap: Record<string, string>;

  // Bookmarks extension
  bookmarkedIds?: string[];
  onToggleBookmark?: (faqId: string) => void;
  isAdmin?: boolean;
  activeTab?: string;
  isLoading?: boolean;
  onRefreshFaqs?: () => void;
}

export const FaqDashboard: React.FC<FaqDashboardProps> = ({
  faqs,
  searchQuery,

  activeCategory,
  setActiveCategory,
  distinctCategories,
  numbersMap,
  sectionNumbersMap,
  bookmarkedIds = [],
  onToggleBookmark = () => {},
  isAdmin = false,
  activeTab = 'all',
  isLoading = false,
  onRefreshFaqs,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Show suggestion dropdown whenever the search query changes and has candidates
  useEffect(() => {
    setShowSuggestions(searchQuery.trim().length >= 3);
  }, [searchQuery]);

  // Dynamic localStorage key: per-user when logged in, 'guest' when not
  const RATING_KEY = user?.email ? `vins_faq_ratings_${user.email}` : 'vins_faq_ratings_guest';

  // Tracks which FAQs the user has already rated (localStorage dedup)
  const [ratedIds, setRatedIds] = useState<Record<string, 'helpful' | 'not_helpful'>>(() => {
    try { return JSON.parse(localStorage.getItem(RATING_KEY) || '{}'); } catch { return {}; }
  });

  // Reload ratings when user changes (e.g. login/logout) so key switch is reflected
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RATING_KEY);
      setRatedIds(stored ? JSON.parse(stored) : {});
    } catch { setRatedIds({}); }
  }, [RATING_KEY]);
  // Local optimistic rating counts: faqId → { helpful_count, not_helpful_count }
  const [ratingCounts, setRatingCounts] = useState<Record<string, { helpful_count: number; not_helpful_count: number }>>({});

  const handleCreateFaq = async (data: { question: string; answer: string; category: string }) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/faqs`, data);
      setShowAddModal(false);
      if (onRefreshFaqs) {
        onRefreshFaqs();
      }
    } catch (err) {
      console.error('Failed to create FAQ:', err);
    }
  };

  const categoriesList = useMemo(() => {
    return ['All', ...distinctCategories];
  }, [distinctCategories]);

  // Fuse.js instance — recreated when FAQ list changes
  const fuse = useMemo(
    () => new Fuse(faqs, { keys: ['question', 'answer', 'category'], threshold: 0.4, includeScore: true }),
    [faqs],
  );

  // Top 5 search suggestions (shown in dropdown)
  const searchSuggestions = useMemo(() => {
    if (searchQuery.trim().length < 3) return [];
    return fuse.search(searchQuery.trim()).slice(0, 5).map((r) => r.item);
  }, [fuse, searchQuery]);

  const filteredFaqs = useMemo(() => {
    const categoryMatch = (faq: FaqItem) =>
      activeTab !== 'all' || activeCategory === 'All' || faq.category === activeCategory;

    if (searchQuery.trim() === '') {
      return faqs.filter(categoryMatch);
    }
    // Fuzzy search via Fuse.js
    const results = fuse.search(searchQuery.trim()).map((r) => r.item);
    return results.filter(categoryMatch);
  }, [fuse, faqs, activeCategory, searchQuery, activeTab]);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);

        // Find and increment locally for instant Admin visual feedback
        const faqItem = faqs.find(f => f._id === id);
        if (faqItem) {
          faqItem.view_count = (faqItem.view_count || 0) + 1;
        }

        // Increment view count in MongoDB
        axios.patch(`${import.meta.env.VITE_API_URL}/api/faqs/${id}/view`).catch(err => {
          console.error('Failed to increment FAQ view count:', err);
        });
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set(filteredFaqs.map(f => f._id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Group filtered FAQs by category for section rendering, sorted by stable order
  const groupedFilteredFaqs = useMemo(() => {
    const grouped: Record<string, FaqItem[]> = {};
    filteredFaqs.forEach((faq) => {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push(faq);
    });

    return distinctCategories
      .filter((cat) => grouped[cat])
      .map((cat) => [cat, grouped[cat]] as [string, FaqItem[]]);
  }, [filteredFaqs, distinctCategories]);

  const allExpanded = expandedIds.size > 0 && expandedIds.size === filteredFaqs.length;

  const handleRate = async (faqId: string, rating: 'helpful' | 'not_helpful') => {
    if (!user || !user.email) {
      alert('Please log in to upvote or downvote FAQs!');
      return;
    }

    const prevRating = ratedIds[faqId];
    let newRating: 'helpful' | 'not_helpful' | null = rating;

    // Toggle off if clicking the same rating
    if (prevRating === rating) {
      newRating = null;
    }

    // Update local UI state (for button highlight) — server is authoritative for counts
    const newRated = { ...ratedIds };
    if (newRating === null) {
      delete newRated[faqId];
    } else {
      newRated[faqId] = newRating;
    }
    setRatedIds(newRated);
    localStorage.setItem(RATING_KEY, JSON.stringify(newRated));

    // Backend handles idempotent $addToSet/$pull using email as unique key
    // Only the server-returned counts are used to update the UI
    try {
      // On toggle-off send rating=clickedRating so backend detects the repeat
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/faqs/${faqId}/rate`, {
        rating: prevRating === rating ? rating : newRating, // sent rating = what was just clicked
        oldRating: prevRating,
        email: user.email,
      });
      if (res.data) {
        setRatingCounts((prev) => ({ ...prev, [faqId]: res.data }));
      }
    } catch (err) {
      console.error('Failed to save rating:', err);
    }
  };

  const renderFaqItem = (faq: FaqItem, isExpanded: boolean, index?: number) => {
    const displayNum = activeTab === 'all' ? (numbersMap[faq._id] ?? '') : (index !== undefined ? `${index + 1}` : '');
    return (
      <div
        key={faq._id}
        id={faq._id}
        className={`faq-item${isExpanded ? ' active' : ''}`}
      >
        <button
          className="faq-question"
          aria-expanded={isExpanded}
          onClick={() => toggleExpanded(faq._id)}
        >
          {displayNum && <span className="q-number">{displayNum}</span>}
          <span className="q-text">{faq.question}</span>

          {/* Bookmark Toggle Button */}
          {!isAdmin && (
            <button
              type="button"
              className={`faq-bookmark-btn ${bookmarkedIds.includes(faq._id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(faq._id);
              }}
              title={bookmarkedIds.includes(faq._id) ? "Remove Bookmark" : "Bookmark FAQ"}
            >
              <svg viewBox="0 0 24 24" fill={bookmarkedIds.includes(faq._id) ? "var(--accent)" : "none"} stroke="var(--accent)" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}

          {/* View Tracker (Admin only on Trending tab) */}
          {isAdmin && activeTab === 'most-asked' && (
            <span
              className="faq-view-tracker"
              title="Total views (Admin only)"
              onClick={(e) => e.stopPropagation()}
            >
              🔥 {faq.view_count || 0}
            </span>
          )}

          <span className="chevron-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
        <div className="faq-answer" role="region">
          <div
            className="answer-content"
            dangerouslySetInnerHTML={{ __html: faq.answer }}
          />
          {/* Rating thumbs */}
          {!isAdmin && (() => {
            const counts = ratingCounts[faq._id] ?? { helpful_count: faq.helpful_count ?? 0, not_helpful_count: faq.not_helpful_count ?? 0 };
            const userRating = ratedIds[faq._id];
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>{t.faqDashboard.wasHelpful}</span>
                <button
                  type="button"
                  disabled={!user}
                  onClick={(e) => { e.stopPropagation(); handleRate(faq._id, 'helpful'); }}
                  className={!user ? 'pointer-events-none' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${userRating === 'helpful' ? '#34c759' : 'var(--border)'}`,
                    background: userRating === 'helpful' ? 'rgba(52,199,89,0.12)' : 'transparent',
                    color: userRating === 'helpful' ? '#34c759' : 'var(--text-muted)',
                    fontSize: '12.5px', fontWeight: 600,
                    cursor: user ? 'pointer' : 'not-allowed',
                    opacity: user ? 1 : 0.45,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => {
                    if (!user) return;
                    e.currentTarget.style.borderColor = '#34c759';
                    e.currentTarget.style.color = '#34c759';
                    if (userRating === 'helpful') {
                      e.currentTarget.style.background = 'rgba(52,199,89,0.2)';
                    } else {
                      e.currentTarget.style.background = 'rgba(52,199,89,0.05)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = userRating === 'helpful' ? '#34c759' : 'var(--border)';
                    e.currentTarget.style.color = userRating === 'helpful' ? '#34c759' : 'var(--text-muted)';
                    e.currentTarget.style.background = userRating === 'helpful' ? 'rgba(52,199,89,0.12)' : 'transparent';
                  }}
                >
                  <ThumbsUp size={13} style={{ display: 'inline-flex', alignItems: 'center' }} />
                  {counts.helpful_count > 0 ? counts.helpful_count : 0}
                </button>
                <button
                  type="button"
                  disabled={!user}
                  onClick={(e) => { e.stopPropagation(); handleRate(faq._id, 'not_helpful'); }}
                  className={!user ? 'pointer-events-none' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${userRating === 'not_helpful' ? '#ff3b30' : 'var(--border)'}`,
                    background: userRating === 'not_helpful' ? 'rgba(255,59,48,0.1)' : 'transparent',
                    color: userRating === 'not_helpful' ? '#ff3b30' : 'var(--text-muted)',
                    fontSize: '12.5px', fontWeight: 600,
                    cursor: user ? 'pointer' : 'not-allowed',
                    opacity: user ? 1 : 0.45,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => {
                    if (!user) return;
                    e.currentTarget.style.borderColor = '#ff3b30';
                    e.currentTarget.style.color = '#ff3b30';
                    if (userRating === 'not_helpful') {
                      e.currentTarget.style.background = 'rgba(255,59,48,0.18)';
                    } else {
                      e.currentTarget.style.background = 'rgba(255,59,48,0.05)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = userRating === 'not_helpful' ? '#ff3b30' : 'var(--border)';
                    e.currentTarget.style.color = userRating === 'not_helpful' ? '#ff3b30' : 'var(--text-muted)';
                    e.currentTarget.style.background = userRating === 'not_helpful' ? 'rgba(255,59,48,0.1)' : 'transparent';
                  }}
                >
                  <ThumbsDown size={13} style={{ display: 'inline-flex', alignItems: 'center' }} />
                  {counts.not_helpful_count > 0 ? counts.not_helpful_count : 0}
                </button>
                {userRating && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t.faqDashboard.thanksFeedback}</span>}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="faq-main">
        {/* Skeleton Category Pills (Only on All tab) */}
        {activeTab === 'all' && (
          <div className="category-filters" style={{ display: 'flex', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-pulse" style={{ height: '38px', width: i === 1 ? '100px' : '140px', borderRadius: '100px' }} />
            ))}
          </div>
        )}

        {/* Skeleton FAQ Controls */}
        <div className="faq-controls">
          <div className="skeleton-pulse" style={{ height: '20px', width: '150px', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '36px', width: '120px', borderRadius: '4px' }} />
        </div>

        {/* Skeleton FAQ items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-pulse" style={{ 
              height: '62px', 
              width: '100%', 
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{ height: '14px', width: '24px', borderRadius: '4px' }} />
                <div style={{ height: '16px', width: `${60 + (i % 3) * 10}%`, borderRadius: '4px' }} />
              </div>
              <div style={{ height: '16px', width: '16px', borderRadius: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="faq-main">

      {/* Category Filter Pills (Only on All tab) */}
      {activeTab === 'all' && (
        <div className="category-filters">
          {categoriesList.map((category) => (
            <button
              key={category}
              className={`category-pill${activeCategory === category ? ' active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'All' ? t.faqDashboard.allQuestions : category}
            </button>
          ))}
        </div>
      )}

      {/* Fuse.js suggestions dropdown */}
      {showSuggestions && searchSuggestions.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius)', padding: '8px', marginBottom: '12px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '4px' }}>
            {t.faqDashboard.fuzzySuggestions}
          </div>
          {searchSuggestions.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => {
                document.getElementById(s._id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setExpandedIds((prev) => { const n = new Set(prev); n.add(s._id); return n; });
                setShowSuggestions(false);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 10px', background: 'transparent',
                border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontSize: '12.5px', color: 'var(--text-primary)',
                transition: 'background 0.1s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent-glow)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {s.question}
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>{s.category}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowSuggestions(false)}
            style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: '10px', marginTop: '2px' }}
          >
            {t.faqDashboard.dismiss}
          </button>
        </div>
      )}

      {/* FAQ Controls */}
      <div className="faq-controls" onClick={() => setShowSuggestions(searchSuggestions.length > 0)}>
        <p className="faq-count">
          {t.faqDashboard.showing} <strong>{filteredFaqs.length}</strong> {filteredFaqs.length !== 1 ? t.faqDashboard.questionsPlural : t.faqDashboard.questions}
          {searchQuery.trim() && filteredFaqs.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — no exact match, try typing more</span>
          )}
          {activeTab === 'all' && activeCategory !== 'All' ? ` ${t.faqDashboard.inCategory} ${activeCategory}` : ''}
        </p>
        <div className="faq-controls-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isAdmin && (
            <button
              type="button"
              className="control-btn"
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                borderColor: 'var(--accent)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add New FAQ
            </button>
          )}
          <button
            type="button"
            className="control-btn"
            onClick={allExpanded ? collapseAll : expandAll}
          >
            {allExpanded ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 11l-5-5-5 5M17 18l-5-5-5 5" />
                </svg>
                {t.faqDashboard.collapseAll}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 13l-5 5-5-5M17 6l-5 5-5-5" />
                </svg>
                {t.faqDashboard.expandAll}
              </>
            )}
          </button>
        </div>
      </div>

      {/* No Results */}
      {filteredFaqs.length === 0 && (
        <div className="no-results">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="8" x2="14" y2="14" />
            <line x1="14" y1="8" x2="8" y2="14" />
          </svg>
          <h3>{t.faqDashboard.noResults}</h3>
          <p>{t.faqDashboard.noResultsHint}</p>
        </div>
      )}

      {activeTab === 'all' ? (
        /* FAQ Sections */
        groupedFilteredFaqs.map(([category, items]) => {
          const secId = `s-${distinctCategories.indexOf(category) + 1}`;
          return (
            <section key={category} id={secId} className="faq-section">
              <div className="section-header">
                <span className="section-number">{sectionNumbersMap[category] ?? '00'}</span>
                <h2 className="section-title">{category}</h2>
                <span className="section-count">{items.length}</span>
              </div>

              {items.map((faq) => {
                const isExpanded = expandedIds.has(faq._id);
                return renderFaqItem(faq, isExpanded);
              })}
            </section>
          );
        })
      ) : (
        /* Flat list for subpages (Most Asked, Latest, Bookmarked) */
        <div className="faq-flat-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedIds.has(faq._id);
            return renderFaqItem(faq, isExpanded, idx);
          })}
        </div>
      )}

      {showAddModal && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" style={{ width: '100%', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <FAQPromoterCard
              mode="create"
              categories={distinctCategories}
              onSubmit={handleCreateFaq}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqDashboard;
