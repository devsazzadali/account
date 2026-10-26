import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/src/components/ClientProviders';
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  OG_IMAGE,
} from '@/src/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Account Store One | Premium Marketplace',
    template: '%s | Account Store One',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'buy premium accounts',
    'Netflix account',
    'Spotify Premium account',
    'IPTV subscription',
    'gaming accounts',
    'Valorant account',
    'GTA V modded account',
    'digital accounts marketplace',
    'instant delivery accounts',
    'Account Store One',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Account Store One | Premium Marketplace',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Account Store One — Premium Marketplace for verified digital accounts and subscriptions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Account Store One | Premium Marketplace',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'shopping',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
