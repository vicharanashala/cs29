import React from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Leaderboard } from '../components/Leaderboard';
import '../styles/portal.css';

export const LeaderboardPage: React.FC = () => {
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
              <Trophy size={28} style={{ color: 'var(--accent)' }} />
              SP Leaderboard
            </h1>
            <p className="portal-subtitle">
              Browse the top contributing interns in the Vicharanashala Internship Programme (VINS).
            </p>
          </div>
        </div>

        {/* Leaderboard Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          backdropFilter: 'blur(24px) saturate(1.3)',
        }}>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
