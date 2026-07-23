export type ServiceItem = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  mediaPath?: string;
  mediaType?: 'image' | 'video' | 'text';
  priceLabel: string;
  quoteOnly?: boolean;
  cta: string;
  features: string[];
  faqs: { question: string; answer: string }[];
  gallery: string[];
};

export const heroHighlights = [
  'Photography, videography, drone and studio sessions',
  'IT training and classroom programs from beginner to professional level',
  'Recruitment and official documentation photo support',
  'Unified appointment booking with admin-managed schedules'
];

export const stats = [
  { value: '10+', label: 'Modular service categories' },
  { value: '24/7', label: 'WhatsApp inquiry channel' },
  { value: '4', label: 'Admin role tiers' },
  { value: '100%', label: 'Mobile-friendly experience' }
];

export const services: ServiceItem[] = [
  {
    slug: 'event-photography',
    title: 'Event Photography',
    category: 'Photography',
    summary:
      'Premium event photography coverage for weddings, birthdays, funerals, corporate events and special occasions.',
    description:
      'Capture every important moment with professional photographers, high-resolution delivery, quick turnaround options and album-ready edits.',
    priceLabel: 'Packages from GHS 850',
    cta: 'Book photography coverage',
    features: [
      'Event coverage packages',
      'On-site creative direction',
      'Edited digital delivery',
      'Album and print add-ons'
    ],
    faqs: [
      {
        question: 'How early should I book?',
        answer:
          'Book at least 1 to 3 weeks ahead for standard events and earlier for weddings or peak seasons.'
      },
      {
        question: 'Can I request same-day highlights?',
        answer:
          'Yes. Highlight delivery can be added to your package as an express option.'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    slug: 'event-videography',
    title: 'Event Videography',
    category: 'Videography',
    summary:
      'Cinematic event video production with highlight reels, interviews and social media edits.',
    description:
      'VIDEOLAND MULTIMEDIA produces polished event films with multi-angle coverage, clean audio capture and branded edits tailored for families, businesses and community events.',
    priceLabel: 'Packages from GHS 1,400',
    cta: 'Book videography',
    features: [
      'Highlight video edits',
      'Full event coverage',
      'Audio and interview capture',
      'Social-ready reels'
    ],
    faqs: [
      {
        question: 'Do you deliver raw footage?',
        answer: 'Raw footage can be delivered on request as an add-on.'
      },
      {
        question: 'Can you cover church and conference events?',
        answer:
          'Yes. We cover church programs, conferences, funerals, weddings and corporate sessions.'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    slug: 'drone-aerial-coverage',
    title: 'Drone Aerial Coverage',
    category: 'Drone Services',
    summary:
      'Aerial photography and video coverage for ceremonies, real estate, construction and promotional content.',
    description:
      'Get dramatic overhead visuals with safe, well-planned drone flights that elevate your project storytelling and event documentation.',
    priceLabel: 'Request quote',
    quoteOnly: true,
    cta: 'Request aerial coverage',
    features: [
      'Operational flight workflow',
      'Pre-shoot planning',
      'Short-form reels',
      'Event and site coverage'
    ],
    faqs: [
      {
        question: 'Can you fly in all locations?',
        answer:
          'Flights depend on weather, site safety and local airspace restrictions.'
      },
      {
        question: 'Do you combine drone with ground coverage?',
        answer:
          'Yes. Drone packages can be paired with photography or videography teams.'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    slug: 'studio-session-booking',
    title: 'Studio Session Booking',
    category: 'Studio',
    summary:
      'Book the studio for portraits, product shoots, family sessions, branding sessions and content creation.',
    description:
      'Flexible studio packages with lighting setup, backdrop choices, guided posing support and add-on retouching services.',
    priceLabel: 'From GHS 250 per session',
    cta: 'Book studio session',
    features: [
      'Portrait and branding sets',
      'Hourly and session-based packages',
      'Backdrop options',
      'Retouching extras'
    ],
    faqs: [
      {
        question: 'How long is a session?',
        answer:
          'Standard sessions run from 30 minutes to 2 hours depending on the selected package.'
      },
      {
        question: 'Can I bring my own stylist?',
        answer:
          'Yes. Clients can arrive with makeup artists, stylists or creative directors.'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    slug: 'official-photos',
    title: 'Visa, Passport & Official Photos',
    category: 'Official Photo Services',
    summary:
      'Accurate and compliant official photos for visas, passports, IDs, certificates and documentation processes.',
    description:
      'Get fast studio-based official photos with the correct dimensions, background guidance and print or digital delivery options.',
    priceLabel: 'From GHS 60',
    cta: 'Book official photo service',
    features: [
      'Visa and passport formats',
      'Fast print turnaround',
      'Digital copies available',
      'Guidance on specifications'
    ],
    faqs: [
      {
        question: 'Do you know visa photo sizes?',
        answer:
          'Yes. Admins can maintain a country-specific photo requirement list in the dashboard.'
      },
      {
        question: 'Can I get same-day prints?',
        answer: 'Yes. Same-day service is available for most standard requests.'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    slug: 'it-courses',
    title: 'IT Courses',
    category: 'Training',
    summary:
      'Practical IT training from computer basics to professional digital skills and office productivity.',
    description:
      'Flexible IT classes designed for students, job seekers, workers and entrepreneurs who want hands-on digital confidence and career-ready skills.',
    priceLabel: 'Programs from GHS 450',
    cta: 'Apply for IT training',
    features: [
      'Beginner to advanced tracks',
      'Weekday and weekend sessions',
      'Trainer profiles',
      'Enrollment consultations'
    ],
    faqs: [
      {
        question: 'Are classes beginner-friendly?',
        answer:
          'Yes. The catalog is designed with progressive tracks from beginner to professional.'
      },
      {
        question: 'Can I request private coaching?',
        answer:
          'Yes. Admins can enable private coaching packages and schedules.'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    slug: 'recruitment-registration-center',
    title: 'Recruitment Registration Center',
    category: 'Registration Support',
    summary:
      'Guided registration support for BECE, WASCE, Police, Army, Fire Service and Immigration recruitment portals.',
    description:
      'VIDEOLAND MULTIMEDIA helps applicants prepare documents, complete forms, understand deadlines and avoid avoidable submission errors.',
    priceLabel: 'Service fees vary by program',
    cta: 'Book registration support',
    features: [
      'Application guidance',
      'Document scanning and uploads',
      'Deadline tracking',
      'Appointment-based support'
    ],
    faqs: [
      {
        question: 'Can I walk in for support?',
        answer:
          'Yes, but appointments help us prepare required forms and reduce waiting time.'
      },
      {
        question: 'Do you update registration status regularly?',
        answer:
          'Yes. Recruitment records are built for admin-controlled updates.'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

export const courses = [
  {
    title: 'Computer Basics & Internet Essentials',
    category: 'Beginner',
    duration: '4 weeks',
    fee: 'GHS 450',
    schedule: 'Weekday mornings and Saturday batches',
    trainer: 'Admin-managed trainer profile',
    description:
      'Learn typing, internet usage, file handling, email, printing and digital confidence for work and school.'
  },
  {
    title: 'Microsoft Office & Productivity Tools',
    category: 'Intermediate',
    duration: '6 weeks',
    fee: 'GHS 700',
    schedule: 'Weekday evenings and weekends',
    trainer: 'Assigned productivity coach',
    description:
      'Build practical skills in Word, Excel, PowerPoint, document preparation and office workflows.'
  },
  {
    title: 'Professional Digital Skills Track',
    category: 'Professional',
    duration: '8 to 12 weeks',
    fee: 'From GHS 1,200',
    schedule: 'Custom intake schedule',
    trainer: 'Lead instructor and guest mentors',
    description:
      'A modular path for job-ready digital skills, online work habits and practical software use.'
  }
];

export const recruitmentPrograms = [
  {
    title: 'BECE Registration Support',
    status: 'Open',
    deadline: 'Admin configurable',
    fee: 'From GHS 50',
    requirements: ['Candidate details', 'Passport photo', 'Supporting records'],
    instructions:
      'Bring all required information for form completion and verification.'
  },
  {
    title: 'WASCE Registration Support',
    status: 'Open',
    deadline: 'Admin configurable',
    fee: 'From GHS 50',
    requirements: ['Candidate details', 'Official photo', 'Supporting records'],
    instructions:
      'Admins can update fees, requirements and active registration windows.'
  },
  {
    title: 'Police / Army / Fire / Immigration',
    status: 'Monitored',
    deadline: 'Varies by institution',
    fee: 'Request latest fees',
    requirements: ['Application details', 'Scanned documents', 'Official photo'],
    instructions:
      'Use the support center to prepare and submit recruitment applications correctly.'
  }
];

export const testimonials = [
  {
    name: 'Esi Mensah',
    role: 'Bride',
    quote:
      'The photography team was professional, calm and very creative. The gallery delivery was excellent.'
  },
  {
    name: 'Kweku Nyarko',
    role: 'Training Student',
    quote:
      'The IT training was practical and easy to follow. I now use the skills for work every day.'
  },
  {
    name: 'Akosua Arthur',
    role: 'Recruitment Applicant',
    quote:
      'They helped me complete my recruitment registration without stress and explained every step clearly.'
  }
];

export const faqs = [
  {
    question: 'Can administrators update content without developers?',
    answer:
      'Yes. The architecture is content-driven, with Supabase tables powering services, pricing, posts, FAQs, media, and settings.'
  },
  {
    question: 'Can visitors book any service from one booking flow?',
    answer:
      'Yes. The booking system supports a unified service selector with date, time, notes, and status tracking.'
  },
  {
    question: 'How is the wall protected from abuse?',
    answer:
      'Only logged-in users can like or comment, while moderators and admins can hide or delete content using dashboard tools.'
  }
];

export const teamMembers = [
  {
    name: 'Creative Director',
    role: 'Photography & Brand Lead',
    bio:
      'Oversees storytelling quality, gallery curation and event production standards.'
  },
  {
    name: 'Training Coordinator',
    role: 'IT Programs & Enrollment',
    bio:
      'Manages class schedules, student inquiries, trainer assignments and onboarding.'
  },
  {
    name: 'Operations Manager',
    role: 'Bookings & Service Delivery',
    bio:
      'Coordinates appointments, studio availability, official photo workflows and recruitment support.'
  }
];

export const galleryHighlights = [
  {
    title: 'Wedding & Event Moments',
    category: 'Photography',
    image:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Studio Portrait Sessions',
    category: 'Studio',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Aerial Video Coverage',
    category: 'Drone',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  }
];

export const communityPosts = [
  {
    title: 'Weekend studio portrait slots now open',
    category: 'Studio Booking',
    excerpt:
      'New portrait slots are now available for graduates, birthdays, branding sessions and family photos.',
    author: 'VIDEOLAND MULTIMEDIA Admin',
    likes: 48,
    comments: 12,
    mediaType: 'image'
  },
  {
    title: 'July IT training intake announced',
    category: 'Training',
    excerpt:
      'Applications are open for our computer basics, office productivity and advanced digital skills tracks.',
    author: 'Training Desk',
    likes: 34,
    comments: 9,
    mediaType: 'text'
  },
  {
    title: 'Recruitment support updates this week',
    category: 'Recruitment',
    excerpt:
      'Check the latest registration guidance, requirements and appointment windows for ongoing programs.',
    author: 'Support Team',
    likes: 21,
    comments: 6,
    mediaType: 'video'
  }
];

export const homepageSections = [
  'hero_banner',
  'service_overview',
  'why_choose_us',
  'featured_gallery',
  'training_spotlight',
  'recruitment_spotlight',
  'studio_cta',
  'testimonials',
  'latest_posts',
  'contact_cta'
];
