import React from 'react';
import { Bell, CheckCheck, MessageSquare, CheckCircle2, Megaphone } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type: 'issue_resolved' | 'reply_received' | 'answer_approved' | 'announcement' | 'new_faq' | 'new_query';
  issueId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

const TypeIcon = ({ type }: { type: NotificationItem['type'] }) => {
  if (type === 'issue_resolved') return <CheckCircle2 size={14} style={{ color: '#34c759' }} />;
  if (type === 'reply_received') return <MessageSquare size={14} style={{ color: '#0a84ff' }} />;
  if (type === 'answer_approved') return <CheckCheck size={14} style={{ color: 'var(--accent)' }} />;
  return <Megaphone size={14} style={{ color: '#ff9f0a' }} />;
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications, onMarkRead, onMarkAllRead, onClose,
}) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, paddingTop: '12px', zIndex: 200,
    }}>
      <div style={{
        width: '320px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={15} /> Notifications
            {unreadCount > 0 && (
              <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{ fontSize: '11.5px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  if (!n.read) onMarkRead(n._id);
                  onClose();
                  const titleLower = n.title.toLowerCase();
                  const bodyLower = n.body.toLowerCase();
                  if (n.type === 'issue_resolved' || n.type === 'reply_received' || titleLower.includes('reply') || titleLower.includes('resolved')) {
                    navigate({ to: '/track-issues' });
                  } else if (n.type === 'new_faq' || titleLower.includes('new faq')) {
                    navigate({ to: '/faq' });
                  } else if (n.type === 'new_query' || titleLower.includes('new query') || titleLower.includes('query to resolve')) {
                    navigate({ to: '/resolve-question' });
                  } else if (titleLower.includes('profile') || bodyLower.includes('profile')) {
                    navigate({ to: '/profile' });
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 16px', cursor: 'pointer',
                  background: n.read ? 'transparent' : 'var(--accent-glow)',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-glow)')}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  <TypeIcon type={n.type} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {n.body}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '4px' }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
