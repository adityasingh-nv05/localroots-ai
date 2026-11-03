import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LocalRoots AI — Discover Karnataka & India',
    template: '%s | LocalRoots AI',
  },
  description:
    'Discover local businesses, artisans, food vendors and cultural tourism destinations across Karnataka and India — powered by AI.',
  keywords: ['Karnataka', 'local business', 'artisans', 'India', 'cultural tourism', 'food'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'LocalRoots AI',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
