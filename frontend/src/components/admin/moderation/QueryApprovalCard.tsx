import React, { useState } from 'react';
import { Send, CheckCircle2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { AnswerReviewList } from './AnswerReviewList';

interface Reply {
  author: string;
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

interface QueryApprovalCardProps {
  issue: Issue;
  onStatusChange: (issueId: string, newStatus: 'queue' | 'review' | 'resolved', resolution?: string) => void;
  onPublishAsFaq: (issue: Issue) => void;
}

export const QueryApprovalCard: React.FC<QueryApprovalCardProps> = ({
  issue,
  onStatusChange,
  onPublishAsFaq,
}) => {
  const [resolutionText, setResolutionText] = useState(issue.resolution || '');
  const [isPublished, setIsPublished] = useState(false);

  const handleApproveAnswer = (text: string) => {
    setResolutionText(text);
    onStatusChange(issue.id, 'resolved', text);
  };

  const handleReframe = (text: string) => {
    setResolutionText(text);
  };

  const handleResolveWithCustom = () => {
    if (!resolutionText.trim()) return;
    onStatusChange(issue.id, 'resolved', resolutionText.trim());
  };

  const handlePublish = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/faqs`, {
        question: issue.title,
        answer: resolutionText || issue.resolution || issue.description,
        category: issue.category || 'General',
      });
      setIsPublished(true);
      onPublishAsFaq(issue);
      setTimeout(() => setIsPublished(false), 3000);
    } catch (err) {
      console.error('Failed to publish FAQ:', err);
    }
  };

  const statusColor = issue.status === 'resolved' ? '#34c759' : issue.status === 'review' ? '#bf5af2' : 'var(--accent)';
  const statusLabel = issue.status === 'queue' ? 'In Queue' : issue.status === 'review' ? 'In Review' : 'Resolved';

  return (
    <div className="admin-detail-panel">
      {/* Header */}
      <div className="admin-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span className={`portal-badge portal-badge--${issue.urgency}`} style={{ textTransform: 'uppercase' }}>
            {issue.urgency} Urgency
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Raised on {issue.date}
          </span>
        </div>
        <h2 className="admin-detail-title">{issue.title}</h2>
        <div className="admin-detail-meta">
          <span>By: <strong>{issue.raisedByName}</strong></span>
          <span className="dot" />
          <span>Category: <strong>{issue.category}</strong></span>
          <span className="dot" />
          <span>Status: <strong style={{ color: statusColor }}>{statusLabel}</strong></span>
        </div>

        {/* Status Controls */}
        <div className="admin-status-controls">
          <button
            type="button"
            className={`admin-status-btn ${issue.status === 'queue' ? 'active-queue' : ''}`}
            onClick={() => onStatusChange(issue.id, 'queue')}
          >
            In Queue
          </button>
          <button
            type="button"
            className={`admin-status-btn ${issue.status === 'review' ? 'active-review' : ''}`}
            onClick={() => onStatusChange(issue.id, 'review')}
          >
            In Review
          </button>
          <button
            type="button"
            className={`admin-status-btn ${issue.status === 'resolved' ? 'active-resolved' : ''}`}
            onClick={() => onStatusChange(issue.id, 'resolved', resolutionText || undefined)}
          >
            <CheckCircle2 size={14} /> Resolved
          </button>
        </div>
      </div>

      {/* Original description */}
      <div style={{
        background: 'var(--bg-card-hover)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Original Description
        </div>
        <div style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {issue.description}
        </div>
      </div>

      {/* Peer answers */}
      <AnswerReviewList
        replies={issue.replies}
        onApprove={handleApproveAnswer}
        onReframe={handleReframe}
      />

      {/* Resolution Editor */}
      <div className="admin-resolution-editor">
        <h3>
          <Send size={16} /> Admin Resolution
        </h3>
        <textarea
          className="admin-resolution-textarea"
          placeholder="Write the final, official resolution for this issue..."
          value={resolutionText}
          onChange={(e) => setResolutionText(e.target.value)}
        />
        <div className="admin-resolution-actions">
          {issue.status === 'resolved' && (
            <button
              type="button"
              className="admin-approve-btn"
              onClick={handlePublish}
              style={{ padding: '10px 20px' }}
            >
              <Sparkles size={14} /> {isPublished ? 'Published! ✓' : 'Publish as FAQ'}
            </button>
          )}
          <button
            type="button"
            className="btn-accent"
            onClick={handleResolveWithCustom}
            disabled={!resolutionText.trim()}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            <CheckCircle2 size={14} /> Resolve Issue
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueryApprovalCard;
