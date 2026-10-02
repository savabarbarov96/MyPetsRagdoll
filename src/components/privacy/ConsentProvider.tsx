import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const STORAGE_KEY = 'bleuroi-consent';
const VERSION = '2026-10-02';
const MAX_AGE = 183 * 24 * 60 * 60 * 1000;
export type ConsentChoices = { analytics: boolean; marketing: boolean; externalContent: boolean };
type SavedConsent = ConsentChoices & { version: string; savedAt: number };
const denied: ConsentChoices = { analytics: false, marketing: false, externalContent: false };

function readConsent(): SavedConsent | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    if (record.version !== VERSION || typeof record.savedAt !== 'number' || record.savedAt > Date.now() || Date.now() - record.savedAt > MAX_AGE) return null;
    if (typeof record.analytics !== 'boolean' || typeof record.marketing !== 'boolean' || typeof record.externalContent !== 'boolean') return null;
    return { analytics: record.analytics, marketing: record.marketing, externalContent: record.externalContent, version: VERSION, savedAt: record.savedAt };
  } catch { return null; }
}

function clearOptionalStorage(choices: ConsentChoices = denied) {
  if (!choices.analytics) {
    try { localStorage.removeItem('visitor_session_id'); } catch { /* Storage can be unavailable. */ }
  }
  const domains = [undefined, window.location.hostname];
  const hostParts = window.location.hostname.split('.');
  if (hostParts.length > 2) domains.push(`.${hostParts.slice(-2).join('.')}`);
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    const analyticsCookie = /^(_ga(?:_|$)|_gid$|_gat)/.test(name);
    const marketingCookie = /^(_fbp$|_fbc$)/.test(name);
    if (!((analyticsCookie && !choices.analytics) || (marketingCookie && !choices.marketing))) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

type ConsentContextValue = ConsentChoices & {
  consent: SavedConsent | null;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  setConsent: (choices: ConsentChoices) => void;
};
const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setSavedConsent] = useState<SavedConsent | null>(readConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const setConsent = useCallback((choices: ConsentChoices) => {
    const saved = { ...choices, version: VERSION, savedAt: Date.now() };
    const revoked = !!consent && ((consent.analytics && !choices.analytics) || (consent.marketing && !choices.marketing) || (consent.externalContent && !choices.externalContent));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
    catch {
      // If storage is full, remove the previous grant so a reload fails closed.
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable entirely. */ }
    }
    setSavedConsent(saved);
    setSettingsOpen(false);
    if (!choices.analytics || !choices.marketing) clearOptionalStorage(choices);
    // Reload after withdrawal to terminate already loaded third-party scripts.
    if (revoked) window.location.reload();
  }, [consent]);

  useEffect(() => {
    window.addEventListener('open-cookie-settings', openSettings);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = readConsent();
      setSavedConsent(next);
      if (!next || !next.analytics || !next.marketing) clearOptionalStorage(next || denied);
      // Apply another tab's withdrawal to scripts already running in this tab.
      if (consent && ((consent.analytics && !next?.analytics) || (consent.marketing && !next?.marketing) || (consent.externalContent && !next?.externalContent))) window.location.reload();
    };
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('open-cookie-settings', openSettings); window.removeEventListener('storage', sync); };
  }, [openSettings, consent]);

  useEffect(() => { if (!consent?.analytics || !consent?.marketing) clearOptionalStorage(consent || denied); }, [consent]);

  return <ConsentContext.Provider value={{ ...(consent || denied), consent, settingsOpen, openSettings, closeSettings, setConsent }}>{children}</ConsentContext.Provider>;
}

// This hook is shared by optional analytics, maps and social integrations.
// eslint-disable-next-line react-refresh/only-export-components -- Keep the provider and its shared hook in the same public interface.
export function useConsent() {
  const value = useContext(ConsentContext);
  if (!value) throw new Error('useConsent must be used within ConsentProvider');
  return value;
}

export function CookieConsent() {
  const { language } = useLanguage();
  const { consent, settingsOpen, openSettings, closeSettings, setConsent } = useConsent();
  const [choices, setChoices] = useState<ConsentChoices>(consent || denied);
  const en = language === 'en';
  const buttonClass = 'rounded-full border border-[#5A4336]/30 px-5 py-3 text-sm font-semibold text-[#5A4336] transition hover:bg-[#EADFD0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A4336]';
  useEffect(() => { if (settingsOpen) setChoices(consent || denied); }, [settingsOpen, consent]);
  const categories: { key: keyof ConsentChoices; title: string; description: string }[] = [
    { key: 'analytics', title: en ? 'Analytics' : 'Статистика', description: en ? 'Optional site visitor statistics and Google Analytics, when configured.' : 'Незадължителна статистика за посещенията и Google Analytics, когато е настроен.' },
    { key: 'marketing', title: en ? 'Marketing' : 'Маркетинг', description: en ? 'Meta Pixel, when configured. This does not subscribe you to messages.' : 'Meta Pixel, когато е настроен. Това не Ви абонира за съобщения.' },
    { key: 'externalContent', title: en ? 'External content' : 'Външно съдържание', description: en ? 'Google Maps and external social embeds may send information to their providers.' : 'Google Maps и външните вграждания могат да предават информация на доставчиците си.' },
  ];
  return <>
    {!consent && !settingsOpen && <section aria-label={en ? 'Cookie choices' : 'Избор за бисквитките'} className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-5xl rounded-2xl border border-[#5A4336]/20 bg-[#FAF6F0] p-5 text-[#5A4336] shadow-2xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{en ? 'Your privacy, your choice' : 'Вашата поверителност, Вашият избор'}</h2><p className="mt-1 text-sm leading-relaxed">{en ? 'Necessary storage keeps the site working. Optional statistics, marketing and external content stay off until you choose them.' : 'Необходимото съхранение поддържа сайта. Статистиката, маркетингът и външното съдържание остават изключени до Вашия избор.'} <Link className="underline underline-offset-4" to={`/privacy${en ? '?lang=en' : ''}`}>{en ? 'Privacy policy' : 'Поверителност'}</Link></p></div>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} onClick={() => setConsent({ analytics: true, marketing: true, externalContent: true })}>{en ? 'Accept optional' : 'Приемам незадължителните'}</button>
          <button className={buttonClass} onClick={() => setConsent(denied)}>{en ? 'Reject optional' : 'Отказвам незадължителните'}</button>
          <button className={buttonClass} onClick={openSettings}>{en ? 'Settings' : 'Настройки'}</button>
        </div>
      </div>
    </section>}
    <Dialog open={settingsOpen} onOpenChange={(open) => open ? openSettings() : closeSettings()}>
      <DialogContent className="z-[110] max-h-[90dvh] max-w-lg overflow-y-auto border-[#5A4336]/20 bg-[#FAF6F0] text-[#5A4336]">
        <DialogTitle>{en ? 'Privacy settings' : 'Настройки за поверителност'}</DialogTitle>
        <DialogDescription className="text-[#5A4336]">{en ? 'Optional choices are independent. You can change or withdraw consent from the footer at any time.' : 'Незадължителните избори са независими. Можете да ги промените или оттеглите от долната част на сайта по всяко време.'}</DialogDescription>
        <div className="rounded-xl bg-[#EADFD0] p-4 text-sm"><strong>{en ? 'Necessary — always active' : 'Необходими — винаги активни'}</strong><p className="mt-1">{en ? 'Language, consent preference and authenticated admin session. No optional tracking is needed to submit an inquiry.' : 'Език, избор за съгласие и удостоверена администраторска сесия. За запитване не е необходимо незадължително проследяване.'}</p></div>
        {categories.map(({ key, title, description }) => <label key={key} className="flex cursor-pointer gap-3 rounded-xl border border-[#5A4336]/20 p-4"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#5A4336]" checked={choices[key]} onChange={(event) => setChoices((previous) => ({ ...previous, [key]: event.target.checked }))} /><span><strong>{title}</strong><span className="mt-1 block text-sm leading-relaxed">{description}</span></span></label>)}
        <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => setConsent(choices)}>{en ? 'Save choices' : 'Запазвам избора'}</button><button className={buttonClass} onClick={() => setConsent(denied)}>{en ? 'Reject / withdraw all' : 'Отказ / оттегляне на всички'}</button></div>
      </DialogContent>
    </Dialog>
  </>;
}
