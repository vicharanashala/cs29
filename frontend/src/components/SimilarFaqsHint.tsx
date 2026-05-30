import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface SimilarFaq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  score: number;
}

interface SimilarFaqsHintProps {
  faqs: SimilarFaq[];
  onDismiss: () => void;
  onSelect: (faq: SimilarFaq) => void;
}

export const SimilarFaqsHint: React.FC<SimilarFaqsHintProps> = ({ faqs, onDismiss, onSelect }) => {
  if (faqs.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      marginBottom: '16px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Sparkles size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Did you mean one of these?
        </span>
        <button
          onClick={onDismiss}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)', padding: '2px',
            display: 'flex', alignItems: 'center',
          }}
          aria-label="Dismiss suggestions"
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {faqs.map((faq) => (
          <button
            key={faq._id}
            onClick={() => onSelect(faq)}
            style={{
              textAlign: 'left', background: 'var(--bg-glass)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '10px 14px', cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-active)';
              e.currentTarget.style.background = 'var(--accent-glow)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--bg-glass)';
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '2px' }}>
              {faq.question}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {faq.category} · {Math.round(faq.score * 100)}% match
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimilarFaqsHint;
