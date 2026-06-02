import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, ArrowLeft, Send, CheckCircle2, MessageSquare, Search } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import '../styles/portal.css';

interface Reply {
  author: string;
  authorEmail?: string;
  role: 'student' | 'mentor' | 'admin';
  text: string;
  time: string;
}

interface Issue {
  id: string;
  title: string;
  category: string;
  description: string;
  urgency: string;
  status: 'queue' | 'review' | 'resolved';
  raisedBy: string;
  raisedByName: string;
  date: string;
  replies: Reply[];
  resolution?: string;
}

export const TrackIssuesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'queue' | 'review' | 'resolved'>('all');
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [spurtiPoints, setSpurtiPoints] = useState(0);

  // Load issues from backend
  // NOTE: useEffect MUST be declared before any conditional return (Rules of Hooks)
  useEffect(() => {
    if (!user) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/issues?raisedBy=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then((data: unknown) => {
        const arr: Issue[] = Array.isArray(data)
          ? (data as Issue[])
          : ((data as any)?.data ?? (data as any)?.issues ?? []);
        const mapped = arr.map((issue: any) => ({
          ...issue,
          status: issue.status === 'resolved'
            ? 'resolved'
            : (issue.replies && issue.replies.length > 0 ? 'review' : 'queue')
        }));
        setIssues(mapped);
        setIsLoading(false);
      })
      .catch(err => { console.error('Failed to load issues:', err); setIsLoading(false); });
  }, [user]);
  useEffect(() => {
  if (!user?.email) return;

  fetch(`${import.meta.env.VITE_API_URL}/api/rewards/my-points/${encodeURIComponent(user.email)}`)
    .then((res) => res.json())
    .then((data) => {
      setSpurtiPoints(data.reward_points ?? 0);
    })
    .catch(() => {
      setSpurtiPoints(0);
    });
}, [user]);

  // Automatically select issue from URL hash or query params
  useEffect(() => {
    const handleLocationSelect = () => {
      const hash = window.location.hash;
      const idFromHash = hash && hash.startsWith('#') ? hash.slice(1) : null;
      const params = new URLSearchParams(window.location.search);
      const idFromQuery = params.get('id');
      const targetId = idFromHash || idFromQuery;
      if (targetId && issues.some(i => i.id === targetId)) {
        setSelectedIssueId(targetId);
        setStatusFilter('all');
      }
    };
    if (issues.length > 0) {
      handleLocationSelect();
    }
  }, [issues]);

  if (!user) {
    navigate({ to: '/login' });
    return null;
  }

  const activeIssue = issues.find(i => i.id === selectedIssueId) || null;

  // Track stats
  const totalRaised = issues.length;
  const reviewCount = issues.filter(i => i.status === 'review').length;
  const queueCount = issues.filter(i => i.status === 'queue').length;


  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          issue.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle posting a reply via backend API
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeIssue) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/issues/${activeIssue.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
         author: user.name || user.email.split('@')[0],
         authorEmail: user.email,
         role: user.role,
         text: replyText.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setIssues(prev => prev.map(i => {
          if (i.id === activeIssue.id) {
            const newReplies = updated.replies || [];
            return {
              ...i,
              replies: newReplies,
              status: i.status === 'resolved' ? 'resolved' : (newReplies.length > 0 ? 'review' : 'queue')
            };
          }
          return i;
        }));
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  // Handle "Publish as FAQ" action
  const handlePublishAsFaq = async (issue: Issue) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/issues/${issue.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        status: 'resolved',
        resolution: 'Published as FAQ',
        }),
      });
      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status: 'resolved' as const } : i));
      setSelectedIssueId(null);
      setIsPublished(true);
      setTimeout(() => setIsPublished(false), 3000);
    } catch (err) {
      console.error('Failed to publish as FAQ:', err);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-container">

        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Overview
          </Link>
        </div>

        {/* Portal Header */}
        <div className="portal-header">
          <div className="portal-title-area">
            <span className="portal-overline">Intern portal</span>
            <h1 className="portal-title">Track My Issues</h1>
            <p className="portal-subtitle">
              Monitor the status of your queries, collaborate with peer responders, and review senior mentor approvals.
            </p>
          </div>
          <Link to="/raise-issue" className="btn-accent">Raise Another Issue</Link>
        </div>

        {/* Stats Row */}
        <div className="portal-stats-row">
          <div className="portal-stat-card">
            <div className="portal-stat-label">Total Issues</div>
            <div className="portal-stat-value">{totalRaised} <span className="portal-stat-unit">Submitted</span></div>
          </div>
          <div className="portal-stat-card">
            <div className="portal-stat-label">Awaiting Peers</div>
            <div className="portal-stat-value" style={{ color: 'var(--accent)' }}>{queueCount} <span className="portal-stat-unit">In Queue</span></div>
          </div>
          <div className="portal-stat-card">
            <div className="portal-stat-label">Under Review</div>
            <div className="portal-stat-value" style={{ color: '#bf5af2' }}>{reviewCount} <span className="portal-stat-unit">Approving</span></div>
          </div>
          <div className="portal-stat-card">
            <div className="portal-stat-label">Spurti Earned</div>
            <div className="portal-stat-value" style={{ color: '#34c759' }}>+{spurtiPoints} <span className="portal-stat-unit">Points</span></div>
          </div>
        </div>

        {isPublished && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 'var(--radius)', color: '#34c759', fontSize: '14px', marginBottom: '16px' }}>
            <CheckCircle2 size={18} />
            Issue published as FAQ successfully!
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
            <p style={{ fontSize: '14px' }}>Loading your issues...</p>
          </div>
        )}

        {!isLoading && issues.length === 0 && (
          <div className="portal-empty-state">
            <div className="portal-empty-icon">
              <HelpCircle size={32} />
            </div>
            <h2 className="portal-empty-title">No issues raised yet</h2>
            <p className="portal-empty-desc">
              If you have any questions or are stuck on logistics like NOC or stipend verifications, raise a community issue to get peer assistance.
            </p>
            <Link to="/raise-issue" className="btn-accent">Raise an Issue</Link>
          </div>
        )}

        {!isLoading && issues.length > 0 && (
          <div className="portal-split-layout">

            {/* LEFT Panel: Issues list */}
            <aside className="portal-side-list">
              <div className="portal-list-header">
                {/* Search Bar */}
                <div className="portal-search-bar" style={{ marginBottom: '16px' }}>
                  <Search size={16} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by ID, title, category..."
                    className="portal-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  {(['all', 'queue', 'review', 'resolved'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        border: 'none',
                        background: statusFilter === tab ? 'var(--bg-glass)' : 'transparent',
                        color: statusFilter === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab === 'queue' ? 'In Queue' : tab === 'review' ? 'In Review' : tab === 'resolved' ? 'Resolved' : 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="portal-scroll-list">
                {filteredIssues.map((issue) => (
                  <button
                    key={issue.id}
                    className={`portal-list-item ${activeIssue?.id === issue.id ? 'active' : ''}`}
                    onClick={() => setSelectedIssueId(issue.id)}
                  >
                    <div className="portal-item-meta">
                      <span className="portal-item-id">{issue.id}</span>
                      <span className={`portal-badge portal-badge--${issue.status}`}>
                        {issue.status === 'queue' ? 'In Queue' : issue.status === 'review' ? 'In Review' : 'Resolved'}
                      </span>
                    </div>
                    <div className="portal-item-title">{issue.title}</div>
                    <div className="portal-item-desc">{issue.description}</div>
                  </button>
                ))}

                {filteredIssues.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    No matching issues found.
                  </div>
                )}
              </div>
            </aside>

            {/* RIGHT Panel: Selected Issue Detail */}
            {activeIssue ? (
              <main className="portal-detail-view">
                <div className="portal-detail-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <span className={`portal-badge portal-badge--${activeIssue.urgency}`} style={{ textTransform: 'uppercase' }}>
                      {activeIssue.urgency} Urgency
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Raised on {activeIssue.date}
                    </span>
                  </div>
                  <h2 className="portal-detail-title">{activeIssue.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Category: <strong>{activeIssue.category}</strong></span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                    <span>Status: <strong style={{ color: activeIssue.status === 'resolved' ? '#34c759' : activeIssue.status === 'review' ? '#bf5af2' : 'var(--accent)' }}>
                      {activeIssue.status === 'queue' ? 'Awaiting Peer Help' : activeIssue.status === 'review' ? 'Awaiting Mentor Review' : 'Approved FAQ'}
                    </strong></span>
                  </div>
                </div>

                {/* Conversation bubbles */}
                <div className="portal-bubble-section">
                  {/* Original Question Card */}
                  <div className="portal-bubble-card portal-bubble-card--user">
                    <div className="portal-bubble-meta">
                      <span className="portal-bubble-author">{activeIssue.raisedByName} (Intern)</span>
                      <span className="portal-bubble-time">{activeIssue.date}</span>
                    </div>
                    <div className="portal-bubble-text">{activeIssue.description}</div>
                  </div>

                  {/* Replies */}
                  {activeIssue.replies.map((reply, index) => (
                    <div key={index} className="portal-bubble-card">
                      <div className="portal-bubble-meta">
                        <span
                          className="portal-bubble-author"
                          style={{ color: reply.role === 'mentor' ? 'var(--accent)' : reply.role === 'admin' ? '#bf5af2' : 'var(--text-primary)' }}
                        >
                          {reply.author} {reply.role === 'mentor' ? '• Mentor' : reply.role === 'admin' ? '• Admin' : '• Peer'}
                        </span>
                        <span className="portal-bubble-time">{reply.time}</span>
                      </div>
                      <div className="portal-bubble-text">{reply.text}</div>
                    </div>
                  ))}
                </div>

                {/* Final Approved Resolution section if resolved */}
                {activeIssue.status === 'resolved' && activeIssue.resolution && (
                  <div
                    style={{
                      background: 'rgba(52,199,89,0.06)',
                      border: '1px solid rgba(52,199,89,0.2)',
                      borderRadius: 'var(--radius)',
                      padding: '24px',
                      marginBottom: '32px'
                    }}
                  >
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#34c759', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} /> Official FAQ Resolution
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {activeIssue.resolution}
                    </p>
                  </div>
                )}

                {/* Reply Form */}
                {activeIssue.status !== 'resolved' && (
                  <div className="portal-answer-editor">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} /> Write a Reply
                    </h3>
                    <form onSubmit={handlePostReply}>
                      <textarea
                        required
                        rows={4}
                        placeholder="Add to the conversation or reply to mentor feedback..."
                        style={{ width: '100%', padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)', resize: 'vertical', lineHeight: 1.5, marginBottom: '16px' }}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        {activeIssue.status === 'review' && (
                          <button
                            type="button"
                            onClick={() => handlePublishAsFaq(activeIssue)}
                            style={{ padding: '10px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <CheckCircle2 size={14} /> Publish as FAQ
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={!replyText.trim()}
                          className="btn-accent"
                        >
                          <Send size={14} /> Send Message
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </main>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
                No active issues found in the filter view.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};