import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';

export default function PublicLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
