import type {Metadata} from 'next';
import { Roboto, Roboto_Slab, Roboto_Serif } from 'next/font/google';
import './globals.css'; // Global styles

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

const robotoSlab = Roboto_Slab({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto-slab',
});

const robotoSerif = Roboto_Serif({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto-serif',
});

export const metadata: Metadata = {
  title: 'Jareth',
  description: 'AI Meeting Recorder and Summarizer',
  manifest: '/manifest.json',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoSlab.variable} ${robotoSerif.variable}`}>
      <body suppressHydrationWarning className="font-sans">{children}</body>
    </html>
  );
}
