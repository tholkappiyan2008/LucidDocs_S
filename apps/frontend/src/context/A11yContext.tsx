import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'ta' | 'te' | 'hi';

interface A11yContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  largeText: boolean;
  toggleLargeText: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export const A11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('cleardoc_high_contrast') === 'true';
  });

  const [largeText, setLargeText] = useState<boolean>(() => {
    return localStorage.getItem('cleardoc_large_text') === 'true';
  });

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('cleardoc_language') as SupportedLanguage;
    return saved === 'ta' || saved === 'te' || saved === 'hi' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('cleardoc_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('cleardoc_large_text', String(largeText));
    if (largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
  }, [largeText]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleLargeText = () => setLargeText((prev) => !prev);
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('cleardoc_language', lang);
  };

  return (
    <A11yContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        largeText,
        toggleLargeText,
        language,
        setLanguage,
      }}
    >
      {children}
    </A11yContext.Provider>
  );
};

export function useA11y(): A11yContextType {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
}

