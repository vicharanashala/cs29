import React from 'react';
import { Construction } from 'lucide-react';

export const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
      <Construction size={64} color="var(--accent)" style={{ opacity: 0.5, marginBottom: '24px' }} />
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>{title}</h1>
      <p>This page is currently under construction.</p>
    </div>
  );
};
