import React from 'react';
import { Link } from '@tanstack/react-router';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-mark">V</span>
          <p>Vicharanashala Lab for Education Design · IIT Ropar</p>
        </div>
        <div className="footer-links">
          <a href="https://samagama.in" target="_blank" rel="noopener noreferrer">samagama.in</a>
          <Link to="/">Internship Overview</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <p className="footer-note">
          For queries not covered here, contact us via the{' '}
          <Link to="/chat">Yaksha chat</Link>.
        </p>
      </div>
    </footer>
  );
};
