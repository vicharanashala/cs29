import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, CheckCircle2, MessageSquare, Sparkles, BookOpen, AlertCircle, Award } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import '../styles/portal.css';

interface Reply {
  author: string;
  role: 'student' | 'mentor' | 'admin';
  text: string;
  time: string;
  authorEmail?: string;
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
}

const SEED_PEER_QUESTIONS: Issue[] = [
  {
    id: "VINS-9912",
    title: "Rosetta Journal weekly submission size limit",
    category: "Coursework",
    description: "I am trying to compile all weekly journal entries into a PDF, but with my screenshots, it is exceeding 15MB. The Rosetta portal says file size limit is 10MB. Should I compress the images or is there a Google Drive submission fallback?",
    urgency: "medium",
    status: "queue",
    raisedBy: "rahul@vins.in",
    raisedByName: "Rahul Sharma",
    date: "28 May 2026",
    replies: []
  },
  {
    id: "VINS-3810",
    title: "Git push rejected error on course branch",
    category: "Technical",
    description: "When pushing my Phase 1 codebase, I get 'error: failed to push some refs' because the remote contains work that I do not have locally. Should I run a git pull --rebase or force push? I do not want to overwrite my group project peers' code.",
    urgency: "high",
    status: "queue",
    raisedBy: "priya@vins.in",
    raisedByName: "Priya Patel",
    date: "29 May 2026",
    replies: []
  },
  {
    id: "VINS-2780",
    title: "Official timeline for VINS Certificate distribution",
    category: "Other",
    description: "After completing Phase 4 and achieving the Gold/Platinum badge, what is the exact timeline to get the stamped certificate from IIT Ropar? Is it emailed immediately or physically dispatched to our respective college department?",
    urgency: "low",
    status: "queue",
    raisedBy: "siddharth@vins.in",
    raisedByName: "Siddharth Verma",
    date: "29 May 2026",
    replies: []
  }
];

export const ResolveQuestionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load queue issues from backend (not localStorage)
  // NOTE: useEffect MUST be declared before any conditional return (Rules of Hooks)
  useEffect(() => {
    if (!user) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/issues?status=queue`)
      .then(res => res.json())
      .then((data: unknown) => {
        const arr: Issue[] = Array.isArray(data)
          ? (data as Issue[])
          : ((data as any)?.data ?? (data as any)?.issues ?? []);
        setIssues(arr);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load queue:', err);
        setIssues(SEED_PEER_QUESTIONS);
        setIsLoading(false);
      });
  }, [user]);

  // Automatically select question from URL hash or query params
  useEffect(() => {
    const handleLocationSelect = () => {
      const hash = window.location.hash;
      const idFromHash = hash && hash.startsWith('#') ? hash.slice(1) : null;
      const params = new URLSearchParams(window.location.search);
      const idFromQuery = params.get('id');
      const targetId = idFromHash || idFromQuery;
      if (targetId && issues.some(i => i.id === targetId)) {
        setSelectedIssueId(targetId);
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

  // Filter open community questions: raised by others, status is 'queue', and not yet replied to by this user
  const queueQuestions = issues.filter(issue => 
    issue.status === 'queue' && 
    issue.raisedBy !== user.email &&
    !issue.replies?.some(r => r.authorEmail === user.email || r.author.includes(user.email) || (user.name && r.author.includes(user.name)))
  );

  const activeQuestion = queueQuestions.find(i => i.id === selectedIssueId) || queueQuestions[0] || null;

  // Handle posting the answer (saves reply to DB + updates status to 'review')
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !activeQuestion) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/issues/${activeQuestion.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: `${user.name || user.email.split('@')[0]} (Peer)`,
          role: 'student',
          text: answerText.trim(),
          authorEmail: user.email,
        }),
      });

      if (res.ok) {
        // Update status to 'review'
        await fetch(`${import.meta.env.VITE_API_URL}/api/issues/${activeQuestion.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'review' }),
        });
        setAnswerText('');
        setIsAnswered(true);
        setTimeout(() => {
          setIsAnswered(false);
          setSelectedIssueId(null);
          // Reload queue from backend
          fetch(`${import.meta.env.VITE_API_URL}/api/issues?status=queue`)
            .then(res => res.json())
            .then((data: unknown) => {
              const arr: Issue[] = Array.isArray(data)
                ? (data as Issue[])
                : ((data as any)?.data ?? (data as any)?.issues ?? []);
              setIssues(arr);
            })
            .catch(() => {});
        }, 4000);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-container">
        
        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <ArrowLeft size={16} /> Back to Overview
          </Link>
        </div>

        {/* Portal Header */}
        <div className="portal-header">
          <div className="portal-title-area">
            <span className="portal-overline">Intern portal</span>
            <h1 className="portal-title">Resolve a Question</h1>
            <p className="portal-subtitle">
              Help your fellow interns by providing detailed, accurate answers. Earn Spurti Points to unlock exclusive badge levels.
            </p>
          </div>
        </div>

        {/* Available questions stats row */}
        <div className="portal-stats-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="portal-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="portal-stat-label">Available Questions</div>
            <div className="portal-stat-value" style={{ color: 'var(--accent)' }}>
              {queueQuestions.length} <span className="portal-stat-unit">In Queue</span>
            </div>
          </div>
        </div>

        {isAnswered && (
          <div className="portal-success-banner" style={{ marginBottom: '24px' }}>
            <Sparkles size={18} />
            <span><strong>Success!</strong> Answer submitted for Senior Review.</span>
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
            <p style={{ fontSize: '14px' }}>Loading community questions...</p>
          </div>
        )}

        {!isLoading && queueQuestions.length === 0 ? (
          <div className="portal-empty-state">
            <div className="portal-empty-icon" style={{ color: '#34c759', background: 'rgba(52,199,89,0.1)' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 className="portal-empty-title">All Caught Up!</h2>
            <p className="portal-empty-desc">
              Excellent work. There are no open questions in the community queue right now. Check back later to help your peers!
            </p>
            <Link to="/track-issues" className="btn-secondary">View My Issues</Link>
          </div>
        ) : (
          <div className="portal-split-layout">
            
            {/* LEFT Panel: Available questions queue */}
            <aside className="portal-side-list">
              <div className="portal-list-header">
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} style={{ color: 'var(--accent)' }} /> Open Queue
                </h3>
              </div>

              <div className="portal-scroll-list">
                {queueQuestions.map((q) => (
                  <button
                    key={q.id}
                    className={`portal-list-item ${activeQuestion?.id === q.id ? 'active' : ''}`}
                    onClick={() => setSelectedIssueId(q.id)}
                  >
                    <div className="portal-item-meta">
                      <span className="portal-item-id">{q.id}</span>
                      <span className={`portal-badge portal-badge--${q.urgency}`}>
                        {q.urgency}
                      </span>
                    </div>
                    <div className="portal-item-title">{q.title}</div>
                    <div className="portal-item-desc">{q.description}</div>
                  </button>
                ))}
              </div>
            </aside>

            {/* RIGHT Panel: Resolve question details & form */}
            {activeQuestion ? (
              <main className="portal-detail-view">
                <div className="portal-detail-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <span className="portal-badge portal-badge--queue">
                      Needs Answer
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Raised on {activeQuestion.date}
                    </span>
                  </div>
                  <h2 className="portal-detail-title">{activeQuestion.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Category: <strong>{activeQuestion.category}</strong></span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                    <span>Author: <strong>{activeQuestion.raisedByName}</strong></span>
                  </div>
                </div>

                <div className="portal-bubble-section">
                  {/* Detailed description */}
                  <div className="portal-bubble-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                    <div className="portal-bubble-meta">
                      <span className="portal-bubble-author">{activeQuestion.raisedByName}</span>
                      <span className="portal-bubble-time">{activeQuestion.date}</span>
                    </div>
                    <div className="portal-bubble-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {activeQuestion.description}
                    </div>
                  </div>
                </div>

                {/* Markdown Answer Editor */}
                <div className="portal-answer-editor">
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} style={{ color: 'var(--accent)' }} /> Write Your Peer Resolution
                  </h3>

                  {/* Points preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: '16px' }}>
                    <Award size={16} style={{ color: '#34c759', flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: '#34c759' }}>+10 Spurti Points</strong> will be credited to your profile once a senior mentor approves this answer.
                    </span>
                  </div>
                  
                  <div 
                    style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      background: 'var(--accent-glow)', 
                      border: '1px solid var(--border-active)', 
                      borderRadius: 'var(--radius)', 
                      padding: '14px 16px', 
                      marginBottom: '16px' 
                    }}
                  >
                    <AlertCircle size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong>Mentorship Guidelines:</strong> Provide step-by-step technical steps. If providing a git command or file structure, wrap them in backticks (`code`). Vague or incorrect answers will be flagged by senior reviewers and penalty points will be applied.
                    </span>
                  </div>

                  <form onSubmit={handleSubmitAnswer}>
                    <textarea
                      required
                      rows={6}
                      placeholder="Write a clear, thorough explanation to resolve this question..."
                      className="form-input"
                      style={{ width: '100%', padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)', resize: 'vertical', lineHeight: 1.5, marginBottom: '16px' }}
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        type="submit"
                        disabled={!answerText.trim()}
                        className="btn-accent"
                      >
                        <Send size={14} /> Submit Peer Resolution
                      </button>
                    </div>
                  </form>
                </div>
              </main>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
                Select a question from the left queue to get started.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
