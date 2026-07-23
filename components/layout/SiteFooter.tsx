import {
  Clock3,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone
} from 'lucide-react';
import Link from 'next/link';

import { navigation, siteConfig } from '@/lib/config/site';

export function SiteFooter() {
  return (
    <footer className="section">
      <div className="container card content-panel footer-shell footer-grid">
        <div className="stack">
          <h3 style={{ margin: 0 }}>{siteConfig.legalName}</h3>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            Cinematic visuals, simple booking, and welcoming support for
            photography, studio sessions, training, official photos and more.
          </p>
          <div className="inline-actions">
            <Link className="button" href="/contact">
              Contact Us
            </Link>
            <Link className="button-ghost" href="/bookings">
              Start Booking
            </Link>
          </div>
          <div className="social-links">
            <Link
              aria-label="Chat on WhatsApp"
              className="social-link"
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle size={18} />
            </Link>
            <Link
              aria-label="Send an email"
              className="social-link"
              href={`mailto:${siteConfig.email}`}
            >
              <Mail size={18} />
            </Link>
            <Link
              aria-label="Call VIDEOLAND MULTIMEDIA"
              className="social-link"
              href={`tel:${siteConfig.phone}`}
            >
              <Phone size={18} />
            </Link>
            <Link
              aria-label="Visit website"
              className="social-link"
              href={`https://${siteConfig.domain}`}
              rel="noreferrer"
              target="_blank"
            >
              <Globe size={18} />
            </Link>
          </div>
        </div>
        <div className="stack">
          <strong>Explore</strong>
          {navigation.filter((item) => item.href !== '/').slice(0, 4).map((item) => (
            <Link className="footer-link" key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="stack">
          <strong>Services</strong>
          <Link className="footer-link" href="/services">Photography & Video</Link>
          <Link className="footer-link" href="/training">IT Training</Link>
          <Link className="footer-link" href="/official-photos">Official Photos</Link>
          <Link className="footer-link" href="/recruitment">Recruitment Support</Link>
        </div>
        <div className="stack">
          <strong>Contact</strong>
          <span className="footer-detail">
            <Phone size={16} />
            <Link className="footer-link" href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</Link>
          </span>
          <span className="footer-detail">
            <Mail size={16} />
            <Link className="footer-link" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</Link>
          </span>
          <span className="footer-detail">
            <MapPin size={16} />
            <span className="muted">{siteConfig.address}</span>
          </span>
          <span className="footer-detail">
            <Clock3 size={16} />
            <span className="muted">{siteConfig.hours.join(' | ')}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
