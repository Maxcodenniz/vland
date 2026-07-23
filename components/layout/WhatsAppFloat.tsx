import Link from 'next/link';

import { siteConfig } from '@/lib/config/site';

export function WhatsAppFloat() {
  return (
    <div className="floating-whatsapp">
      <Link
        className="button-secondary"
        href={`https://wa.me/${siteConfig.whatsappNumber}?text=Hello%20VIDEOLAND%20MULTIMEDIA%2C%20I%20need%20help%20with%20your%20services.`}
        rel="noreferrer"
        target="_blank"
      >
        WhatsApp Us
      </Link>
    </div>
  );
}
