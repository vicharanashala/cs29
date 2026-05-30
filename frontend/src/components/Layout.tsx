import React, { useState, useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { ArrowUp } from 'lucide-react';

export const Layout: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -400, y: -400 });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <div className="cursor-glow" style={{ transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)` }} />
      <Header />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
        <Outlet />
      </main>
      <Footer />
      
      <button 
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        title="Back to Top"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
};
