import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Shield, Database, Bell, ShieldAlert, ArrowLeft } from 'lucide-react';
import { AnalyticsDashboard } from './dashboard/AnalyticsDashboard';
import { QueryModerator } from './moderation/QueryModerator';
import { FAQManagement } from './faq/FAQManagement';
import { AnnouncementForm } from './announcements/AnnouncementForm';
import '../../styles/admin.css';
import '../../styles/portal.css';

type AdminSection = 'dashboard' | 'moderation' | 'faqs' | 'announcements';

const NAV_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'moderation', label: 'Moderate Queries', icon: <Shield size={18} /> },
  { key: 'faqs', label: 'Manage FAQs', icon: <Database size={18} /> },
  { key: 'announcements', label: 'Announcements', icon: <Bell size={18} /> },
];

export const AdminLayout: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  // Auth gate — non-admin users see access denied
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-access-denied">
        <div className="admin-access-denied-icon">
          <ShieldAlert size={40} />
        </div>
        <h2>Access Denied</h2>
        <p>
          This area is restricted to administrators only. Please log in with an admin account to access the dashboard.
        </p>
        <Link to="/login" className="btn-accent" style={{ padding: '12px 24px', fontSize: '14px' }}>
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AnalyticsDashboard onNavigate={(section) => setActiveSection(section as AdminSection)} />;
      case 'moderation':
        return <QueryModerator />;
      case 'faqs':
        return <FAQManagement />;
      case 'announcements':
        return <AnnouncementForm />;
    }
  };

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>
            <span>V</span>
            Admin Panel
          </h2>
          <p>Vicharanashala Control Center</p>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-nav-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={14} /> Back to Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {renderSection()}
      </main>
    </div>
  );
};

export default AdminLayout;
