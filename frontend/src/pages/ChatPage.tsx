import React, { useState, useEffect, useRef } from 'react';
import { YakshaChat } from '../components/YakshaChat';
import { SimilarFaqsHint } from '../components/SimilarFaqsHint';
import { useLanguage } from '../context/LanguageContext';
import '../styles/chat.css';
import '../reference.css';

interface SimilarFaq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  score: number;
}

export const ChatPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = useState('');
  const [similarFaqs, setSimilarFaqs] = useState<SimilarFaq[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<SimilarFaq | null>(null);
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchInput.trim().length < 5) {
      setSimilarFaqs([]);
      setShowHint(false);
      setSearchError(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faqs/similar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchInput.trim() }),
        });
        const data: SimilarFaq[] = await res.json();
        if (data.length > 0) {
          setSimilarFaqs(data);
          setShowHint(true);
        } else {
          setSimilarFaqs([]);
          setShowHint(false);
        }
      } catch {
        setSimilarFaqs([]);
        setShowHint(false);
        setSearchError(true);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const handleSelectFaq = (faq: SimilarFaq) => {
    setSelectedFaq(faq);
    setShowHint(false);
    setSearchInput('');
  };

  return (
    <div className="chat-page">
      <div className="chat-container">

        {/* Similar FAQ quick-search */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="15" height="15"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.chatPage.searchPlaceholder}
              style={{
                width: '100%', paddingLeft: '36px', paddingRight: '16px',
                paddingTop: '10px', paddingBottom: '10px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text-primary)',
                fontSize: '13.5px', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {searchError && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', paddingLeft: '4px' }}>
              Could not reach the server — Yaksha chat below still works independently.
            </div>
          )}

          {showHint && (
            <div style={{ marginTop: '8px' }}>
              <SimilarFaqsHint
                faqs={similarFaqs}
                onDismiss={() => setShowHint(false)}
                onSelect={handleSelectFaq}
              />
            </div>
          )}

          {selectedFaq && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>{selectedFaq.category}</span>
                <button
                  onClick={() => setSelectedFaq(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }}
                >×</button>
              </div>
              <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {selectedFaq.question}
              </p>
              <div
                style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: selectedFaq.answer }}
              />
            </div>
          )}
        </div>

        <YakshaChat isModal={false} onClose={() => {}} />
      </div>
    </div>
  );
};
