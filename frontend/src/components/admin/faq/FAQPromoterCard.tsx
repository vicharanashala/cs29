import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  view_count?: number;
}

interface FAQPromoterCardProps {
  mode: 'create' | 'edit';
  faq?: FaqItem;
  categories: string[];
  onSubmit: (data: { question: string; answer: string; category: string }) => Promise<void>;
  onCancel: () => void;
}

export const FAQPromoterCard: React.FC<FAQPromoterCardProps> = ({
  mode,
  faq,
  categories,
  onSubmit,
  onCancel,
}) => {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [category, setCategory] = useState(faq?.category || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || !category.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-promoter-card">
      <h3>
        <Sparkles size={18} style={{ color: 'var(--accent)' }} />
        {mode === 'create' ? 'Add New FAQ' : 'Edit FAQ'}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label className="admin-form-label">Question</label>
          <input
            type="text"
            required
            className="admin-form-input"
            placeholder="e.g., What is the NOC upload deadline?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">Answer (HTML supported)</label>
          <textarea
            required
            className="admin-form-textarea"
            placeholder="Provide the full resolution answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        {/* Preview */}
        {answer.trim() && (
          <div className="admin-form-group">
            <label className="admin-form-label">Preview</label>
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
              }}
              dangerouslySetInnerHTML={{ __html: answer }}
            />
          </div>
        )}

        <div className="admin-form-group">
          <label className="admin-form-label">Category</label>
          <select
            required
            className="admin-form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="General">General</option>
            <option value="Technical">Technical</option>
            <option value="Stipend">Stipend</option>
            <option value="Policy">Policy</option>
          </select>
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-modal-cancel"
            onClick={onCancel}
          >
            <X size={14} /> Cancel
          </button>
          <button
            type="submit"
            className="btn-accent"
            disabled={isSubmitting || !question.trim() || !answer.trim() || !category.trim()}
            style={{ padding: '10px 20px', fontSize: '13.5px' }}
          >
            <Sparkles size={14} /> {isSubmitting ? 'Publishing...' : mode === 'create' ? 'Publish FAQ' : 'Update FAQ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FAQPromoterCard;
