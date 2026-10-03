import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/src/components/ClientProviders';

export const metadata: Metadata = {
  title: 'Account Store One | Premium Marketplace',
  description: 'The world\'s leading marketplace for premium digital assets and high-tier accounts. Experience pure excellence with 24/7 support and instant delivery.',
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
