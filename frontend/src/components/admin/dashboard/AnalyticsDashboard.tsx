import React, { useState, useEffect } from 'react';
import { Database, HelpCircle, Eye, CheckCircle2, Clock, AlertCircle, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { TopFAQsList } from './TopFAQsList';

interface TopFaq {
  _id: string;
  question: string;
  category: string;
  view_count: number;
}

interface CategoryDatum {
  name: string;
  count: number;
}

interface VolumeDatum {
  date: string;
  count: number;
}

interface AnalyticsData {
  totalFaqs: number;
  totalViews: number;
  topFaqs: TopFaq[];
  categoryData: CategoryDatum[];
  volumeData: VolumeDatum[];
}

interface Issue {
  id: string;
  status: 'queue' | 'review' | 'resolved';
}

interface AnalyticsDashboardProps {
  onNavigate: (section: string) => void;
}

const PIE_COLORS = ['#6c63ff', '#0a84ff', '#34c759', '#ff9f0a', '#ff453a', '#bf5af2', '#30d158', '#64d2ff'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{payload[0].value}</div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch analytics from backend
    fetch(`${import.meta.env.VITE_API_URL}/api/faqs/analytics`)
      .then((r) => r.json())
      .then((data: AnalyticsData) => {
        setAnalytics(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    // Load issues from backend
    fetch(`${import.meta.env.VITE_API_URL}/api/issues`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const arr: Issue[] = Array.isArray(data)
          ? (data as Issue[])
          : ((data as any)?.data ?? (data as any)?.issues ?? []);
        setIssues(arr);
      })
      .catch(() => {});
  }, []);

  const queueCount = issues.filter((i) => i.status === 'queue').length;
  const reviewCount = issues.filter((i) => i.status === 'review').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  const stats = [
    {
      label: 'Total FAQs',
      value: analytics?.totalFaqs ?? 0,
      unit: 'Published',
      icon: <Database size={16} />,
      accent: 'var(--accent)',
    },
    {
      label: 'Total Views',
      value: analytics?.totalViews ?? 0,
      unit: 'All Time',
      icon: <Eye size={16} />,
      accent: '#0a84ff',
    },
    {
      label: 'Issues Raised',
      value: issues.length,
      unit: `${queueCount} in queue`,
      icon: <HelpCircle size={16} />,
      accent: '#bf5af2',
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      unit: `${reviewCount} reviewing`,
      icon: <CheckCircle2 size={16} />,
      accent: '#34c759',
    },
  ];

  return (
    <div>
      <div className="admin-section-header">
        <h1>Dashboard</h1>
        <p>Overview of your FAQ portal metrics and activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="admin-stat-card"
            style={{ '--_stat-accent': stat.accent } as React.CSSProperties}
          >
            <div className="admin-stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: stat.accent }}>{stat.icon}</span>
              {stat.label}
            </div>
            {isLoading ? (
              <div className="skeleton-pulse" style={{ height: '32px', width: '80px', borderRadius: '4px' }} />
            ) : (
              <div className="admin-stat-value">
                {stat.value.toLocaleString()}
                <span className="unit">{stat.unit}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <button type="button" className="admin-quick-action" onClick={() => onNavigate('moderation')}>
          <AlertCircle size={14} /> Moderate Queries
          {queueCount > 0 && (
            <span style={{ background: '#ff3b30', color: '#fff', padding: '2px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
              {queueCount}
            </span>
          )}
        </button>
        <button type="button" className="admin-quick-action" onClick={() => onNavigate('faqs')}>
          <Database size={14} /> Manage FAQs
        </button>
        <button type="button" className="admin-quick-action" onClick={() => onNavigate('announcements')}>
          <Clock size={14} /> Post Announcement
        </button>
      </div>

      {/* Charts Row */}
      {!isLoading && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px', marginBottom: '24px' }}>

          {/* 7-Day FAQ Volume — Line Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>FAQ Activity (7 days)</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={analytics.volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown — Pie Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <PieIcon size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>FAQs by Category</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={analytics.categoryData} dataKey="count" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                    {analytics.categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analytics.categoryData.slice(0, 5).map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top FAQs by Views — Bar Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Eye size={15} style={{ color: '#0a84ff' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Top 10 FAQs by Views</span>
            </div>
            <div style={{ maxWidth: '850px', width: '100%', margin: '0 auto' }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  layout="vertical"
                  data={analytics.topFaqs.map((f) => ({ 
                    name: f.question.length > 50 ? f.question.slice(0, 47) + '...' : f.question, 
                    views: f.view_count 
                  }))}
                  margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-primary)' }} width={350} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="views" fill="#0a84ff" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Top FAQs Leaderboard */}
      <TopFAQsList />
    </div>
  );
};

export default AnalyticsDashboard;
