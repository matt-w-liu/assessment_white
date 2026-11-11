import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Newsreader } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
// Serif for document text and page headings, so documents read like documents.
const serif = Newsreader({ subsets: ['latin'], variable: '--font-serif', display: 'swap', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: 'Ajaia Docs',
  description: 'A lightweight collaborative document editor',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen font-sans">
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
