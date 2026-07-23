export const siteConfig = {
  name: 'VIDEOLAND MULTIMEDIA',
  legalName: 'VIDEOLAND MULTIMEDIA',
  domain: 'vland.info',
  email: 'vlandmultimedia@gmail.com',
  phone: '0243133780',
  whatsappNumber: '233243133780',
  whatsappLabel: '+233 24 313 3780',
  address: 'Saltpond, Central Region, Ghana',
  hours: [
    'Mon - Fri: 8:00 AM - 6:00 PM',
    'Sat: 8:30 AM - 4:00 PM',
    'Sun: By appointment'
  ],
  heroImage:
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80',
  mapEmbedUrl:
    'https://www.google.com/maps/search/?api=1&query=Saltpond%2C+Central+Region%2C+Ghana'
} as const;

export const navigation = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/training', label: 'IT Training' },
  { href: '/studio-booking', label: 'Studio Booking' },
  { href: '/official-photos', label: 'Official Photos' },
  { href: '/recruitment', label: 'Recruitment' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/community', label: 'Community Wall' },
  { href: '/bookings', label: 'Book Appointment' },
  { href: '/contact', label: 'Contact' }
] as const;

export const adminNavigation = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/moderation', label: 'Moderation Center' },
  { href: '/admin/content', label: 'Homepage Content' },
  { href: '/admin/adverts', label: 'Adverts' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/courses', label: 'IT Courses' },
  { href: '/admin/recruitment', label: 'Recruitment' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/posts', label: 'Community Posts' },
  { href: '/admin/faqs', label: 'FAQs' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/users', label: 'Users & Roles' }
] as const;
