import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
});

// Substitute for the Figma "Digital Numbers" font. DSEG7-Classic is an
// open-source 7-segment LCD typeface (SIL Open Font License) that mimics
// the alarm-clock digit look in the Figma keyvisual countdown. Used only
// on the per-digit tiles via the `--font-digital` token.
const dseg7 = localFont({
  src: '../public/fonts/dseg7-classic-regular.ttf',
  display: 'swap',
  variable: '--font-digital',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Sun* Annual Awards 2025',
  description: 'Sun* Annual Awards 2025 — the SAA platform.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${montserrat.variable} ${dseg7.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
