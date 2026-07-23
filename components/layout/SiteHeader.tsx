import Image from 'next/image';
import Link from 'next/link';

import { navigation, siteConfig } from '@/lib/config/site';

export function SiteHeader() {
  return (
    <header className="nav-shell">
      <div className="container nav-inner">
        <Link className="logo" href="/">
          <Image
            alt={`${siteConfig.name} logo`}
            className="logo-image"
            height={48}
            priority
            src="/logo.png"
            width={48}
          />
          <span className="brand-title">{siteConfig.name}</span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link className="nav-link" key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="inline-actions nav-actions">
          <Link className="button-ghost" href={`tel:${siteConfig.phone}`}>
            Call Now
          </Link>
          <Link className="button" href="/bookings">
            Book Appointment
          </Link>
        </div>
      </div>
    </header>
  );
}
