import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mukuru KYB Platform",
  description: "Comprehensive KYB and compliance platform for business onboarding",
  keywords: ["KYB", "compliance", "onboarding", "business", "verification", "Mukuru"],
  authors: [{ name: "Mukuru Team" }],
  creator: "Mukuru",
  publisher: "Mukuru",
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
    title: "Mukuru KYB Platform",
    description: "Comprehensive KYB and compliance platform for business onboarding",
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
    title: "Mukuru KYB Platform",
    description: "Comprehensive KYB and compliance platform for business onboarding",
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
    <html lang="en" suppressHydrationWarning>
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
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}