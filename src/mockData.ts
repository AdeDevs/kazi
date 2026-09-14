import { Professional, Category, Booking, ChatMessage, ServiceItem } from './types';

export const CATEGORIES: Category[] = [
  'Electricians',
  'Plumbers',
  'Carpenters',
  'AC Technicians',
  'Appliance Repair Specialists',
  'Mechanics',
  'Solar Installers',
  'CCTV Installers',
  'Painters',
  'Welders',
  'Cleaners',
  'Tutors',
  'Tailors',
  'Hair Stylists',
  'Photographers',
  'Event Professionals'
];

/**
 * Realistic service items categorized across trade services
 * featuring all three pricing models:
 * 1. fixed: Customer sees exact price (e.g. ₦15,000 "Fixed price")
 * 2. quote_required: Customer describes job and gets custom quote (e.g. "Request a quote")
 * 3. starting: Customer sees starting baseline (e.g. "From ₦10,000")
 */
export const CATEGORY_SERVICES_CATALOG: Record<Category, ServiceItem[]> = {
  'Electricians': [
    {
      id: 'srv-elec-1',
      name: 'Socket & Switch Repair / Fitting',
      category: 'Electricians',
      description: 'Single socket or switch change, burnt receptacle replacement, and earth check.',
      pricingType: 'fixed',
      price: 5000,
      durationEstimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-elec-2',
      name: 'Circuit Breaker / DB Box Tripping Diagnosis',
      category: 'Electricians',
      description: 'Systematic electrical line load test, short circuit tracing, and fuse/MCB reset.',
      pricingType: 'fixed',
      price: 15000,
      durationEstimate: '2-3 hrs',
      popular: true
    },
    {
      id: 'srv-elec-3',
      name: 'Inverter Changeover Switch Installation',
      category: 'Electricians',
      description: 'Standard manual or automated dual-source changeover breaker configuration.',
      pricingType: 'starting',
      price: 12000,
      durationEstimate: '2 hrs'
    },
    {
      id: 'srv-elec-4',
      name: 'Full Duplex / Office Rewiring Project',
      category: 'Electricians',
      description: 'Complete building conduit conduit piping, cable pulling, trunking, and distribution board setup.',
      pricingType: 'quote_required',
      durationEstimate: '3-7 days'
    }
  ],
  'Plumbers': [
    {
      id: 'srv-plumb-1',
      name: 'Kitchen / Bathroom Tap & Mixer Replacement',
      category: 'Plumbers',
      description: 'Removal and installation of washbasin taps, shower mixers, or angle valves.',
      pricingType: 'fixed',
      price: 8000,
      durationEstimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-plumb-2',
      name: 'Toilet Flushing Mechanism & Siphon Repair',
      category: 'Plumbers',
      description: 'Repair of leaking cistern, siphon replacement, and seal ring alignment.',
      pricingType: 'fixed',
      price: 10000,
      durationEstimate: '1.5 hrs',
      popular: true
    },
    {
      id: 'srv-plumb-3',
      name: 'Burst Pipe Leak Detection & Repair',
      category: 'Plumbers',
      description: 'Acoustic detection and precision repair of hidden wall/underfloor water leakage.',
      pricingType: 'starting',
      price: 15000,
      durationEstimate: '2-4 hrs'
    },
    {
      id: 'srv-plumb-4',
      name: 'Full Bathroom Overhaul & Overhead Tank Plumbing',
      category: 'Plumbers',
      description: 'Comprehensive piping overhaul, multi-tank installation, and booster pump connection.',
      pricingType: 'quote_required',
      durationEstimate: '2-4 days'
    }
  ],
  'Carpenters': [
    {
      id: 'srv-carp-1',
      name: 'Door Lock / Handle Fitting & Hinge Alignment',
      category: 'Carpenters',
      description: 'Mortise lock installation, deadbolts, and door frame alignment.',
      pricingType: 'fixed',
      price: 7500,
      durationEstimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-carp-2',
      name: 'Furniture Repair & Joint Reinforcement',
      category: 'Carpenters',
      description: 'Dining chair restoration, bed frame bracing, and table leg repair.',
      pricingType: 'starting',
      price: 12000,
      durationEstimate: '2-3 hrs'
    },
    {
      id: 'srv-carp-3',
      name: 'Custom Fitted Kitchen Cabinets & Wardrobes',
      category: 'Carpenters',
      description: 'Tailored acrylic/HDF cabinetry with soft-close runners and custom architectural woodwork.',
      pricingType: 'quote_required',
      durationEstimate: '1-2 weeks',
      popular: true
    }
  ],
  'AC Technicians': [
    {
      id: 'srv-ac-1',
      name: 'Split AC Deep Chemical Cleaning & Servicing',
      category: 'AC Technicians',
      description: 'Complete indoor and outdoor coil wash, filter sanitization, and drain clearing.',
      pricingType: 'fixed',
      price: 12000,
      durationEstimate: '1.5 hrs',
      popular: true
    },
    {
      id: 'srv-ac-2',
      name: 'AC Gas Refill (R410a / R22 / R32)',
      category: 'AC Technicians',
      description: 'High-grade refrigerant recharge, pressure gauge check, and valve inspection.',
      pricingType: 'starting',
      price: 18000,
      durationEstimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-ac-3',
      name: 'New Split / Inverter AC Unit Installation',
      category: 'AC Technicians',
      description: 'Mounting indoor & outdoor units, core drilling, pipe vacuuming, and commissioning.',
      pricingType: 'starting',
      price: 25000,
      durationEstimate: '2-3 hrs'
    },
    {
      id: 'srv-ac-4',
      name: 'Commercial VRF / Central HVAC System Maintenance',
      category: 'AC Technicians',
      description: 'Multi-zone VRF diagnostic, compressor replacement, and building duct overhaul.',
      pricingType: 'quote_required',
      durationEstimate: 'Custom'
    }
  ],
  'Appliance Repair Specialists': [
    {
      id: 'srv-app-1',
      name: 'Microwave Oven Heating / Magnetron Repair',
      category: 'Appliance Repair Specialists',
      description: 'High voltage diode, capacitor, or magnetron diagnosis and repair.',
      pricingType: 'fixed',
      price: 9500,
      durationEstimate: '1-2 hrs',
      popular: true
    },
    {
      id: 'srv-app-2',
      name: 'Washing Machine Pump & Belt Repair',
      category: 'Appliance Repair Specialists',
      description: 'Drain blockage clear, suspension spring, and drive motor diagnostic.',
      pricingType: 'starting',
      price: 14000,
      durationEstimate: '2 hrs'
    },
    {
      id: 'srv-app-3',
      name: 'Double-Door Refrigerator Compressor Overhaul',
      category: 'Appliance Repair Specialists',
      description: 'Complete inverter compressor swap, condenser flush, and copper welding.',
      pricingType: 'quote_required',
      durationEstimate: '3-5 hrs'
    }
  ],
  'Mechanics': [
    {
      id: 'srv-mech-1',
      name: 'OBD2 Computer Engine Fault Diagnosis',
      category: 'Mechanics',
      description: 'Electronic diagnostic scan report for engine, gearbox, ABS, and airbag sensors.',
      pricingType: 'fixed',
      price: 7000,
      durationEstimate: '45 mins',
      popular: true
    },
    {
      id: 'srv-mech-2',
      name: 'Brake Pad Replacement & Rotor Skimming',
      category: 'Mechanics',
      description: 'Front or rear ceramic brake pad fitment and brake fluid bleeding.',
      pricingType: 'starting',
      price: 10000,
      durationEstimate: '1.5 hrs'
    },
    {
      id: 'srv-mech-3',
      name: 'Engine Overhaul & Transmission Rebuild',
      category: 'Mechanics',
      description: 'Full engine teardown, piston ring replacement, timing chain kit, and calibration.',
      pricingType: 'quote_required',
      durationEstimate: '3-7 days'
    }
  ],
  'Solar Installers': [
    {
      id: 'srv-sol-1',
      name: 'Solar Panel Array Cleaning & Inspection',
      category: 'Solar Installers',
      description: 'De-ionized chemical wash for up to 10 rooftop panels, MC4 connector testing.',
      pricingType: 'fixed',
      price: 15000,
      durationEstimate: '2 hrs'
    },
    {
      id: 'srv-sol-2',
      name: 'Inverter & Battery Bank Troubleshooting',
      category: 'Solar Installers',
      description: 'Battery health assessment (Lithium/Tubular), MPPT charge controller calibration.',
      pricingType: 'starting',
      price: 20000,
      durationEstimate: '2-3 hrs',
      popular: true
    },
    {
      id: 'srv-sol-3',
      name: 'Complete 3kVA - 20kVA Hybrid Solar Inverter System',
      category: 'Solar Installers',
      description: 'Turnkey solar design: Tier-1 panels, LiFePO4 batteries, pure sine wave inverter & surge protection.',
      pricingType: 'quote_required',
      durationEstimate: '2-5 days',
      popular: true
    }
  ],
  'CCTV Installers': [
    {
      id: 'srv-cctv-1',
      name: 'Standalone IP Camera Setup & Mobile App Sync',
      category: 'CCTV Installers',
      description: 'Single Wi-Fi smart camera mount, micro-SD formatting, and smartphone app remote view.',
      pricingType: 'fixed',
      price: 8500,
      durationEstimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-cctv-2',
      name: '4-Channel DVR/NVR Home Security Installation',
      category: 'CCTV Installers',
      description: 'Cabling, power supply, 4 indoor/outdoor HD cameras, and router port forwarding.',
      pricingType: 'starting',
      price: 25000,
      durationEstimate: '4-6 hrs',
      popular: true
    },
    {
      id: 'srv-cctv-3',
      name: 'Commercial Perimeter & Solar CCTV System',
      category: 'CCTV Installers',
      description: 'Solar-powered PTZ cameras, fiber optic backbone, and 24/7 central security room setup.',
      pricingType: 'quote_required',
      durationEstimate: 'Custom'
    }
  ],
  'Painters': [
    {
      id: 'srv-paint-1',
      name: 'Single Room Accent Wall & Touchup',
      category: 'Painters',
      description: 'Single bedroom or accent wall painting with premium washable silk emulsion.',
      pricingType: 'fixed',
      price: 15000,
      durationEstimate: '3-4 hrs'
    },
    {
      id: 'srv-paint-2',
      name: 'Full Apartment Interior Painting (2-3 Bedroom)',
      category: 'Painters',
      description: 'Sanding, minor crack filling, undercoat primer, and two finishing coats.',
      pricingType: 'starting',
      price: 45000,
      durationEstimate: '2-3 days',
      popular: true
    },
    {
      id: 'srv-paint-3',
      name: 'Full Building POP Screeding & Exterior Stucco Decor',
      category: 'Painters',
      description: 'Full duplex POP wall screeding, waterproof exterior emulsion, and textured stucco.',
      pricingType: 'quote_required',
      durationEstimate: '1-2 weeks'
    }
  ],
  'Welders': [
    {
      id: 'srv-weld-1',
      name: 'Gate Hinge Welding & Lock Plate Reinforcement',
      category: 'Welders',
      description: 'Electric arc welding repair of sagging compound gates and padlock ears.',
      pricingType: 'fixed',
      price: 8500,
      durationEstimate: '1.5 hrs',
      popular: true
    },
    {
      id: 'srv-weld-2',
      name: 'Burglar Proof Window Grilles (Per Unit)',
      category: 'Welders',
      description: 'Solid wrought iron / square tube burglar proofing with anti-rust primer.',
      pricingType: 'starting',
      price: 18000,
      durationEstimate: '1 day'
    },
    {
      id: 'srv-weld-3',
      name: 'Automated Electric Sliding Gate Fabrication',
      category: 'Welders',
      description: 'Bespoke architectural wrought iron gate, track laying, remote motor, and intercom.',
      pricingType: 'quote_required',
      durationEstimate: '1-2 weeks'
    }
  ],
  'Cleaners': [
    {
      id: 'srv-clean-1',
      name: 'Standard 2-Bedroom Apartment Deep Cleaning',
      category: 'Cleaners',
      description: 'Kitchen degreasing, bathroom scrubbing, floor polishing, and window cleaning.',
      pricingType: 'fixed',
      price: 20000,
      durationEstimate: '3-5 hrs',
      popular: true
    },
    {
      id: 'srv-clean-2',
      name: 'Upholstery & Sofa Steam Extraction',
      category: 'Cleaners',
      description: 'Deep foam shampooing and steam extraction for 5-seater fabric/velvet sofas.',
      pricingType: 'starting',
      price: 15000,
      durationEstimate: '2 hrs'
    },
    {
      id: 'srv-clean-3',
      name: 'Post-Construction Full Mansion Debris Clearing & Fumigation',
      category: 'Cleaners',
      description: 'Paint stain stripping, industrial floor buffering, and eco-friendly fumigation.',
      pricingType: 'quote_required',
      durationEstimate: '2-3 days'
    }
  ],
  'Tutors': [
    {
      id: 'srv-tut-1',
      name: 'Single 2-Hour STEM Assessment & Tutoring Session',
      category: 'Tutors',
      description: 'One-on-one intensive tutoring in Mathematics, Physics, or Chemistry.',
      pricingType: 'fixed',
      price: 10000,
      durationEstimate: '2 hrs',
      popular: true
    },
    {
      id: 'srv-tut-2',
      name: 'Monthly Home Tutoring Package (3x / week)',
      category: 'Tutors',
      description: 'Regular 12-session monthly coaching plan with homework assistance and monthly progress tests.',
      pricingType: 'starting',
      price: 45000,
      durationEstimate: '1 month'
    },
    {
      id: 'srv-tut-3',
      name: 'Comprehensive WAEC / JAMB / IGCSE Exam Preparation Track',
      category: 'Tutors',
      description: 'Customized multi-subject curriculum, mock examinations, and past question drills.',
      pricingType: 'quote_required',
      durationEstimate: 'Custom'
    }
  ],
  'Tailors': [
    {
      id: 'srv-tail-1',
      name: 'Trouser & Dress Fitting / Alteration',
      category: 'Tailors',
      description: 'Waist taking-in, length hemming, zip replacement, and sleeve adjustment.',
      pricingType: 'fixed',
      price: 4000,
      durationEstimate: '1 day',
      popular: true
    },
    {
      id: 'srv-tail-2',
      name: 'Custom 2-Piece Senator / Kaftan Suit Tailoring',
      category: 'Tailors',
      description: 'Bespoke cutting and stitching with premium interfacing and pocket details (fabric provided).',
      pricingType: 'starting',
      price: 25000,
      durationEstimate: '4-6 days',
      popular: true
    },
    {
      id: 'srv-tail-3',
      name: 'Bespoke Luxury 3-Piece Agbada with Computer Embroidery',
      category: 'Tailors',
      description: 'Full bridal groom or executive Agbada with custom chest embroidery and cap.',
      pricingType: 'quote_required',
      durationEstimate: '1-2 weeks'
    }
  ],
  'Hair Stylists': [
    {
      id: 'srv-hair-1',
      name: 'Lace Front Wig Revamp & Styling',
      category: 'Hair Stylists',
      description: 'Deep conditioning wash, bleaching knots, customization, and flat iron / curls.',
      pricingType: 'fixed',
      price: 12000,
      durationEstimate: '2-3 hrs',
      popular: true
    },
    {
      id: 'srv-hair-2',
      name: 'Knotless Box Braids (Home Service)',
      category: 'Hair Stylists',
      description: 'Tension-free clean sectioned knotless braids (Medium/Jumbo length).',
      pricingType: 'starting',
      price: 15000,
      durationEstimate: '4-6 hrs',
      popular: true
    },
    {
      id: 'srv-hair-3',
      name: 'Full Bridal Entourage Hair Styling Package',
      category: 'Hair Stylists',
      description: 'On-location bride plus 4 bridesmaids luxury hair preparation and touch-up.',
      pricingType: 'quote_required',
      durationEstimate: 'Full Day'
    }
  ],
  'Photographers': [
    {
      id: 'srv-photo-1',
      name: 'Studio / Outdoor 1-Hour Headshot Session (5 Retouched)',
      category: 'Photographers',
      description: 'Executive portrait session with pro lighting, including 5 high-res edited retouched files.',
      pricingType: 'fixed',
      price: 25000,
      durationEstimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-photo-2',
      name: 'Birthday / Small Private Party Event Coverage',
      category: 'Photographers',
      description: 'Up to 3 hours event coverage with digital online gallery and 50 color-graded photos.',
      pricingType: 'starting',
      price: 50000,
      durationEstimate: '3 hrs'
    },
    {
      id: 'srv-photo-3',
      name: 'Full Day Traditional & White Wedding Photo + Drone Video Package',
      category: 'Photographers',
      description: 'Dual shooter coverage, photobook album, cinematic 4K highlight reel, and drone aerial footage.',
      pricingType: 'quote_required',
      durationEstimate: 'Full Day',
      popular: true
    }
  ],
  'Event Professionals': [
    {
      id: 'srv-event-1',
      name: 'Event Sound System & Wireless Mics (Up to 100 Guests)',
      category: 'Event Professionals',
      description: 'Compact 2-speaker PA system with sound technician and 2 wireless microphones.',
      pricingType: 'fixed',
      price: 35000,
      durationEstimate: '4 hrs'
    },
    {
      id: 'srv-event-2',
      name: 'Birthday / Anniversary Hall Mood Lighting & Backdrop',
      category: 'Event Professionals',
      description: 'Custom sequin / floral photo backdrop with 8 wireless RGB LED ambient mood uplights.',
      pricingType: 'starting',
      price: 60000,
      durationEstimate: 'Setup + Event'
    },
    {
      id: 'srv-event-3',
      name: 'Full Grand Wedding Planning & 500-Guest Hall Decor',
      category: 'Event Professionals',
      description: 'Turnkey event planning, grand walkway canopy, crystal chandeliers, centerpiece florals & catering coordination.',
      pricingType: 'quote_required',
      durationEstimate: 'Multi-day',
      popular: true
    }
  ]
};

export const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: 'p1',
    name: 'Babatunde "Spark" Adebayo',
    avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&auto=format&fit=crop&q=80',
    category: 'Electricians',
    tagline: 'Master Electrician & Smart Home Wiring Expert',
    bio: 'Licensed Class-A electrician with over 10 years experience in residential and commercial electrical installations, prepaid meter bypass fixes, inverter wiring, and smart home automation across Oyo State.',
    location: 'Oyo State',
    neighborhood: 'Bodija GRA',
    hourlyRate: 8500,
    pricingType: 'starting',
    basePrice: 5000,
    services: [
      {
        id: 'p1-srv-1',
        name: 'Socket & Switch Repair / Fitting',
        category: 'Electricians',
        description: 'Single socket or switch change, burnt receptacle replacement, and earth check.',
        pricingType: 'fixed',
        price: 5000,
        durationEstimate: '1 hr',
        popular: true
      },
      {
        id: 'p1-srv-2',
        name: 'Circuit Breaker / DB Box Tripping Diagnosis',
        category: 'Electricians',
        description: 'Systematic electrical line load test, short circuit tracing, and fuse/MCB reset.',
        pricingType: 'fixed',
        price: 15000,
        durationEstimate: '2-3 hrs',
        popular: true
      },
      {
        id: 'p1-srv-3',
        name: 'Inverter Changeover Switch Installation',
        category: 'Electricians',
        description: 'Standard manual or automated dual-source changeover breaker configuration.',
        pricingType: 'starting',
        price: 12000,
        durationEstimate: '2 hrs'
      },
      {
        id: 'p1-srv-4',
        name: 'Full Duplex / Office Rewiring Project',
        category: 'Electricians',
        description: 'Complete building conduit piping, cable pulling, trunking, and distribution board setup.',
        pricingType: 'quote_required',
        durationEstimate: '3-7 days'
      }
    ],
    rating: 4.9,
    reviewCount: 124,
    completedJobs: 310,
    experienceYears: 10,
    isAvailableNow: true,
    verified: true,
    phone: '+234 802 345 6789',
    email: 'babatunde.adebayo@kazihub.ng',
    earningsTotal: 1850000,
    portfolio: [
      {
        id: 'port-1',
        title: 'Complete Duplex Rewiring & DB Box Upgrade',
        category: 'Electricians',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
        description: 'Upgraded old fuse box to modern MCB breaker panel with automated changeover switch and surge protection.',
        dateCompleted: '2026-06-15'
      },
      {
        id: 'port-2',
        title: 'Commercial LED Panel & Backup Light Installation',
        category: 'Electricians',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        description: 'Installed 45 energy-efficient LED fixtures and automatic emergency backup power systems for office complex.',
        dateCompleted: '2026-05-20'
      }
    ],
    reviews: [
      {
        id: 'rev-1',
        customerId: 'c1',
        customerName: 'Nneka Okonkwo',
        customerAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        comment: 'Babatunde arrived within 30 minutes of booking! Fixed our DB board tripping issue cleanly and professionally.',
        date: '2026-07-28'
      },
      {
        id: 'rev-2',
        customerId: 'c2',
        customerName: 'Segun Oladipo',
        rating: 5,
        comment: 'Very knowledgeable and neat work. Installed our automatic inverter switch effortlessly.',
        date: '2026-07-10'
      }
    ]
  },
  {
    id: 'p2',
    name: 'Chioma Okonkwo',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
    category: 'Plumbers',
    tagline: 'Precision Plumbing & Leak Detection Specialist (Plumber A)',
    bio: 'Expert in bathroom remodeling, high-pressure leak detection, solar water heater plumbing, and clogged sewer pipe clearing.',
    location: 'Oyo State',
    neighborhood: 'Ring Road',
    hourlyRate: 7500,
    pricingType: 'fixed',
    basePrice: 15000,
    services: [
      {
        id: 'p2-srv-1',
        name: 'Pipe Leak Detection & Repair',
        category: 'Plumbers',
        description: 'Acoustic detection and precision repair of hidden wall/underfloor water leakage.',
        pricingType: 'fixed',
        price: 15000,
        durationEstimate: '2-3 hrs',
        popular: true
      },
      {
        id: 'p2-srv-2',
        name: 'Kitchen / Bathroom Tap & Mixer Replacement',
        category: 'Plumbers',
        description: 'Removal and installation of washbasin taps, shower mixers, or angle valves.',
        pricingType: 'fixed',
        price: 8000,
        durationEstimate: '1 hr',
        popular: true
      },
      {
        id: 'p2-srv-3',
        name: 'Toilet Flushing Mechanism & Siphon Repair',
        category: 'Plumbers',
        description: 'Repair of leaking cistern, siphon replacement, and seal ring alignment.',
        pricingType: 'starting',
        price: 10000,
        durationEstimate: '1.5 hrs'
      },
      {
        id: 'p2-srv-4',
        name: 'Full Bathroom Overhaul & Overhead Tank Plumbing',
        category: 'Plumbers',
        description: 'Comprehensive piping overhaul, multi-tank installation, and booster pump connection.',
        pricingType: 'quote_required',
        durationEstimate: '2-4 days'
      }
    ],
    rating: 4.8,
    reviewCount: 98,
    completedJobs: 245,
    experienceYears: 8,
    isAvailableNow: true,
    verified: true,
    phone: '+234 803 987 6543',
    email: 'chioma.okonkwo@kazihub.ng',
    earningsTotal: 1420000,
    portfolio: [
      {
        id: 'port-3',
        title: 'Underground Leak Detection & Pipe Replacement',
        category: 'Plumbers',
        imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
        description: 'Used acoustic sensors to pinpoint burst underground pipe beneath interlocking tiles without breaking the main compound.',
        dateCompleted: '2026-07-02'
      }
    ],
    reviews: [
      {
        id: 'rev-3',
        customerId: 'c3',
        customerName: 'Chidi Anene',
        rating: 5,
        comment: 'Chioma saved our kitchen from flooding! Super quick response and transparent pricing.',
        date: '2026-07-25'
      }
    ]
  },
  {
    id: 'p17',
    name: 'Musa "FlowMaster" Danladi',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    category: 'Plumbers',
    tagline: 'Custom Plumbing Projects & Commercial Piping (Plumber B)',
    bio: 'Experienced plumbing contractor handling complex commercial pipe networks, underground mains inspection, quote-based building piping, and pressure pump setups.',
    location: 'Oyo State',
    neighborhood: 'UI / Agbowo',
    hourlyRate: 8000,
    pricingType: 'quote_required',
    basePrice: 12000,
    services: [
      {
        id: 'p17-srv-1',
        name: 'Pipe Leak Detection & Repair',
        category: 'Plumbers',
        description: 'Comprehensive inspection, pressure testing, and custom repair quote based on severity and pipeline material.',
        pricingType: 'quote_required',
        durationEstimate: '2-4 hrs'
      },
      {
        id: 'p17-srv-2',
        name: 'Kitchen / Bathroom Tap & Mixer Replacement',
        category: 'Plumbers',
        description: 'Standard mixer or stop-cock fitting and valve inspection.',
        pricingType: 'starting',
        price: 7000,
        durationEstimate: '1 hr'
      },
      {
        id: 'p17-srv-3',
        name: 'Water Tank & Booster Pump Installation',
        category: 'Plumbers',
        description: 'Full installation of automatic water pressure booster pump and bypass valves.',
        pricingType: 'fixed',
        price: 25000,
        durationEstimate: '3-4 hrs',
        popular: true
      },
      {
        id: 'p17-srv-4',
        name: 'Emergency Drain Unblocking & Snaking',
        category: 'Plumbers',
        description: 'Electric snake auger clearing of clogged main sewer and kitchen trap drains.',
        pricingType: 'fixed',
        price: 12000,
        durationEstimate: '1.5 hrs',
        popular: true
      }
    ],
    rating: 4.9,
    reviewCount: 78,
    completedJobs: 195,
    experienceYears: 11,
    isAvailableNow: true,
    verified: true,
    phone: '+234 811 445 6677',
    email: 'musa.danladi@kazihub.ng',
    earningsTotal: 1780000,
    portfolio: [
      {
        id: 'port-18',
        title: 'Commercial Multi-Level Water Booster System',
        category: 'Plumbers',
        imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
        description: 'Engineered dual booster pump station with automated pressure switches for 3-story residential complex.',
        dateCompleted: '2026-07-19'
      }
    ],
    reviews: [
      {
        id: 'rev-18',
        customerId: 'c1',
        customerName: 'Nneka Okonkwo',
        rating: 5,
        comment: 'Musa gave an accurate and reasonable quote for our underground pipe leak and fixed it neatly!',
        date: '2026-07-29'
      }
    ]
  },
  {
    id: 'p3',
    name: 'Emeka Nwosu',
    avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&auto=format&fit=crop&q=80',
    category: 'Carpenters',
    tagline: 'Custom Furniture & Executive Cabinetry Craftsman',
    bio: 'Handcrafting bespoke wooden furniture, wardrobes, fitted kitchen cabinets, and executive office desks with premium African teak and mahogany in Ibadan.',
    location: 'Oyo State',
    neighborhood: 'Iyaganku GRA',
    hourlyRate: 12000,
    pricingType: 'quote_required',
    basePrice: 7500,
    services: [
      {
        id: 'p3-srv-1',
        name: 'Door Lock / Handle Fitting & Hinge Alignment',
        category: 'Carpenters',
        description: 'Mortise lock installation, deadbolts, and door frame alignment.',
        pricingType: 'fixed',
        price: 7500,
        durationEstimate: '1 hr',
        popular: true
      },
      {
        id: 'p3-srv-2',
        name: 'Furniture Repair & Joint Reinforcement',
        category: 'Carpenters',
        description: 'Dining chair restoration, bed frame bracing, and table leg repair.',
        pricingType: 'starting',
        price: 12000,
        durationEstimate: '2-3 hrs'
      },
      {
        id: 'p3-srv-3',
        name: 'Custom Fitted Kitchen Cabinets & Wardrobes',
        category: 'Carpenters',
        description: 'Tailored acrylic/HDF cabinetry with soft-close runners and custom architectural woodwork.',
        pricingType: 'quote_required',
        durationEstimate: '1-2 weeks',
        popular: true
      }
    ],
    rating: 4.9,
    reviewCount: 82,
    completedJobs: 190,
    experienceYears: 12,
    isAvailableNow: false,
    verified: true,
    phone: '+234 805 456 7890',
    email: 'emeka.nwosu@kazihub.ng',
    earningsTotal: 2280000,
    portfolio: [
      {
        id: 'port-4',
        title: 'Fitted Kitchen Cabinetry & Island Unit',
        category: 'Carpenters',
        imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80',
        description: 'Custom fitted kitchen cabinets with soft-close drawers, acrylic finish, and built-in LED backlight strips.',
        dateCompleted: '2026-06-10'
      }
    ],
    reviews: [
      {
        id: 'rev-4',
        customerId: 'c4',
        customerName: 'Dr. Ngozi Adeleke',
        rating: 5,
        comment: 'Exquisite craftsmanship. Emeka is a true artist with wood!',
        date: '2026-07-12'
      }
    ]
  },
  {
    id: 'p4',
    name: 'Olawale Ogunleye',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
    category: 'AC Technicians',
    tagline: 'HVAC & Inverter AC Installation & Servicing',
    bio: 'Specialized in split AC installations, VRF inverter systems, gas refilling, chemical washing, and compressor diagnostics for homes and corporate offices.',
    location: 'Oyo State',
    neighborhood: 'UI / Agbowo',
    hourlyRate: 8000,
    pricingType: 'fixed',
    basePrice: 12000,
    services: [
      {
        id: 'p4-srv-1',
        name: 'Split AC Deep Chemical Cleaning & Servicing',
        category: 'AC Technicians',
        description: 'Complete indoor and outdoor coil wash, filter sanitization, and drain clearing.',
        pricingType: 'fixed',
        price: 12000,
        durationEstimate: '1.5 hrs',
        popular: true
      },
      {
        id: 'p4-srv-2',
        name: 'AC Gas Refill (R410a / R22 / R32)',
        category: 'AC Technicians',
        description: 'High-grade refrigerant recharge, pressure gauge check, and valve inspection.',
        pricingType: 'starting',
        price: 18000,
        durationEstimate: '1 hr',
        popular: true
      },
      {
        id: 'p4-srv-3',
        name: 'New Split / Inverter AC Unit Installation',
        category: 'AC Technicians',
        description: 'Wall bracket mounting, outdoor condenser positioning, vacuuming, and copper piping setup.',
        pricingType: 'starting',
        price: 25000,
        durationEstimate: '2-3 hrs'
      },
      {
        id: 'p4-srv-4',
        name: 'Commercial VRF / Central HVAC System Maintenance',
        category: 'AC Technicians',
        description: 'Custom diagnostic and scheduled contract maintenance for commercial buildings.',
        pricingType: 'quote_required',
        durationEstimate: 'Custom'
      }
    ],
    rating: 4.7,
    reviewCount: 65,
    completedJobs: 180,
    experienceYears: 7,
    isAvailableNow: true,
    verified: true,
    phone: '+234 808 112 2334',
    email: 'olawale.ogunleye@kazihub.ng',
    earningsTotal: 1250000,
    portfolio: [
      {
        id: 'port-5',
        title: 'Inverter AC Multi-Split Installation',
        category: 'AC Technicians',
        imageUrl: 'https://images.unsplash.com/photo-1631545725736-2495d03833df?w=800&auto=format&fit=crop&q=80',
        description: 'Installed 4 energy-saving inverter AC units with concealed trunking and smart thermostat control.',
        dateCompleted: '2026-07-18'
      }
    ],
    reviews: [
      {
        id: 'rev-5',
        customerId: 'c5',
        customerName: 'Kunle Fasasi',
        rating: 4.5,
        comment: 'Very professional, AC is blowing ice cold now!',
        date: '2026-07-20'
      }
    ]
  },
  {
    id: 'p5',
    name: 'Blessing Eze',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
    category: 'Cleaners',
    tagline: 'Deep Cleaning, Post-Construction & Fumigation',
    bio: 'Professional deep cleaning team equipped with industrial steam extractors, eco-friendly detergents, and post-construction debris clearing in Ibadan city.',
    location: 'Oyo State',
    neighborhood: 'Oluyole Estate',
    hourlyRate: 5000,
    pricingType: 'fixed',
    basePrice: 20000,
    services: [
      {
        id: 'p5-srv-1',
        name: 'Standard 2-Bedroom Apartment Deep Cleaning',
        category: 'Cleaners',
        description: 'Intensive scrubbing of floor tiles, bathroom grout, kitchen degreasing, and windows.',
        pricingType: 'fixed',
        price: 20000,
        durationEstimate: '3-5 hrs',
        popular: true
      },
      {
        id: 'p5-srv-2',
        name: 'Upholstery & Sofa Steam Extraction',
        category: 'Cleaners',
        description: 'Deep fiber steam sanitization and stain removal for 5-7 seater living room set.',
        pricingType: 'starting',
        price: 15000,
        durationEstimate: '2 hrs'
      },
      {
        id: 'p5-srv-3',
        name: 'Post-Construction Full Mansion Debris Clearing & Fumigation',
        category: 'Cleaners',
        description: 'Industrial cement stain scraping, full paint splatter cleanup, and whole-compound pest fumigation.',
        pricingType: 'quote_required',
        durationEstimate: '2-3 days'
      }
    ],
    rating: 5.0,
    reviewCount: 156,
    completedJobs: 420,
    experienceYears: 6,
    isAvailableNow: true,
    verified: true,
    phone: '+234 810 334 4556',
    email: 'blessing.eze@kazihub.ng',
    earningsTotal: 1680000,
    portfolio: [
      {
        id: 'port-6',
        title: 'Post-Construction Penthouse Cleaning & Fumigation',
        category: 'Cleaners',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
        description: 'Complete cement paint stain removal, window glass polishing, and full pest fumigation.',
        dateCompleted: '2026-07-22'
      }
    ],
    reviews: [
      {
        id: 'rev-6',
        customerId: 'c6',
        customerName: 'Aisha Mohammed',
        rating: 5,
        comment: 'Immaculate work. Our home looked brand new after Blessing and her crew finished.',
        date: '2026-07-29'
      }
    ]
  },
  {
    id: 'p6',
    name: 'Engr. Chidi Anene',
    avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&auto=format&fit=crop&q=80',
    category: 'Solar Installers',
    tagline: 'Off-Grid & Hybrid Solar Inverter System Engineer',
    bio: 'COREN certified solar power designer in Ibadan. We install high-capacity pure sine wave inverter setups, Lithium LiFePO4 battery banks, and rooftop solar arrays.',
    location: 'Oyo State',
    neighborhood: 'Samonda',
    hourlyRate: 15000,
    pricingType: 'quote_required',
    basePrice: 15000,
    services: [
      {
        id: 'p6-srv-1',
        name: 'Solar Panel Efficiency Cleaning & Cable Inspection',
        category: 'Solar Installers',
        description: 'Dust & grime removal from solar arrays and MC4 connector waterproofing check.',
        pricingType: 'fixed',
        price: 15000,
        durationEstimate: '2 hrs'
      },
      {
        id: 'p6-srv-2',
        name: 'Inverter & Battery Bank Troubleshooting',
        category: 'Solar Installers',
        description: 'Cell balancing test for Lithium/Tubular batteries and firmware error diagnosis.',
        pricingType: 'starting',
        price: 20000,
        durationEstimate: '2-3 hrs',
        popular: true
      },
      {
        id: 'p6-srv-3',
        name: '5kVA - 15kVA Complete Hybrid Solar System Installation',
        category: 'Solar Installers',
        description: 'Full engineering design, panel mounting, lithium storage integration, and lightning surge protection.',
        pricingType: 'quote_required',
        durationEstimate: '2-5 days',
        popular: true
      }
    ],
    rating: 4.9,
    reviewCount: 74,
    completedJobs: 135,
    experienceYears: 9,
    isAvailableNow: true,
    verified: true,
    phone: '+234 806 556 6778',
    email: 'chidi.anene@kazihub.ng',
    earningsTotal: 3100000,
    portfolio: [
      {
        id: 'port-7',
        title: '10kVA Hybrid Solar Inverter System',
        category: 'Solar Installers',
        imageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&auto=format&fit=crop&q=80',
        description: 'Installed 12 monocrystalline panels with 15kWh Felicity lithium storage and automatic generator integration.',
        dateCompleted: '2026-07-05'
      }
    ],
    reviews: [
      {
        id: 'rev-7',
        customerId: 'c7',
        customerName: 'Hajia Fatima Usman',
        rating: 5,
        comment: 'Zero power blackouts since Engr. Chidi installed our hybrid inverter system. Exceptional service!',
        date: '2026-07-15'
      }
    ]
  },
  {
    id: 'p7',
    name: 'Kabiru Ibrahim',
    avatar: 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=400&auto=format&fit=crop&q=80',
    category: 'CCTV Installers',
    tagline: 'IP Security Cameras & Smart Biometric Access Control',
    bio: 'Securing residential homes and corporate estates across Ibadan and Oyo State with Hikvision 4K PTZ cameras, solar-powered CCTV setups, and remote monitoring.',
    location: 'Oyo State',
    neighborhood: 'Challenge',
    hourlyRate: 7000,
    pricingType: 'starting',
    basePrice: 8500,
    services: [
      {
        id: 'p7-srv-1',
        name: 'Single Camera Setup & Mobile Viewing App Config',
        category: 'CCTV Installers',
        description: 'Installation of one Wi-Fi/IP camera, network binding, and smartphone live feed setup.',
        pricingType: 'fixed',
        price: 8500,
        durationEstimate: '1-2 hrs',
        popular: true
      },
      {
        id: 'p7-srv-2',
        name: '4-8 Channel HD CCTV System Installation',
        category: 'CCTV Installers',
        description: 'Full coaxial/Cat6 cable trunking, DVR/NVR configuration, and power supply box setup.',
        pricingType: 'starting',
        price: 35000,
        durationEstimate: '1 day',
        popular: true
      },
      {
        id: 'p7-srv-3',
        name: 'Smart Biometric Access Control & Perimeter Alarm',
        category: 'CCTV Installers',
        description: 'Magnetic lock door access, RFID keycard/fingerprint terminals, and beam sensors.',
        pricingType: 'quote_required',
        durationEstimate: '2-3 days'
      }
    ],
    rating: 4.8,
    reviewCount: 52,
    completedJobs: 110,
    experienceYears: 6,
    isAvailableNow: true,
    verified: true,
    phone: '+234 813 889 9001',
    email: 'kabiru.ibrahim@kazihub.ng',
    earningsTotal: 1150000,
    portfolio: [
      {
        id: 'port-8',
        title: 'Gated Estate Perimeter Solar CCTV Setup',
        category: 'CCTV Installers',
        imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
        description: 'Installed 16 optical-zoom bullet cameras with night vision and instant motion alert phone notifications.',
        dateCompleted: '2026-07-14'
      }
    ],
    reviews: [
      {
        id: 'rev-8',
        customerId: 'c8',
        customerName: 'Chief Tunde Balogun',
        rating: 5,
        comment: 'Crystal clear footage day and night. Set up our phone monitoring apps seamlessly.',
        date: '2026-07-21'
      }
    ]
  },
  {
    id: 'p8',
    name: 'Funmi Akintola',
    avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&auto=format&fit=crop&q=80',
    category: 'Photographers',
    tagline: 'Commercial, Portrait & High-End Event Photography',
    bio: 'Capturing luxury architectural interiors, corporate portraits, traditional weddings, and brand campaigns with high-end mirrorless gear across Ibadan & Oyo State.',
    location: 'Oyo State',
    neighborhood: 'Akobo',
    hourlyRate: 18000,
    pricingType: 'fixed',
    basePrice: 25000,
    services: [
      {
        id: 'p8-srv-1',
        name: 'Studio Headshot & Executive Portrait Session (5 Edits)',
        category: 'Photographers',
        description: 'Professional studio lighting, backdrop setup, and 5 high-end retouched digital portraits.',
        pricingType: 'fixed',
        price: 25000,
        durationEstimate: '1 hr',
        popular: true
      },
      {
        id: 'p8-srv-2',
        name: 'Outdoor Fashion / Birthday Photoshoot',
        category: 'Photographers',
        description: '2 outfit changes on location, 15 retouched images and full raw picture gallery.',
        pricingType: 'starting',
        price: 45000,
        durationEstimate: '2-3 hrs',
        popular: true
      },
      {
        id: 'p8-srv-3',
        name: 'Full Day Traditional & White Wedding Photo + Drone Video Package',
        category: 'Photographers',
        description: 'Multi-camera team coverage, cinematic 4K highlight reel, drone aerials, and luxury photobook album.',
        pricingType: 'quote_required',
        durationEstimate: 'Full Day',
        popular: true
      }
    ],
    rating: 4.9,
    reviewCount: 112,
    completedJobs: 230,
    experienceYears: 7,
    isAvailableNow: true,
    verified: true,
    phone: '+234 812 223 3445',
    email: 'funmi.akintola@kazihub.ng',
    earningsTotal: 2850000,
    portfolio: [
      {
        id: 'port-9',
        title: 'Old GRA Luxury Villa Architectural Shoot',
        category: 'Photographers',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
        description: 'HDR architectural interior photography and video tour for luxury real estate listing.',
        dateCompleted: '2026-07-26'
      }
    ],
    reviews: [
      {
        id: 'rev-9',
        customerId: 'c9',
        customerName: 'Bola Tinubu-Ojo',
        rating: 5,
        comment: 'Funmi has an incredible eye for lighting and angles. Absolutely stunning photos!',
        date: '2026-07-27'
      }
    ]
  },
  {
    id: 'p9',
    name: 'Tunde "Engine" Bakare',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    category: 'Mechanics',
    tagline: 'Automobile Diagnostics & Heavy Generator Maintenance',
    bio: 'Master mechanic specializing in Japanese and European auto engine overhaul, computer diagnostics, brake pad replacements, and diesel/petrol soundproof generator servicing across Ibadan.',
    location: 'Oyo State',
    neighborhood: 'Dugbe',
    hourlyRate: 9000,
    pricingType: 'fixed',
    basePrice: 7000,
    services: [
      {
        id: 'p9-srv-1',
        name: 'Full Vehicle OBD2 Computer Diagnostic Scan',
        category: 'Mechanics',
        description: 'Complete ECU sensor readout, error code clearing, live data fuel trim inspection.',
        pricingType: 'fixed',
        price: 7000,
        durationEstimate: '45 mins',
        popular: true
      },
      {
        id: 'p9-srv-2',
        name: 'Complete Brake Pad Replacement & Disc Skimming',
        category: 'Mechanics',
        description: 'Front or rear ceramic brake pad installation, caliper pin lubrication, and brake fluid top-up.',
        pricingType: 'fixed',
        price: 10000,
        durationEstimate: '1.5 hrs'
      },
      {
        id: 'p9-srv-3',
        name: 'Engine Tune-Up, Oil Service & Spark Plugs Swap',
        category: 'Mechanics',
        description: 'Full synthetic oil drain and filter change, iridium plug swap, throttle body cleaning.',
        pricingType: 'starting',
        price: 18000,
        durationEstimate: '2 hrs',
        popular: true
      },
      {
        id: 'p9-srv-4',
        name: 'Engine Overhaul / Automatic Transmission Rebuild',
        category: 'Mechanics',
        description: 'Piston ring replacement, crankshaft grinding, cylinder head valve seating, and gearbox rebuild.',
        pricingType: 'quote_required',
        durationEstimate: '3-5 days'
      }
    ],
    rating: 4.8,
    reviewCount: 88,
    completedJobs: 210,
    experienceYears: 11,
    isAvailableNow: true,
    verified: true,
    phone: '+234 802 888 7766',
    email: 'tunde.bakare@kazihub.ng',
    earningsTotal: 1980000,
    portfolio: [
      {
        id: 'port-10',
        title: 'Complete Engine Overhaul & Computer Diagnostics',
        category: 'Mechanics',
        imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
        description: 'Rebuilt 6-cylinder Toyota engine and calibrated automatic transmission system with OBD2 scanner.',
        dateCompleted: '2026-07-20'
      }
    ],
    reviews: [
      {
        id: 'rev-10',
        customerId: 'c10',
        customerName: 'Kayode Alabi',
        rating: 5,
        comment: 'Tunde diagnosed my car check engine light in 10 minutes. Extremely honest and reliable mechanic!',
        date: '2026-07-28'
      }
    ]
  },
  {
    id: 'p10',
    name: 'Sunday "Smooth Finish" Ogundele',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    category: 'Painters',
    tagline: 'POP Screeding, Interior Wall Decor & Exterior Stucco',
    bio: 'High-end wall painter with expertise in wall screeding, POP finish, wallpaper installation, washable silk painting, and moisture-proof exterior coatings in Bodija GRA and Oluyole.',
    location: 'Oyo State',
    neighborhood: 'Bodija GRA',
    hourlyRate: 6500,
    pricingType: 'starting',
    basePrice: 15000,
    services: [
      {
        id: 'p10-srv-1',
        name: 'Room Accent Wall Painting (Washable Silk)',
        category: 'Painters',
        description: 'Single room focal wall preparation, primer undercoat, and 2 coats of premium washable silk paint.',
        pricingType: 'fixed',
        price: 15000,
        durationEstimate: '3-4 hrs'
      },
      {
        id: 'p10-srv-2',
        name: 'Full Apartment Interior Painting (2-3 Bedroom)',
        category: 'Painters',
        description: 'Wall patching, ceiling painting, door trims, and 2 full coats across all rooms.',
        pricingType: 'starting',
        price: 45000,
        durationEstimate: '2-3 days',
        popular: true
      },
      {
        id: 'p10-srv-3',
        name: 'Full Building POP Screeding & Exterior Stucco Decor',
        category: 'Painters',
        description: 'Full exterior scaffold plastering, water-repellent texturized stucco, and marble-effect interior screeding.',
        pricingType: 'quote_required',
        durationEstimate: '1-2 weeks'
      }
    ],
    rating: 4.9,
    reviewCount: 94,
    completedJobs: 280,
    experienceYears: 8,
    isAvailableNow: true,
    verified: true,
    phone: '+234 814 555 4433',
    email: 'sunday.ogundele@kazihub.ng',
    earningsTotal: 1750000,
    portfolio: [
      {
        id: 'port-11',
        title: '3-Bedroom Duplex Screeding & Satin Finish',
        category: 'Painters',
        imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80',
        description: 'Full wall filling, sanding, primer coating, and premium satin paint finish with accent feature wall.',
        dateCompleted: '2026-07-15'
      }
    ],
    reviews: [
      {
        id: 'rev-11',
        customerId: 'c11',
        customerName: 'Dr. Folashade Ajayi',
        rating: 5,
        comment: 'Sunday and his team painted our entire house without leaving a single paint drop on the floor tiles!',
        date: '2026-07-22'
      }
    ]
  },
  {
    id: 'p12',
    name: 'Amina Bello',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    category: 'Tailors',
    tagline: 'Bespoke Traditional Agbada, Senator Suits & Ready-to-Wear',
    bio: 'Master fashion designer crafting exquisite bespoke Aso-Ebi, fitted Senator suits, female kaftans, and corporate alterations with fast delivery in Dugbe & Bodija.',
    location: 'Oyo State',
    neighborhood: 'Dugbe',
    hourlyRate: 8000,
    pricingType: 'starting',
    basePrice: 4000,
    services: [
      {
        id: 'p12-srv-1',
        name: 'Trouser & Dress Fitting / Alteration',
        category: 'Tailors',
        description: 'Hem adjustment, waist nipping, zip repair, and precision sleeve tapering.',
        pricingType: 'fixed',
        price: 4000,
        durationEstimate: '1 day',
        popular: true
      },
      {
        id: 'p12-srv-2',
        name: 'Custom 2-Piece Senator / Kaftan Suit Tailoring',
        category: 'Tailors',
        description: 'Premium wool/cashmere material sewing with crisp neckline piping and custom pocket square detailing.',
        pricingType: 'starting',
        price: 25000,
        durationEstimate: '4-6 days',
        popular: true
      },
      {
        id: 'p12-srv-3',
        name: 'Bespoke Luxury 3-Piece Agbada with Computer Embroidery',
        category: 'Tailors',
        description: 'Heavy damask or Swiss voile grand Agbada with intricate chest embroidery pattern.',
        pricingType: 'quote_required',
        durationEstimate: '1-2 weeks'
      }
    ],
    rating: 5.0,
    reviewCount: 140,
    completedJobs: 350,
    experienceYears: 10,
    isAvailableNow: true,
    verified: true,
    phone: '+234 809 123 9988',
    email: 'amina.bello@kazihub.ng',
    earningsTotal: 2100000,
    portfolio: [
      {
        id: 'port-12',
        title: 'Custom Embroidered Agbada & Senator Set',
        category: 'Tailors',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
        description: 'Hand-cut wool fabric with intricate computer embroidery for wedding groomsmen.',
        dateCompleted: '2026-07-10'
      }
    ],
    reviews: [
      {
        id: 'rev-12',
        customerId: 'c12',
        customerName: 'Chief Rotimi Williams',
        rating: 5,
        comment: 'The fitting was 100% perfect on the first try! Amina is my go-to tailor in Ibadan now.',
        date: '2026-07-24'
      }
    ]
  },
  {
    id: 'p13',
    name: 'Kemi "Glamour" Alabi',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    category: 'Hair Stylists',
    tagline: 'Bridal Hair Specialist, Knotless Braids & Custom Wigs',
    bio: 'Professional mobile hair stylist specializing in flawless knotless braids, lace front wig revamps, dreadlocks, and glam bridal hair styling at your home doorstep.',
    location: 'Oyo State',
    neighborhood: 'Oluyole Estate',
    hourlyRate: 7000,
    pricingType: 'fixed',
    basePrice: 12000,
    services: [
      {
        id: 'p13-srv-1',
        name: 'Lace Front Wig Revamp & Styling',
        category: 'Hair Stylists',
        description: 'Deep conditioning, lace tinting, hairline plucking, and custom thermal curling/straightening.',
        pricingType: 'fixed',
        price: 12000,
        durationEstimate: '2-3 hrs',
        popular: true
      },
      {
        id: 'p13-srv-2',
        name: 'Knotless Box Braids (Mid-Back Length)',
        category: 'Hair Stylists',
        description: 'Lightweight, tension-free parted braids with dip curled or straight ends.',
        pricingType: 'starting',
        price: 16000,
        durationEstimate: '4-5 hrs',
        popular: true
      },
      {
        id: 'p13-srv-3',
        name: 'Full Bridal Hairstyling & Touchup Package',
        category: 'Hair Stylists',
        description: 'Traditional engagement gelee tying, white wedding updo, bridal party styling and reception touchups.',
        pricingType: 'quote_required',
        durationEstimate: 'Wedding Day'
      }
    ],
    rating: 4.9,
    reviewCount: 105,
    completedJobs: 290,
    experienceYears: 7,
    isAvailableNow: true,
    verified: true,
    phone: '+234 816 777 8899',
    email: 'kemi.alabi@kazihub.ng',
    earningsTotal: 1620000,
    portfolio: [
      {
        id: 'port-13',
        title: 'Jumbo Knotless Braids & Edge Styling',
        category: 'Hair Stylists',
        imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80',
        description: 'Tension-free knotless box braids with scalp care treatment.',
        dateCompleted: '2026-07-18'
      }
    ],
    reviews: [
      {
        id: 'rev-13',
        customerId: 'c13',
        customerName: 'Yewande Adeleke',
        rating: 5,
        comment: 'Kemi came to my house on time and styled my hair painlessly! Will definitely book again.',
        date: '2026-07-29'
      }
    ]
  },
  {
    id: 'p14',
    name: 'David Olatunji',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    category: 'Appliance Repair Specialists',
    tagline: 'Washing Machine, Refrigerator & Microwave Technician',
    bio: 'Expert repair of front/top loading washing machines, double-door refrigerators, gas cookers, and microwave ovens. Genuine spare parts guaranteed.',
    location: 'Oyo State',
    neighborhood: 'Ring Road',
    hourlyRate: 7500,
    pricingType: 'fixed',
    basePrice: 9500,
    services: [
      {
        id: 'p14-srv-1',
        name: 'Microwave Oven Heating / Magnetron Repair',
        category: 'Appliance Repair Specialists',
        description: 'Diagnosis and replacement of blown high-voltage diode, capacitor, or magnetron.',
        pricingType: 'fixed',
        price: 9500,
        durationEstimate: '1-2 hrs',
        popular: true
      },
      {
        id: 'p14-srv-2',
        name: 'Washing Machine Pump & Belt Repair',
        category: 'Appliance Repair Specialists',
        description: 'Unclogging drain pump, replacing worn drive belt, and clearing error codes.',
        pricingType: 'starting',
        price: 14000,
        durationEstimate: '2 hrs'
      },
      {
        id: 'p14-srv-3',
        name: 'Double-Door Refrigerator Compressor Overhaul',
        category: 'Appliance Repair Specialists',
        description: 'Inverter compressor replacement, filter drier swap, vacuum leak test, and R600a gas recharge.',
        pricingType: 'starting',
        price: 28000,
        durationEstimate: '3 hrs',
        popular: true
      },
      {
        id: 'p14-srv-4',
        name: 'Commercial Kitchen Deep Fryer & Gas Range Servicing',
        category: 'Appliance Repair Specialists',
        description: 'Complete commercial appliance servicing, valve calibration, and burner decarbonization.',
        pricingType: 'quote_required',
        durationEstimate: '1-2 days'
      }
    ],
    rating: 4.8,
    reviewCount: 76,
    completedJobs: 185,
    experienceYears: 8,
    isAvailableNow: true,
    verified: true,
    phone: '+234 803 444 1122',
    email: 'david.olatunji@kazihub.ng',
    earningsTotal: 1380000,
    portfolio: [
      {
        id: 'port-14',
        title: 'Inverter Refrigerator Gas Refill & Compressor Swap',
        category: 'Appliance Repair Specialists',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
        description: 'Diagnosed gas leakage in double-door Samsung fridge, sealed copper pipes, and recharged eco refrigerant.',
        dateCompleted: '2026-07-12'
      }
    ],
    reviews: [
      {
        id: 'rev-14',
        customerId: 'c14',
        customerName: 'Engr. Victor Emeka',
        rating: 5,
        comment: 'Fixed our washing machine drain pump issue in less than an hour. Great technician!',
        date: '2026-07-26'
      }
    ]
  },
  {
    id: 'p15',
    name: 'Dr. Samuel Adeleke',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    category: 'Tutors',
    tagline: 'STEM Home Tutor: Mathematics, Physics & Coding Specialist',
    bio: 'PhD graduate tutor providing personalized home lessons for WAEC, JAMB, IGCSE, and Python/Web development for kids and teens in UI/Agbowo and Bodija.',
    location: 'Oyo State',
    neighborhood: 'UI / Agbowo',
    hourlyRate: 10000,
    pricingType: 'fixed',
    basePrice: 10000,
    services: [
      {
        id: 'p15-srv-1',
        name: 'Single 2-Hour STEM Assessment & Tutoring Session',
        category: 'Tutors',
        description: 'Diagnostic subject test, personalized concept breakdown, and homework review.',
        pricingType: 'fixed',
        price: 10000,
        durationEstimate: '2 hrs',
        popular: true
      },
      {
        id: 'p15-srv-2',
        name: 'Monthly Home Tutoring Package (3x / week)',
        category: 'Tutors',
        description: 'Structured 12-session monthly curriculum in Maths and Physics with weekly progress reports.',
        pricingType: 'starting',
        price: 45000,
        durationEstimate: '1 month'
      },
      {
        id: 'p15-srv-3',
        name: 'Comprehensive WAEC / JAMB / IGCSE Exam Preparation Track',
        category: 'Tutors',
        description: 'Full multi-subject exam coaching with past questions, mock tests, and exam strategy drills.',
        pricingType: 'quote_required',
        durationEstimate: 'Custom'
      }
    ],
    rating: 5.0,
    reviewCount: 68,
    completedJobs: 120,
    experienceYears: 9,
    isAvailableNow: true,
    verified: true,
    phone: '+234 805 999 0011',
    email: 'samuel.adeleke@kazihub.ng',
    earningsTotal: 1500000,
    portfolio: [
      {
        id: 'port-15',
        title: 'JAMB Physics & Further Maths Coaching',
        category: 'Tutors',
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
        description: 'Intensive 8-week STEM revision course resulting in 320+ JAMB scores.',
        dateCompleted: '2026-06-30'
      }
    ],
    reviews: [
      {
        id: 'rev-15',
        customerId: 'c15',
        customerName: 'Mrs. Funke Akande',
        rating: 5,
        comment: 'Dr. Samuel transformed my son’s confidence in Mathematics. Highly recommended home tutor!',
        date: '2026-07-20'
      }
    ]
  },
  {
    id: 'p16',
    name: 'Folake Adegoke',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    category: 'Event Professionals',
    tagline: 'Luxury Event Planner, Decorator & Catering Manager',
    bio: 'Transforming weddings, corporate galas, and birthday celebrations into breathtaking memories with bespoke floral decor, lighting, sound systems, and gourmet catering.',
    location: 'Oyo State',
    neighborhood: 'Bodija GRA',
    hourlyRate: 20000,
    pricingType: 'quote_required',
    basePrice: 35000,
    services: [
      {
        id: 'p16-srv-1',
        name: 'Event Sound System & Wireless Mics (Up to 100 Guests)',
        category: 'Event Professionals',
        description: 'Compact 2-speaker PA system with sound technician and 2 wireless microphones.',
        pricingType: 'fixed',
        price: 35000,
        durationEstimate: '4 hrs'
      },
      {
        id: 'p16-srv-2',
        name: 'Birthday / Anniversary Hall Mood Lighting & Backdrop',
        category: 'Event Professionals',
        description: 'Custom sequin / floral photo backdrop with 8 wireless RGB LED ambient mood uplights.',
        pricingType: 'starting',
        price: 60000,
        durationEstimate: 'Setup + Event'
      },
      {
        id: 'p16-srv-3',
        name: 'Full Grand Wedding Planning & 500-Guest Hall Decor',
        category: 'Event Professionals',
        description: 'Turnkey event planning, grand walkway canopy, crystal chandeliers, centerpiece florals & catering coordination.',
        pricingType: 'quote_required',
        durationEstimate: 'Multi-day',
        popular: true
      }
    ],
    rating: 4.9,
    reviewCount: 92,
    completedJobs: 175,
    experienceYears: 10,
    isAvailableNow: true,
    verified: true,
    phone: '+234 802 111 5544',
    email: 'folake.adegoke@kazihub.ng',
    earningsTotal: 3500000,
    portfolio: [
      {
        id: 'port-16',
        title: '500-Guest Grand Wedding Reception Decor',
        category: 'Event Professionals',
        imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
        description: 'Complete hall decor with ambient LED mood lights, crystal chandeliers, and floral backdrops.',
        dateCompleted: '2026-07-08'
      }
    ],
    reviews: [
      {
        id: 'rev-16',
        customerId: 'c16',
        customerName: 'Chief & Lolo Nnamdi',
        rating: 5,
        comment: 'Folake executed our anniversary event flawlessly! Guests are still talking about the decor.',
        date: '2026-07-16'
      }
    ]
  },
  {
    id: 'p11',
    name: 'Alhaji Rasheed Ironworks',
    avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&auto=format&fit=crop&q=80',
    category: 'Welders',
    tagline: 'Wrought Iron Gates, Burglar Proofing & Steel Roof Trusses',
    bio: 'Precision electric arc and MIG welding craftsman for automated steel gates, security anti-burglary window grilles, and heavy industrial structural steel framing.',
    location: 'Oyo State',
    neighborhood: 'Iseyin',
    hourlyRate: 8500,
    pricingType: 'starting',
    basePrice: 8500,
    services: [
      {
        id: 'p11-srv-1',
        name: 'Gate Hinge Welding & Lock Plate Reinforcement',
        category: 'Welders',
        description: 'Re-align sagging gate posts, reinforce lock box, and weld heavy duty bearing hinges.',
        pricingType: 'fixed',
        price: 8500,
        durationEstimate: '1.5 hrs',
        popular: true
      },
      {
        id: 'p11-srv-2',
        name: 'Burglar Proof Window Grilles (Per Unit)',
        category: 'Welders',
        description: 'Square pipe iron grille welding with anti-corrosion primer coating and wall anchoring bolts.',
        pricingType: 'starting',
        price: 18000,
        durationEstimate: '1 day'
      },
      {
        id: 'p11-srv-3',
        name: 'Automated Electric Sliding Gate Fabrication',
        category: 'Welders',
        description: 'Complete heavy wrought iron gate design, rolling track installation, and rack-and-pinion motor bracket fitting.',
        pricingType: 'quote_required',
        durationEstimate: '1-2 weeks'
      }
    ],
    rating: 4.8,
    reviewCount: 64,
    completedJobs: 155,
    experienceYears: 14,
    isAvailableNow: true,
    verified: true,
    phone: '+234 803 777 2211',
    email: 'rasheed.welders@kazihub.ng',
    earningsTotal: 1890000,
    portfolio: [
      {
        id: 'port-17',
        title: 'Automated Sliding Steel Gate & Intercom Install',
        category: 'Welders',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
        description: 'Heavy duty wrought iron gate with electric remote motor and anti-rust zinc primer coat.',
        dateCompleted: '2026-07-01'
      }
    ],
    reviews: [
      {
        id: 'rev-17',
        customerId: 'c17',
        customerName: 'Alhaji Ganiyu Lawal',
        rating: 5,
        comment: 'Strong, solid welding work. The remote motor sliding gate operates smoothly.',
        date: '2026-07-14'
      }
    ]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-req-1',
    customerId: 'c1',
    customerName: 'Nneka Okonkwo',
    customerPhone: '+234 803 123 4567',
    professionalId: 'p3',
    professionalName: 'Emeka Nwosu',
    category: 'Carpenters',
    selectedService: 'Custom Fitted Kitchen Cabinets & Wardrobes',
    servicePricingType: 'quote_required',
    issueDescription: 'Need custom 6-door floor-to-ceiling acrylic wardrobes with soft-close drawers and mirror panels for master bedroom.',
    problemImageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?w=600&auto=format&fit=crop&q=80',
    problemImages: ['https://images.unsplash.com/photo-1558997519-83ea9252def8?w=600&auto=format&fit=crop&q=80'],
    date: '2026-08-10',
    timeSlot: '10:00 AM - 12:00 PM',
    address: 'Plot 14, Oluyole Industrial Estate, Ibadan, Oyo State',
    landmark: 'Opposite Domino\'s Pizza / Coldstone',
    status: 'awaiting_quote',
    totalPrice: 0,
    createdAt: '2026-08-02T09:15:00Z'
  },
  {
    id: 'b1',
    customerId: 'c1',
    customerName: 'Nneka Okonkwo',
    customerPhone: '+234 803 123 4567',
    professionalId: 'p1',
    professionalName: 'Babatunde "Spark" Adebayo',
    category: 'Electricians',
    selectedService: 'Distribution Board (DB) Breaker Tripping Diagnostic',
    servicePricingType: 'fixed',
    issueDescription: 'Kitchen wall socket sparks and trips the DB box when plugging in the microwave.',
    date: '2026-08-02',
    timeSlot: '10:00 AM - 12:00 PM',
    address: 'MKO Abiola Way, Ring Road, Ibadan, Oyo State',
    status: 'accepted',
    totalPrice: 17000,
    createdAt: '2026-08-01T08:30:00Z'
  },
  {
    id: 'b2',
    customerId: 'c2',
    customerName: 'Segun Oladipo',
    customerPhone: '+234 802 333 4444',
    professionalId: 'p2',
    professionalName: 'Chioma Okonkwo',
    category: 'Plumbers',
    issueDescription: 'Bathroom sink drain is leaking underneath the granite countertop.',
    date: '2026-08-01',
    timeSlot: '02:00 PM - 04:00 PM',
    address: 'Commercial Avenue, Bodija, Ibadan, Oyo State',
    status: 'in-progress',
    totalPrice: 15000,
    createdAt: '2026-07-31T14:20:00Z'
  },
  {
    id: 'b3',
    customerId: 'c1',
    customerName: 'Nneka Okonkwo',
    customerPhone: '+234 803 123 4567',
    professionalId: 'p2',
    professionalName: 'Chioma Okonkwo',
    category: 'Plumbers',
    issueDescription: 'Leaking kitchen mixer tap and water pressure booster pump servicing.',
    date: '2026-07-28',
    timeSlot: '09:00 AM - 11:00 AM',
    address: 'MKO Abiola Way, Ring Road, Ibadan, Oyo State',
    status: 'closed',
    totalPrice: 20000,
    completedAt: '2026-07-28T12:00:00Z',
    createdAt: '2026-07-27T10:00:00Z'
  },
  {
    id: 'b4',
    customerId: 'c1',
    customerName: 'Nneka Okonkwo',
    customerPhone: '+234 803 123 4567',
    professionalId: 'p3',
    professionalName: 'Emeka Nwosu',
    category: 'Carpenters',
    issueDescription: 'Repaired mahogany dining table legs and replaced custom wardrobe hinges.',
    date: '2026-07-20',
    timeSlot: '01:00 PM - 03:00 PM',
    address: 'MKO Abiola Way, Ring Road, Ibadan, Oyo State',
    status: 'closed',
    totalPrice: 35000,
    completedAt: '2026-07-20T16:00:00Z',
    createdAt: '2026-07-19T11:15:00Z'
  },
  {
    id: 'b5',
    customerId: 'c1',
    customerName: 'Nneka Okonkwo',
    customerPhone: '+234 803 123 4567',
    professionalId: 'p1',
    professionalName: 'Engr. Babatunde Lawal',
    category: 'Electricians',
    selectedService: 'Inverter & Solar Installation',
    issueDescription: 'Full 3.5kVA hybrid solar inverter installation with 4 tubular battery rack wiring.',
    date: '2026-08-19',
    timeSlot: '10:00 AM - 02:00 PM',
    address: 'Bodija Estate, Ibadan, Oyo State',
    status: 'completed',
    totalPrice: 48000,
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completionDetails: {
      description: 'Completed hybrid solar inverter installation, calibrated charge controller, and load tested circuit.',
      photos: ['https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80'],
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: '2026-08-18T09:00:00Z'
  },
  {
    id: 'b-ac-1',
    customerId: 'c1',
    customerName: 'Nneka Okonkwo',
    customerPhone: '+234 803 123 4567',
    professionalId: 'p4',
    professionalName: 'Tunde Alabi',
    category: 'AC Technicians',
    selectedService: 'Inverter AC Maintenance & Freon Gas Top-up',
    issueDescription: 'Master bedroom 1.5HP Panasonic split AC is blowing warm air and making a low buzzing noise.',
    date: '2026-08-20',
    timeSlot: '11:00 AM - 01:00 PM',
    address: 'MKO Abiola Way, Ring Road, Ibadan, Oyo State',
    status: 'completion-submitted',
    totalPrice: 18500,
    completionDetails: {
      description: 'Flushed AC condenser coils, sealed micro leak on copper flare joint, vacuumed line, and topped up R410a refrigerant to 65 PSI.',
      photos: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'],
      submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    createdAt: '2026-08-19T14:30:00Z'
  },
  {
    id: 'b-ir-1',
    customerId: 'c1',
    customerName: 'Nneka Okonkwo',
    customerPhone: '+234 803 123 4567',
    professionalId: 'p5',
    professionalName: 'Kafayat Adeleke',
    category: 'Painters',
    selectedService: 'Living Room Wall Painting & Silk Finish',
    issueDescription: 'POP ceiling edge smoothing and silk emulsion painting for living room.',
    date: '2026-08-15',
    timeSlot: '09:00 AM - 03:00 PM',
    address: 'MKO Abiola Way, Ring Road, Ibadan, Oyo State',
    status: 'issue-reported',
    totalPrice: 32000,
    issueDetails: {
      description: 'Uneven paint coat on northern wall and minor paint splatter on dining tile floor.',
      evidencePhotos: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80'],
      reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    createdAt: '2026-08-14T08:00:00Z'
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    bookingId: 'b1',
    senderId: 'c1',
    senderName: 'Nneka Okonkwo',
    senderRole: 'customer',
    recipientId: 'p1',
    message: 'Good morning Engr. Babatunde, are you available tomorrow morning for the DB box issue?',
    timestamp: '2026-08-01T08:35:00Z'
  },
  {
    id: 'm2',
    bookingId: 'b1',
    senderId: 'p1',
    senderName: 'Babatunde "Spark" Adebayo',
    senderRole: 'professional',
    recipientId: 'c1',
    message: 'Good morning Nneka! Yes, I can be at your place in Ring Road, Ibadan by 10 AM. I will bring a digital multimeter and replacement MCB breakers.',
    timestamp: '2026-08-01T08:40:00Z'
  }
];
