import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Plus, Edit3, Trash2, Eye, ArrowUpDown, FolderOpen, Clock, Database } from 'lucide-react';
import { FAQPromoterCard } from './FAQPromoterCard';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  view_count?: number;
}

type SortKey = 'views' | 'category' | 'newest';

export const FAQManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('views');
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<FaqItem[]>(`${import.meta.env.VITE_API_URL}/api/faqs`);
      setFaqs(res.data);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(faqs.map((f) => f.category))).sort();
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    let result = faqs.filter(
      (faq) =>
        searchQuery === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortKey) {
      case 'views':
        result = [...result].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'category':
        result = [...result].sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'newest':
        result = [...result].sort((a, b) => b._id.localeCompare(a._id));
        break;
    }

    return result;
  }, [faqs, searchQuery, sortKey]);

  const handleCreate = async (data: { question: string; answer: string; category: string }) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/api/faqs`, data);
    setShowCreateForm(false);
    fetchFaqs();
  };

  const handleUpdate = async (data: { question: string; answer: string; category: string }) => {
    if (!editingFaq) return;
    await axios.put(`${import.meta.env.VITE_API_URL}/api/faqs/${editingFaq._id}`, data);
    setEditingFaq(null);
    fetchFaqs();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/faqs/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
    }
  };

  return (
    <div>
      <div className="admin-section-header">
        <h1>FAQ Management</h1>
        <p>View, edit, and manage all frequently asked questions in the database.</p>
      </div>

      {/* Create / Edit Form */}
      {(showCreateForm || editingFaq) && (
        <FAQPromoterCard
          mode={editingFaq ? 'edit' : 'create'}
          faq={editingFaq || undefined}
          categories={categories}
          onSubmit={editingFaq ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingFaq(null);
          }}
        />
      )}

      {/* Toolbar */}
      <div className="admin-faq-toolbar">
        <div className="admin-faq-search">
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search FAQs by question or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="admin-faq-sort">
            {[
              { key: 'views' as SortKey, label: 'Views', icon: <Eye size={12} /> },
              { key: 'category' as SortKey, label: 'Category', icon: <FolderOpen size={12} /> },
              { key: 'newest' as SortKey, label: 'Newest', icon: <Clock size={12} /> },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={sortKey === opt.key ? 'active' : ''}
                onClick={() => setSortKey(opt.key)}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {!showCreateForm && !editingFaq && (
            <button
              type="button"
              className="btn-accent"
              onClick={() => setShowCreateForm(true)}
              style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add FAQ
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={14} /> <strong>{faqs.length}</strong> Total FAQs
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={14} /> Sorted by {sortKey === 'views' ? 'View Count' : sortKey === 'category' ? 'Category' : 'Newest First'}
        </span>
      </div>

      {/* FAQ List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ height: '72px', borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="admin-empty-state">
          <Search size={40} />
          <h3>No FAQs found</h3>
          <p>{searchQuery ? 'Try a different search term.' : 'Add your first FAQ using the button above.'}</p>
        </div>
      ) : (
        <div className="admin-faq-table">
          {filteredFaqs.map((faq) => (
            <div key={faq._id} className="admin-faq-row">
              <div className="admin-faq-row-info">
                <div className="admin-faq-row-q">{faq.question}</div>
                <div className="admin-faq-row-cat">
                  <FolderOpen size={12} /> {faq.category}
                </div>
              </div>
              <div className="admin-faq-row-views">
                🔥 {faq.view_count || 0}
              </div>
              <div className="admin-faq-row-actions">
                <button
                  type="button"
                  className="admin-icon-btn"
                  title="Edit FAQ"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingFaq(faq);
                  }}
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  className="admin-icon-btn danger"
                  title="Delete FAQ"
                  onClick={() => setDeleteTarget(faq)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete FAQ?</h3>
            <p>
              Are you sure you want to permanently delete "{deleteTarget.question}"? This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-confirm"
                onClick={handleDelete}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQManagement;
