import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Mukuru KYB Platform',
  description: 'Comprehensive KYB and compliance platform for business onboarding',
  keywords: ['KYB', 'compliance', 'onboarding', 'business', 'verification', 'Mukuru'],
  authors: [{ name: 'Mukuru Team' }],
  creator: 'Mukuru',
  publisher: 'Mukuru',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mukuru-kyb.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Mukuru KYB Platform',
    description: 'Comprehensive KYB and compliance platform for business onboarding',
    url: 'https://mukuru-kyb.com',
    siteName: 'Mukuru KYB',
    images: [
      {
        url: '/mukuru-logo.png',
        width: 1200,
        height: 630,
        alt: 'Mukuru KYB Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mukuru KYB Platform',
    description: 'Comprehensive KYB and compliance platform for business onboarding',
    images: ['/mukuru-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mukuru KYB',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Mukuru KYB',
    'application-name': 'Mukuru KYB',
    'msapplication-TileColor': '#dd6b20',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#dd6b20',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="light"
      style={{ colorScheme: 'light' }}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#dd6b20" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mukuru KYB" />
        <meta name="application-name" content="Mukuru KYB" />
        <meta name="msapplication-TileColor" content="#dd6b20" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = 'light';
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
                
                // Detect failed chunk loads and force hard refresh IMMEDIATELY
                (function() {
                  var hasReloaded = false;
                  var buildId = 'bUkPYARJEZWQ_xH5KGK6R';
                  var currentBuildId = 'bUkPYARJEZWQ_xH5KGK6R';
                  
                  // Check if we're on a stale version immediately
                  var urlParams = new URLSearchParams(window.location.search);
                  var urlVersion = urlParams.get('v');
                  if (urlVersion && urlVersion !== currentBuildId) {
                    console.warn('[CacheBuster] Version mismatch detected. Forcing refresh...');
                    window.location.href = window.location.href.split('?')[0] + '?v=' + currentBuildId + '&_refresh=' + Date.now();
                    return;
                  }
                  
                  // Store build ID in sessionStorage to detect stale pages
                  try {
                    var storedBuildId = sessionStorage.getItem('__next_build_id');
                    if (storedBuildId && storedBuildId !== currentBuildId) {
                      console.warn('[CacheBuster] Stale build detected. Forcing refresh...');
                      sessionStorage.setItem('__next_build_id', currentBuildId);
                      window.location.href = window.location.href.split('?')[0] + '?v=' + currentBuildId + '&_refresh=' + Date.now();
                      return;
                    }
                    sessionStorage.setItem('__next_build_id', currentBuildId);
                  } catch(e) {}
                  
                  function forceHardRefresh() {
                    if (hasReloaded) return;
                    hasReloaded = true;
                    console.warn('[CacheBuster] Chunk load failure detected. Clearing cache and forcing hard refresh...');
                    
                    // Clear all caches
                    if ('caches' in window) {
                      caches.keys().then(function(names) {
                        names.forEach(function(name) {
                          caches.delete(name);
                        });
                      });
                    }
                    
                    // Clear localStorage and sessionStorage
                    try {
                      localStorage.clear();
                      sessionStorage.clear();
                    } catch(e) {}
                    
                    // Force hard refresh with cache bypass
                    setTimeout(function() {
                      window.location.href = window.location.href.split('?')[0] + '?v=' + buildId + '&_refresh=' + Date.now();
                    }, 100);
                  }
                  
                  // Intercept fetch for chunk files
                  var originalFetch = window.fetch;
                  window.fetch = function() {
                    var url = arguments[0];
                    if (typeof url === 'string' && url.includes('/_next/static/chunks/')) {
                      return originalFetch.apply(this, arguments).catch(function(error) {
                        console.error('[CacheBuster] Failed to load chunk:', url, error);
                        forceHardRefresh();
                        throw error;
                      });
                    }
                    return originalFetch.apply(this, arguments);
                  };
                  
                  // Listen for script/style errors (immediate detection)
                  window.addEventListener('error', function(event) {
                    var src = event.target && (event.target.src || event.target.href);
                    if (src && src.includes('/_next/static/chunks/')) {
                      console.error('[CacheBuster] Resource load error:', src);
                      forceHardRefresh();
                    }
                  }, true);
                  
                  // Also check for 500 errors in network requests
                  var originalOpen = XMLHttpRequest.prototype.open;
                  XMLHttpRequest.prototype.open = function() {
                    var xhr = this;
                    xhr.addEventListener('load', function() {
                      if (xhr.status === 500) {
                        var url = arguments[1] || '';
                        if (url.includes('/_next/static/chunks/')) {
                          console.error('[CacheBuster] 500 error for chunk:', url);
                          forceHardRefresh();
                        }
                      }
                    });
                    return originalOpen.apply(this, arguments);
                  };
                })();
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
