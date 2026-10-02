import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider } from 'convex/react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from 'react-helmet-async';
import convex from './lib/convex.ts'
import { AdminAuthProvider } from './hooks/useAdminAuth.tsx'
import { ThemeProvider } from './hooks/useTheme.tsx'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <ThemeProvider>
                <AdminAuthProvider>
                  <ErrorBoundary><App /></ErrorBoundary>
                </AdminAuthProvider>
              </ThemeProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ConvexProvider>
    </HelmetProvider>
  </StrictMode>,
)

// Clear only this application's obsolete dynamic/API caches.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async registrations => {
    for (const registration of registrations) {
      const script = registration.active?.scriptURL || registration.waiting?.scriptURL;
      if (script && new URL(script).pathname === '/sw.js') await registration.unregister();
    }
    for (const name of await caches.keys()) if (name.startsWith('mypetsragdoll-')) await caches.delete(name);
  }).catch(() => {});
}
