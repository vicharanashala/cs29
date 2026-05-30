import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Flame } from 'lucide-react';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  view_count?: number;
}

export const TopFAQsList: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get<FaqItem[]>(`${import.meta.env.VITE_API_URL}/api/faqs`)
      .then((res) => {
        const sorted = [...res.data]
          .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 10);
        setFaqs(sorted);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch FAQs:', err);
        setIsLoading(false);
      });
  }, []);

  const maxViews = faqs.length > 0 ? Math.max(...faqs.map((f) => f.view_count || 0), 1) : 1;

  const getRankDisplay = (index: number): { emoji: string; className: string } => {
    switch (index) {
      case 0:
        return { emoji: '🥇', className: 'gold' };
      case 1:
        return { emoji: '🥈', className: 'silver' };
      case 2:
        return { emoji: '🥉', className: 'bronze' };
      default:
        return { emoji: `${index + 1}`, className: 'default' };
    }
  };

  return (
    <div className="admin-leaderboard">
      <div className="admin-leaderboard-header">
        <h2>
          <Flame size={20} style={{ color: 'var(--accent)' }} />
          Top 10 Most Asked FAQs
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Ranked by view count
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No FAQ data available yet.
        </div>
      ) : (
        faqs.map((faq, index) => {
          const rank = getRankDisplay(index);
          const viewPercent = ((faq.view_count || 0) / maxViews) * 100;

          return (
            <div key={faq._id} className="admin-leaderboard-item">
              <div className={`admin-lb-rank ${rank.className}`}>
                {rank.emoji}
              </div>
              <div className="admin-lb-info">
                <div className="admin-lb-question">{faq.question}</div>
                <div className="admin-lb-bar-track">
                  <div
                    className="admin-lb-bar-fill"
                    style={{ width: `${viewPercent}%` }}
                  />
                </div>
                <span className="admin-lb-category">{faq.category}</span>
              </div>
              <div className="admin-lb-views">
                🔥 {faq.view_count || 0}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TopFAQsList;
