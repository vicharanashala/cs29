import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, ExternalLink, Megaphone } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Leaderboard } from '../components/Leaderboard';
import '../styles/portal.css';

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'info' | 'important' | 'urgent';
  link?: string;
  date: string;
  createdBy: string;
}

const priorityConfig = {
  info: { label: 'Info', color: '#0a84ff', bg: 'rgba(10, 132, 255, 0.08)', border: 'rgba(10, 132, 255, 0.15)' },
  important: { label: 'Important', color: 'var(--accent)', bg: 'var(--accent-glow)', border: 'var(--border-active)' },
  urgent: { label: 'Urgent', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.08)', border: 'rgba(255, 59, 48, 0.15)' },
};

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const stored = localStorage.getItem('vins_announcements');
      if (stored) {
        setAnnouncements(JSON.parse(stored));
      }
    } catch {
      // Corrupt localStorage entry — silently ignore
    }
  }, []);

  return (
    <div className="portal-page">
      <div className="portal-container" style={{ maxWidth: '860px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} /> Back to Overview
          </Link>
        </div>

        {/* Page Header */}
        <div className="portal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="portal-title-area">
            <span className="portal-overline">Vicharanashala</span>
            <h1 className="portal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={28} style={{ color: 'var(--accent)' }} />
              Announcements
            </h1>
            <p className="portal-subtitle">
              Official announcements and updates from the Vicharanashala administration.
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          marginBottom: '32px',
          backdropFilter: 'blur(24px) saturate(1.3)',
        }}>
          <Leaderboard />
        </div>

        {/* Announcements Feed */}
        {announcements.length === 0 ? (
          <div className="portal-empty-state">
            <div className="portal-empty-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
              <Megaphone size={32} />
            </div>
            <h2 className="portal-empty-title">No Announcements Yet</h2>
            <p className="portal-empty-desc">
              There are no announcements at this time. Check back later for updates from the administration.
            </p>
            <Link to="/faq" className="btn-secondary">Browse FAQs</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {announcements.map((ann, index) => {
              const config = priorityConfig[ann.priority];
              return (
                <div
                  key={ann.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${config.border}`,
                    borderLeft: `4px solid ${config.color}`,
                    borderRadius: 'var(--radius)',
                    padding: '24px 28px',
                    backdropFilter: 'blur(24px) saturate(1.3)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.25s ease',
                    animation: `adminSlideUp 0.4s ease ${index * 0.08}s both`,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = config.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = config.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        background: config.bg,
                        color: config.color,
                        border: `1px solid ${config.border}`,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {config.label}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {ann.date}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}>
                    {ann.title}
                  </h3>

                  <p style={{
                    fontSize: '14.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: ann.link ? '14px' : '0',
                  }}>
                    {ann.body}
                  </p>

                  {ann.link && (
                    <a
                      href={ann.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent)',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <ExternalLink size={13} /> View Details
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
