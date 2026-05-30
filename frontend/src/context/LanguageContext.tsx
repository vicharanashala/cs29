import React, { createContext, useContext, useState } from 'react';
import { en } from '../translations/en';
import { hi } from '../translations/hi';
import type { Translations } from '../translations/en';

type Language = 'en' | 'hi';

interface LanguageContextValue {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: en,
  toggleLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('vins_lang') as Language) || 'en';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next: Language = prev === 'en' ? 'hi' : 'en';
      localStorage.setItem('vins_lang', next);
      return next;
    });
  };

  const t = language === 'hi' ? hi : en;

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
