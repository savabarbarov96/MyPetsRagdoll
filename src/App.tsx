import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { ConsentProvider, CookieConsent, useConsent } from '@/components/privacy/ConsentProvider';
import { PublicLayout } from '@/components/site/PublicLayout';
import { HomePage, BritishPage, AllCatsPage, AboutPage, NewsPage, NewsArticlePage, CatPage, PublicNotFoundPage } from '@/pages/PublicPages';
import { TrustPage, ContactPage, WaitingListPage, TermsPage, PrivacyPage } from '@/pages/InformationPages';
import Analytics from '@/components/Analytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import VisitorTracker from '@/components/VisitorTracker';
import '@/styles/public.css';

const Admin = lazy(() => import('@/pages/Admin'));
function AppContent() {
  const { language } = useLanguage();
  const consent = useConsent();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  return <>
    <Helmet htmlAttributes={{ lang: language, class: isAdmin ? 'light' : 'light public-theme' }} />
    <Toaster /><Sonner />
    {!isAdmin && (consent.analytics || consent.marketing) && <ErrorBoundary fallback={<></>}>
      <Analytics />
      {consent.analytics && <VisitorTracker />}
    </ErrorBoundary>}
    <Suspense fallback={<div className="p-8" role="status">{language === 'bg' ? 'Зареждане…' : 'Loading…'}</div>}>
      <Routes>
        <Route path="/admin" element={<><Helmet><meta name="robots" content="noindex,nofollow" /></Helmet><Admin /></>} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/british" element={<BritishPage />} />
          <Route path="/all-cats" element={<AllCatsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsArticlePage />} />
          <Route path="/cat/:catId" element={<CatPage />} />
          <Route path="/trust" element={<TrustPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/waiting-list" element={<WaitingListPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<PublicNotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
    {!isAdmin && <CookieConsent />}
  </>;
}
export default function App() {
  return <LanguageProvider><ConsentProvider><AppContent /></ConsentProvider></LanguageProvider>;
}
