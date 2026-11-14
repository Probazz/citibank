import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Citi — Banking Built For You',
  description: 'Bank anytime, anywhere with Citi online banking.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.ico' },
  verification: {
    google: "VDxjKbXtrHFJQ-8GU-LjfCy-kgwdtzpS6aq9NA7jiTk",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-citi-gray-50 text-citi-gray-800`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}