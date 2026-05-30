import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'info' | 'important' | 'urgent';
  link?: string;
  date: string;
  createdBy: string;
}

export const AnnouncementForm: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'info' | 'important' | 'urgent'>('info');
  const [link, setLink] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vins_announcements');
    if (stored) {
      setAnnouncements(JSON.parse(stored));
    }
  }, []);

  const saveAnnouncements = (updated: Announcement[]) => {
    setAnnouncements(updated);
    localStorage.setItem('vins_announcements', JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const newAnnouncement: Announcement = {
      id: `ANN-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      priority,
      link: link.trim() || undefined,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdBy: user?.name || 'Admin',
    };

    saveAnnouncements([newAnnouncement, ...announcements]);
    setTitle('');
    setBody('');
    setPriority('info');
    setLink('');
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const updated = announcements.filter((a) => a.id !== deleteTarget.id);
    saveAnnouncements(updated);
    setDeleteTarget(null);
  };

  const priorityConfig = {
    info: { label: 'Info', color: '#0a84ff' },
    important: { label: 'Important', color: 'var(--accent)' },
    urgent: { label: 'Urgent', color: '#ff3b30' },
  };

  return (
    <div>
      <div className="admin-section-header">
        <h1>Announcements</h1>
        <p>Create and manage global announcements visible to all students.</p>
      </div>

      {/* Create Button / Form */}
      {!showForm ? (
        <button
          type="button"
          className="btn-accent"
          onClick={() => setShowForm(true)}
          style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13.5px' }}
        >
          <Plus size={14} /> Create Announcement
        </button>
      ) : (
        <div className="admin-promoter-card">
          <h3>
            <Bell size={18} style={{ color: 'var(--accent)' }} />
            New Announcement
          </h3>

          <form onSubmit={handleCreate}>
            <div className="admin-form-group">
              <label className="admin-form-label">Title</label>
              <input
                type="text"
                required
                className="admin-form-input"
                placeholder="e.g., Phase 2 Submission Deadline Extended"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Body</label>
              <textarea
                required
                className="admin-form-textarea"
                placeholder="Write the full announcement message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Priority Level</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['info', 'important', 'urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${priority === p ? priorityConfig[p].color : 'var(--border)'}`,
                        background: priority === p ? `${priorityConfig[p].color}15` : 'transparent',
                        color: priority === p ? priorityConfig[p].color : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s',
                        fontFamily: 'var(--font)',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Link (optional)</label>
                <input
                  type="url"
                  className="admin-form-input"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-modal-cancel"
                onClick={() => setShowForm(false)}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="submit"
                className="btn-accent"
                disabled={!title.trim() || !body.trim()}
                style={{ padding: '10px 20px', fontSize: '13.5px' }}
              >
                <Bell size={14} /> Publish Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="admin-empty-state">
          <Bell size={40} />
          <h3>No announcements yet</h3>
          <p>Create your first announcement to notify all students.</p>
        </div>
      ) : (
        <div className="admin-announcement-list">
          {announcements.map((ann) => (
            <div key={ann.id} className="admin-announcement-card">
              <div className="admin-announcement-info">
                <div className="admin-announcement-title">
                  <span className={`admin-priority-badge ${ann.priority}`}>
                    {priorityConfig[ann.priority].label}
                  </span>
                  {ann.title}
                </div>
                <div className="admin-announcement-body">{ann.body}</div>
                <div className="admin-announcement-date">
                  {ann.date} · by {ann.createdBy}
                  {ann.link && (
                    <a
                      href={ann.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: '12px', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}
                    >
                      <ExternalLink size={11} /> Link
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="admin-icon-btn danger"
                title="Delete announcement"
                onClick={() => setDeleteTarget(ann)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Announcement?</h3>
            <p>
              Remove "{deleteTarget.title}" from the announcements feed? This will be hidden from all students.
            </p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="admin-modal-confirm" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementForm;
