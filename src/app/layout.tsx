import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import SearchAssistantBubble from '@/components/SearchAssistantBubble';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'TicoHabitat | Propiedades en Costa Rica (Alquiler y Venta)',
  description: 'La plataforma inmobiliaria más rápida y confiable de Costa Rica. Encuentra y publica casas, apartamentos y lotes sin spam ni duplicados.',
  metadataBase: new URL('https://ticohabitat.com'),
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo-icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/logo-icon-192.png',
  },
  openGraph: {
    title: 'TicoHabitat | Bienes Raíces en Costa Rica',
    description: 'Encuentra alquileres y ventas de propiedades en San José, Alajuela, Heredia y más. Verificación obligatoria por OTP para anunciantes.',
    url: 'https://ticohabitat.com',
    siteName: 'TicoHabitat',
    locale: 'es_CR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" data-theme="dark">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 transition-colors duration-300">
        <AppProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
          <ToastContainer />
          <SearchAssistantBubble />
          <Analytics />
        </AppProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { console.log('TicoHabitat PWA ServiceWorker registered with scope:', reg.scope); },
                    function(err) { console.error('TicoHabitat PWA ServiceWorker registration failed:', err); }
                  );
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
