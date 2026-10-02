import { createContext, useContext, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import bgTranslations from '@/translations/bg.json';
import enTranslations from '@/translations/en.json';

export type Language = 'bg' | 'en';
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <T = string>(key: string, fallback?: string) => T;
}
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const translations = { bg: bgTranslations, en: enTranslations };
function lookup(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((value, part) => value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined, source);
}
export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const language: Language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'bg';
  const setLanguage = (lang: Language) => {
    const params = new URLSearchParams(location.search);
    if (lang === 'en') params.set('lang', 'en'); else params.delete('lang');
    navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash });
  };
  const t = <T = string,>(key: string, fallback?: string): T => (lookup(translations[language], key) ?? lookup(translations.bg, key) ?? fallback ?? key) as T;
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage requires LanguageProvider');
  return context;
}
