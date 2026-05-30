import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  reward_points: number;
  answered_count: number;
  questions_asked: number;
}

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Trophy size={18} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Spurti Points Leaderboard</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>Top 10 Interns</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {entries.map((entry) => (
          <div
            key={entry.email}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: entry.rank <= 3 ? 'var(--accent-glow)' : 'var(--bg-glass)',
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
  );
};

export default Leaderboard;
