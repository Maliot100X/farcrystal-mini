import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@rainbow-me/rainbowkit/styles.css';
import '@coinbase/onchainkit/styles.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Farcrystal - AI Token Launchpad',
  description: 'Launch tokens with AI agents on Base. The first Farcaster Mini App for agentic token launches.',
  metadataBase: new URL('https://farcrystal-mini.vercel.app'),
  openGraph: {
    title: 'Farcrystal - AI Token Launchpad',
    description: 'Launch tokens with AI agents on Base',
    url: 'https://farcrystal-mini.vercel.app',
    siteName: 'Farcrystal',
    images: ['/og-image.png'],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farcrystal - AI Token Launchpad',
    description: 'Launch tokens with AI agents on Base',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/.well-known/farcaster.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
