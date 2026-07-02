import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translations, Language } from './translations';
import { setCurrentLanguage } from './currentLanguage';

const LANGUAGE_KEY = 'baki_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getByPath(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY).then((saved) => {
      if (saved === 'bn' || saved === 'en') {
        setLanguageState(saved);
        setCurrentLanguage(saved);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setCurrentLanguage(lang);
    SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => interpolate(getByPath(translations[language], path), vars),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
