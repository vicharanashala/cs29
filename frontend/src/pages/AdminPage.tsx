import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPending,
  approvePending,
  rejectPending,
  getStats,
  getAdminFaqs,
  createFaq,
  deleteFaq,
} from '../api/admin';
import '../reference.css';

const CATEGORIES = [
  'About the Internship',
  'Certificate',
  'Code of Conduct',
  'Interviews',
  'NOC & Documents',
  'Phase 1 Coursework',
  'Rosetta Journal',
  'Selection & Offer Letter',
  'Team Formation',
  'Timing & Dates',
  'ViBe Platform',
  'Work & Mentorship',
  'Yaksha Chat',
];

interface PendingFaq {
  _id: string;
  question: string;
  suggestedAnswer: string;
  category: string;
  createdAt: string;
}

interface FaqRow {
  _id: string;
  question: string;
  category: string;
  view_count: number;
}

interface Stats {
  totalFaqs: number;
  pendingCount: number;
  resolvedToday: number;
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`admin-toast admin-toast--${type}`}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // All hooks must be declared before any conditional return (Rules of Hooks)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [newCat, setNewCat] = useState(CATEGORIES[0]);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  if (!user || user.role !== 'ADMIN') {
    navigate({ to: '/login' });
    return null;
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: statsData } = useQuery<Stats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => getStats().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: pending = [], isLoading: pendingLoading } = useQuery<PendingFaq[]>({
    queryKey: ['admin', 'pending'],
    queryFn: () => getPending().then((r) => r.data),
  });

  const { data: faqs = [], isLoading: faqsLoading } = useQuery<FaqRow[]>({
    queryKey: ['admin', 'faqs'],
    queryFn: () => getAdminFaqs().then((r) => r.data),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['faqs'] });
  };

  const approveMut = useMutation({
    mutationFn: (id: string) => approvePending(id),
    onSuccess: () => { invalidateAll(); showToast('FAQ approved and published.', 'success'); },
    onError: () => showToast('Failed to approve. Try again.', 'error'),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectPending(id),
    onSuccess: () => { invalidateAll(); showToast('Question rejected and removed.', 'success'); },
    onError: () => showToast('Failed to reject. Try again.', 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFaq(id),
    onSuccess: () => { invalidateAll(); showToast('FAQ deleted.', 'success'); },
    onError: () => showToast('Failed to delete. Try again.', 'error'),
  });

  const createMut = useMutation({
    mutationFn: () => createFaq({ question: newQ.trim(), answer: newA.trim(), category: newCat }),
    onSuccess: () => {
      invalidateAll();
      showToast('FAQ created successfully.', 'success');
      setNewQ(''); setNewA(''); setNewCat(CATEGORIES[0]); setAddOpen(false);
    },
    onError: () => showToast('Failed to create FAQ. Try again.', 'error'),
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim()) { showToast('Question and answer are required.', 'error'); return; }
    createMut.mutate();
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate({ to: '/' });
  };

  const distinctCategories = new Set(faqs.map((f) => f.category)).size;

  return (
    <div className="admin-page">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ── HEADER ── */}
      <header className="admin-header liquid-glass-header">
        <div className="admin-header-inner">
          <a className="logo" href="/" onClick={(e) => { e.preventDefault(); navigate({ to: '/' }); }}>
            <span className="logo-mark">V</span>
            <span className="logo-text">Admin Panel</span>
          </a>
          <div className="admin-header-right">
            <span className="admin-user-pill">{user.name}</span>
            <button className="nav-pill nav-pill--action" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="admin-body">

        {/* ── SECTION 1: STATS ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Overview</h2>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-label">Total FAQs</p>
              <p className="admin-stat-value">{statsData?.totalFaqs ?? '—'}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Pending Approvals</p>
              <p className="admin-stat-value">
                {statsData?.pendingCount ?? '—'}
                {(statsData?.pendingCount ?? 0) > 0 && (
                  <span className="admin-badge-red">{statsData!.pendingCount}</span>
                )}
              </p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Approved Today</p>
              <p className="admin-stat-value">{statsData?.resolvedToday ?? '—'}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Categories</p>
              <p className="admin-stat-value">{distinctCategories || '—'}</p>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: PENDING APPROVALS ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            Pending Approvals
            {pending.length > 0 && <span className="admin-badge-red">{pending.length}</span>}
          </h2>

          {pendingLoading ? (
            <p className="admin-empty">Loading…</p>
          ) : pending.length === 0 ? (
            <div className="admin-empty">No pending questions — you're all caught up!</div>
          ) : (
            <div className="admin-card-list">
              {pending.map((item) => (
                <div key={item._id} className="admin-pending-card">
                  <div className="admin-pending-meta">
                    <span className="admin-category-tag">{item.category}</span>
                    <span className="admin-pending-time">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="admin-pending-question">{item.question}</p>
                  <p className="admin-pending-answer">{item.suggestedAnswer}</p>
                  <div className="admin-pending-actions">
                    <button
                      className="admin-btn admin-btn--approve"
                      disabled={approveMut.isPending}
                      onClick={() => approveMut.mutate(item._id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="admin-btn admin-btn--reject"
                      disabled={rejectMut.isPending}
                      onClick={() => rejectMut.mutate(item._id)}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── SECTION 3: FAQ MANAGER ── */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">FAQ Manager</h2>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => setAddOpen((v) => !v)}
            >
              {addOpen ? '✕ Cancel' : '+ Add FAQ'}
            </button>
          </div>

          {addOpen && (
            <form className="admin-add-form" onSubmit={handleCreate}>
              <div className="admin-field">
                <label className="admin-label">Question</label>
                <input
                  className="admin-input"
                  placeholder="Enter the question…"
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Answer</label>
                <textarea
                  className="admin-input admin-textarea"
                  placeholder="Enter the answer…"
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Category</label>
                <select
                  className="admin-input admin-select"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={createMut.isPending}
                >
                  {createMut.isPending ? 'Saving…' : 'Save FAQ'}
                </button>
              </div>
            </form>
          )}

          {faqsLoading ? (
            <p className="admin-empty">Loading FAQs…</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Category</th>
                    <th>Views</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq._id}>
                      <td className="admin-table-question">{faq.question}</td>
                      <td><span className="admin-category-tag">{faq.category}</span></td>
                      <td className="admin-table-views">{faq.view_count}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn--delete"
                          disabled={deleteMut.isPending}
                          onClick={() => {
                            if (confirm('Delete this FAQ?')) deleteMut.mutate(faq._id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
