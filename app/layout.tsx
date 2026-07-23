import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Montserrat, Poppins } from 'next/font/google';
import './globals.css';

import { siteConfig } from '@/lib/config/site';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['700', '800', '900']
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${siteConfig.domain}`),
  title: {
    default: `${siteConfig.name} | Photography, Training and Service Center`,
    template: `%s | ${siteConfig.name}`
  },
  description:
    'VIDEOLAND MULTIMEDIA in Saltpond offers photography, videography, drone coverage, studio booking, IT training, official photos and recruitment registration support.',
  openGraph: {
    title: siteConfig.legalName,
    description:
      'A modular web platform for bookings, galleries, community engagement and content management.',
    url: `https://${siteConfig.domain}`,
    siteName: siteConfig.legalName,
    type: 'website'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
