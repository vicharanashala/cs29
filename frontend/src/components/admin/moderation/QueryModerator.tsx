import React, { useState, useEffect, useMemo } from 'react';
import { Search, Inbox } from 'lucide-react';
import { QueryApprovalCard } from './QueryApprovalCard';

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

export const QueryModerator: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queue' | 'review' | 'resolved'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('vins_raised_issues');
    if (stored) {
      setIssues(JSON.parse(stored));
    }
  }, []);

  const saveIssues = (updated: Issue[]) => {
    setIssues(updated);
    localStorage.setItem('vins_raised_issues', JSON.stringify(updated));
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.raisedByName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [issues, statusFilter, searchQuery]);

  const activeIssue = issues.find((i) => i.id === selectedId) || filteredIssues[0] || null;

  const queueCount = issues.filter((i) => i.status === 'queue').length;
  const reviewCount = issues.filter((i) => i.status === 'review').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  const handleStatusChange = (issueId: string, newStatus: 'queue' | 'review' | 'resolved', resolution?: string) => {
    const updated = issues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: newStatus,
          resolution: resolution ?? issue.resolution,
        };
      }
      return issue;
    });
    saveIssues(updated);
  };

  const handlePublishAsFaq = (_issue: Issue) => {
    // FAQ has been published via axios in QueryApprovalCard
    // Could add a toast or visual feedback here
  };

  return (
    <div>
      <div className="admin-section-header">
        <h1>Query Moderation</h1>
        <p>Review, resolve, and moderate all community-raised queries.</p>
      </div>

      {/* Tab Switcher */}
      <div className="admin-mod-tabs">
        {[
          { key: 'all' as const, label: 'All', count: issues.length },
          { key: 'queue' as const, label: 'In Queue', count: queueCount },
          { key: 'review' as const, label: 'In Review', count: reviewCount },
          { key: 'resolved' as const, label: 'Resolved', count: resolvedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-mod-tab ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {issues.length === 0 ? (
        <div className="admin-empty-state">
          <Inbox size={48} />
          <h3>No queries raised yet</h3>
          <p>Issues raised by students will appear here for moderation.</p>
        </div>
      ) : (
        <div className="admin-mod-split">
          {/* Left: Issue List */}
          <div className="admin-mod-list">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="admin-faq-search" style={{ maxWidth: '100%' }}>
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search by ID, title, author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-mod-list-scroll">
              {filteredIssues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  className={`admin-mod-list-item ${activeIssue?.id === issue.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(issue.id)}
                >
                  <div className="admin-mod-item-top">
                    <span className="admin-mod-item-id">{issue.id}</span>
                    <span className={`portal-badge portal-badge--${issue.status}`}>
                      {issue.status === 'queue' ? 'In Queue' : issue.status === 'review' ? 'In Review' : 'Resolved'}
                    </span>
                  </div>
                  <div className="admin-mod-item-title">{issue.title}</div>
                  <div className="admin-mod-item-desc">
                    by {issue.raisedByName} · {issue.date}
                  </div>
                </button>
              ))}

              {filteredIssues.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  No matching queries found.
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail Panel */}
          {activeIssue ? (
            <QueryApprovalCard
              key={activeIssue.id}
              issue={activeIssue}
              onStatusChange={handleStatusChange}
              onPublishAsFaq={handlePublishAsFaq}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-muted)',
            }}>
              Select a query to review.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryModerator;
