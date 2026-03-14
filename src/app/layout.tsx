import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppQueryProvider } from '@/shared/providers/query-provider';
import { Toaster, ToastProvider } from '@/shared/ui/use-toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tournament JJ',
  description: 'Gestao administrativa de torneios de jiu-jitsu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppQueryProvider>
          <ToastProvider>
            {children}
            <Toaster position="top-right" />
          </ToastProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
