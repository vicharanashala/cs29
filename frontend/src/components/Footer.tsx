import React from 'react';
import { Link } from '@tanstack/react-router';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const borderColor = theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'var(--border)';

  return (
    <footer className="site-footer" style={{ borderTop: `1px solid ${borderColor}`, background: 'var(--bg-secondary)', padding: '56px 24px 32px' }}>
      <div className="footer-inner" style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'stretch' }}>
        
        {/* Top Part: Columns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '40px', textAlign: 'left', width: '100%' }}>
          
          {/* Brand Info */}
          <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
            >
              <img src={logoImg} alt="Vicharanashala Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.04em', lineHeight: 1.1 }}>VICHARANASHALA</span>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Lab for Education Design</span>
              </div>
            </Link>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, maxWidth: '340px' }}>
              Empowering learners through education design research and advanced AI-assisted mentorship portals.
            </p>
          </div>

          {/* Platform & Resources Links */}
          <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
            
            {/* Column 1: Navigation */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.06em', marginBottom: '16px' }}>Portal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Overview</Link>
                <Link to="/faq" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>FAQ Dashboard</Link>
                <Link to="/chat" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Yaksha-mini Chat</Link>
              </div>
            </div>

            {/* Column 2: External Platforms */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.06em', marginBottom: '16px' }}>Platforms</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                <a href="https://vibe.vicharanashala.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.8'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>ViBe Platform</a>
                <a href="https://samagama.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>samagama.in</a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Part: Copyright and Notes */}
        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', width: '100%' }}>
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} 
            onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'} 
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Vicharanashala Lab for Education Design · IIT Ropar
          </Link>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, paddingRight: '56px' }}>
            For queries not covered in the FAQ, ask <Link to="/chat" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Yaksha-mini</Link>.
          </p>
        </div>

      </div>
    </footer>
  );
};

