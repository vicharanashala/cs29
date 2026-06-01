import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  reward_points: number;
  answered_count: number;
  questions_asked: number;
}

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/rewards/leaderboard`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const arr: LeaderboardEntry[] = Array.isArray(data)
          ? (data as LeaderboardEntry[])
          : ((data as any)?.data ?? (data as any)?.leaderboard ?? []);
        setEntries(arr);
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/rewards/my-points/${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.found || data.rank !== undefined) {
          setUserStats(data);
        }
      })
      .catch(() => {});
  }, [user?.email]);

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy size={18} style={{ color: '#FFD700' }} />;
    if (rank === 2) return <Medal size={18} style={{ color: '#C0C0C0' }} />;
    if (rank === 3) return <Medal size={18} style={{ color: '#CD7F32' }} />;
    return <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '18px', textAlign: 'center' }}>{rank}</span>;
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
        Loading leaderboard…
      </div>
    );
  }

  if (error || entries.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        {error ? 'Could not load leaderboard.' : 'No points awarded yet — be the first to help a peer!'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SECTION 1: YOUR RANKING & PERFORMANCE */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
          <Star size={15} style={{ color: 'var(--accent)' }} />
          Your Performance & Standing
        </h3>
        {userStats ? (
          <div
            style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-active)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--accent)',
                }}
              >
                #{userStats.rank || '—'}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {userStats.name || user?.name || 'Active Intern'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {userStats.answered_count || 0} resolved queries · {userStats.questions_asked || 0} raised
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 800, fontSize: '18px' }}>
              <Star size={16} fill="currentColor" />
              {userStats.reward_points || 0} SP
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
            {user ? 'No Spurti Points earned yet. Resolve peer queries to earn points and see your rank!' : 'Log in to view your personalized rank and Spurti Points.'}
          </div>
        )}
      </div>

      {/* SECTION 2: GLOBAL TOP 10 INTERNS */}
      <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <Trophy size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.05em', margin: 0 }}>
            Top 10 Contributing Interns
          </h3>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>Global Standings</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entries.map((entry) => (
            <div
              key={entry.email}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: entry.rank <= 3 ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                border: `1px solid ${entry.rank <= 3 ? 'var(--border-active)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0 }}>
                <RankIcon rank={entry.rank} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {entry.answered_count} answered · {entry.questions_asked} asked
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent)', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                <Star size={14} />
                {entry.reward_points}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Leaderboard;
