import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User as UserIcon, ChevronDown, Sun, Moon, Bell } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import type { NotificationItem } from './NotificationPanel';
import { useLanguage } from '../context/LanguageContext';

export const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, t, toggleLanguage } = useLanguage();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch notifications (used on mount + 30s polling)
  const fetchNotifications = useCallback(() => {
    if (!user?.email) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        // Normalize: backend may return an array directly or { notifications: [] }
        const arr: NotificationItem[] = Array.isArray(data)
          ? (data as NotificationItem[])
          : ((data as any)?.notifications ?? (data as any)?.data ?? []);
        setNotifications(arr);
      })
      .catch(() => setNotifications([]));
  }, [user?.email]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, { method: 'PATCH' })
      .then(() => setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n)))
      .catch(() => {});
  };

  const handleMarkAllRead = () => {
    if (!user?.email) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all/${encodeURIComponent(user.email)}`, { method: 'PATCH' })
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))))
      .catch(() => {});
  };

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`} id="site-header">
      <div className="header-inner">
        <Link to="/" className="logo" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="logo-mark">V</span>
          <span className="logo-text">Vicharanashala</span>
        </Link>
        <nav className="site-nav">
          <Link to="/" className={currentPath === '/' ? 'active' : ''}>{t.nav.overview}</Link>
          <Link to="/faq" className={currentPath === '/faq' ? 'active' : ''}>{t.nav.faq}</Link>
          <Link to="/chat" className={currentPath === '/chat' ? 'active' : ''}>{t.nav.chat}</Link>
          <Link to="/announcements" className={currentPath === '/announcements' ? 'active' : ''}>{t.nav.announcements}</Link>
          <a href="https://samagama.in/" target="_blank" rel="noopener noreferrer">Samagama</a>

          <div className="nav-divider" style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }}></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.25s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title={`Switch to ${language === 'en' ? 'Hindi' : 'English'}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '34px', padding: '0 10px', borderRadius: '17px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em',
              transition: 'all 0.25s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--accent-glow)';
              e.currentTarget.style.color = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--border-active)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {language === 'en' ? 'हि' : 'EN'}
          </button>

          {/* Notification Bell (authenticated only) */}
          {isAuthenticated && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsNotifOpen((v) => !v)}
                title="Notifications"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: isNotifOpen ? 'var(--accent-glow)' : 'var(--bg-card)',
                  border: `1px solid ${isNotifOpen ? 'var(--border-active)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  color: isNotifOpen ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'all 0.25s ease', position: 'relative',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = isNotifOpen ? 'var(--accent-glow)' : 'var(--bg-card)';
                  e.currentTarget.style.color = isNotifOpen ? 'var(--accent)' : 'var(--text-secondary)';
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '3px', right: '3px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--accent)', border: '1.5px solid var(--bg-card)',
                  }} />
                )}
              </button>
              {isNotifOpen && (
                <NotificationPanel
                  notifications={notifications}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                  onClose={() => setIsNotifOpen(false)}
                />
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div
              className="user-menu"
              style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div
                className="user-info"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <UserIcon size={14} />
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {user?.name}
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                </span>
              </div>

              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '12px', zIndex: 100 }}>
                  <div style={{
                    width: '200px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</div>
                    {isAdmin && <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', padding: '2px 6px', background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: '10px' }}>Admin</span>}
                  </div>
                  {!isAdmin ? (
                    <>
                      <Link to="/profile" className="dropdown-item">Profile</Link>
                      <Link to="/raise-issue" className="dropdown-item">Raise a new issue</Link>
                      <Link to="/track-issues" className="dropdown-item">Track my issues</Link>
                      <Link to="/resolve-question" className="dropdown-item">Resolve a question</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/admin" className="dropdown-item" style={{ color: 'var(--accent)', fontWeight: 600 }}>Admin Dashboard</Link>
                    </>
                  )}
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                  <button
                    onClick={logout}
                    className="dropdown-item dropdown-item--danger"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={currentPath === '/login' ? 'active' : ''}>{t.nav.login}</Link>
          )}
        </nav>
      </div>
    </header>
  );
};
