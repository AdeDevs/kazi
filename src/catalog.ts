import { Category, ServiceItem } from './types';

/** The 16 trades KaziHub supports (the backend accepts exactly these) and each one's typical services, used by search. */
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
      pricing_type: 'fixed',
      price: 5000,
      duration_estimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-elec-2',
      name: 'Circuit Breaker / DB Box Tripping Diagnosis',
      category: 'Electricians',
      description: 'Systematic electrical line load test, short circuit tracing, and fuse/MCB reset.',
      pricing_type: 'fixed',
      price: 15000,
      duration_estimate: '2-3 hrs',
      popular: true
    },
    {
      id: 'srv-elec-3',
      name: 'Inverter Changeover Switch Installation',
      category: 'Electricians',
      description: 'Standard manual or automated dual-source changeover breaker configuration.',
      pricing_type: 'starting',
      price: 12000,
      duration_estimate: '2 hrs'
    },
    {
      id: 'srv-elec-4',
      name: 'Full Duplex / Office Rewiring Project',
      category: 'Electricians',
      description: 'Complete building conduit conduit piping, cable pulling, trunking, and distribution board setup.',
      pricing_type: 'quote_required',
      duration_estimate: '3-7 days'
    }
  ],
  'Plumbers': [
    {
      id: 'srv-plumb-1',
      name: 'Kitchen / Bathroom Tap & Mixer Replacement',
      category: 'Plumbers',
      description: 'Removal and installation of washbasin taps, shower mixers, or angle valves.',
      pricing_type: 'fixed',
      price: 8000,
      duration_estimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-plumb-2',
      name: 'Toilet Flushing Mechanism & Siphon Repair',
      category: 'Plumbers',
      description: 'Repair of leaking cistern, siphon replacement, and seal ring alignment.',
      pricing_type: 'fixed',
      price: 10000,
      duration_estimate: '1.5 hrs',
      popular: true
    },
    {
      id: 'srv-plumb-3',
      name: 'Burst Pipe Leak Detection & Repair',
      category: 'Plumbers',
      description: 'Acoustic detection and precision repair of hidden wall/underfloor water leakage.',
      pricing_type: 'starting',
      price: 15000,
      duration_estimate: '2-4 hrs'
    },
    {
      id: 'srv-plumb-4',
      name: 'Full Bathroom Overhaul & Overhead Tank Plumbing',
      category: 'Plumbers',
      description: 'Comprehensive piping overhaul, multi-tank installation, and booster pump connection.',
      pricing_type: 'quote_required',
      duration_estimate: '2-4 days'
    }
  ],
  'Carpenters': [
    {
      id: 'srv-carp-1',
      name: 'Door Lock / Handle Fitting & Hinge Alignment',
      category: 'Carpenters',
      description: 'Mortise lock installation, deadbolts, and door frame alignment.',
      pricing_type: 'fixed',
      price: 7500,
      duration_estimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-carp-2',
      name: 'Furniture Repair & Joint Reinforcement',
      category: 'Carpenters',
      description: 'Dining chair restoration, bed frame bracing, and table leg repair.',
      pricing_type: 'starting',
      price: 12000,
      duration_estimate: '2-3 hrs'
    },
    {
      id: 'srv-carp-3',
      name: 'Custom Fitted Kitchen Cabinets & Wardrobes',
      category: 'Carpenters',
      description: 'Tailored acrylic/HDF cabinetry with soft-close runners and custom architectural woodwork.',
      pricing_type: 'quote_required',
      duration_estimate: '1-2 weeks',
      popular: true
    }
  ],
  'AC Technicians': [
    {
      id: 'srv-ac-1',
      name: 'Split AC Deep Chemical Cleaning & Servicing',
      category: 'AC Technicians',
      description: 'Complete indoor and outdoor coil wash, filter sanitization, and drain clearing.',
      pricing_type: 'fixed',
      price: 12000,
      duration_estimate: '1.5 hrs',
      popular: true
    },
    {
      id: 'srv-ac-2',
      name: 'AC Gas Refill (R410a / R22 / R32)',
      category: 'AC Technicians',
      description: 'High-grade refrigerant recharge, pressure gauge check, and valve inspection.',
      pricing_type: 'starting',
      price: 18000,
      duration_estimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-ac-3',
      name: 'New Split / Inverter AC Unit Installation',
      category: 'AC Technicians',
      description: 'Mounting indoor & outdoor units, core drilling, pipe vacuuming, and commissioning.',
      pricing_type: 'starting',
      price: 25000,
      duration_estimate: '2-3 hrs'
    },
    {
      id: 'srv-ac-4',
      name: 'Commercial VRF / Central HVAC System Maintenance',
      category: 'AC Technicians',
      description: 'Multi-zone VRF diagnostic, compressor replacement, and building duct overhaul.',
      pricing_type: 'quote_required',
      duration_estimate: 'Custom'
    }
  ],
  'Appliance Repair Specialists': [
    {
      id: 'srv-app-1',
      name: 'Microwave Oven Heating / Magnetron Repair',
      category: 'Appliance Repair Specialists',
      description: 'High voltage diode, capacitor, or magnetron diagnosis and repair.',
      pricing_type: 'fixed',
      price: 9500,
      duration_estimate: '1-2 hrs',
      popular: true
    },
    {
      id: 'srv-app-2',
      name: 'Washing Machine Pump & Belt Repair',
      category: 'Appliance Repair Specialists',
      description: 'Drain blockage clear, suspension spring, and drive motor diagnostic.',
      pricing_type: 'starting',
      price: 14000,
      duration_estimate: '2 hrs'
    },
    {
      id: 'srv-app-3',
      name: 'Double-Door Refrigerator Compressor Overhaul',
      category: 'Appliance Repair Specialists',
      description: 'Complete inverter compressor swap, condenser flush, and copper welding.',
      pricing_type: 'quote_required',
      duration_estimate: '3-5 hrs'
    }
  ],
  'Mechanics': [
    {
      id: 'srv-mech-1',
      name: 'OBD2 Computer Engine Fault Diagnosis',
      category: 'Mechanics',
      description: 'Electronic diagnostic scan report for engine, gearbox, ABS, and airbag sensors.',
      pricing_type: 'fixed',
      price: 7000,
      duration_estimate: '45 mins',
      popular: true
    },
    {
      id: 'srv-mech-2',
      name: 'Brake Pad Replacement & Rotor Skimming',
      category: 'Mechanics',
      description: 'Front or rear ceramic brake pad fitment and brake fluid bleeding.',
      pricing_type: 'starting',
      price: 10000,
      duration_estimate: '1.5 hrs'
    },
    {
      id: 'srv-mech-3',
      name: 'Engine Overhaul & Transmission Rebuild',
      category: 'Mechanics',
      description: 'Full engine teardown, piston ring replacement, timing chain kit, and calibration.',
      pricing_type: 'quote_required',
      duration_estimate: '3-7 days'
    }
  ],
  'Solar Installers': [
    {
      id: 'srv-sol-1',
      name: 'Solar Panel Array Cleaning & Inspection',
      category: 'Solar Installers',
      description: 'De-ionized chemical wash for up to 10 rooftop panels, MC4 connector testing.',
      pricing_type: 'fixed',
      price: 15000,
      duration_estimate: '2 hrs'
    },
    {
      id: 'srv-sol-2',
      name: 'Inverter & Battery Bank Troubleshooting',
      category: 'Solar Installers',
      description: 'Battery health assessment (Lithium/Tubular), MPPT charge controller calibration.',
      pricing_type: 'starting',
      price: 20000,
      duration_estimate: '2-3 hrs',
      popular: true
    },
    {
      id: 'srv-sol-3',
      name: 'Complete 3kVA - 20kVA Hybrid Solar Inverter System',
      category: 'Solar Installers',
      description: 'Turnkey solar design: Tier-1 panels, LiFePO4 batteries, pure sine wave inverter & surge protection.',
      pricing_type: 'quote_required',
      duration_estimate: '2-5 days',
      popular: true
    }
  ],
  'CCTV Installers': [
    {
      id: 'srv-cctv-1',
      name: 'Standalone IP Camera Setup & Mobile App Sync',
      category: 'CCTV Installers',
      description: 'Single Wi-Fi smart camera mount, micro-SD formatting, and smartphone app remote view.',
      pricing_type: 'fixed',
      price: 8500,
      duration_estimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-cctv-2',
      name: '4-Channel DVR/NVR Home Security Installation',
      category: 'CCTV Installers',
      description: 'Cabling, power supply, 4 indoor/outdoor HD cameras, and router port forwarding.',
      pricing_type: 'starting',
      price: 25000,
      duration_estimate: '4-6 hrs',
      popular: true
    },
    {
      id: 'srv-cctv-3',
      name: 'Commercial Perimeter & Solar CCTV System',
      category: 'CCTV Installers',
      description: 'Solar-powered PTZ cameras, fiber optic backbone, and 24/7 central security room setup.',
      pricing_type: 'quote_required',
      duration_estimate: 'Custom'
    }
  ],
  'Painters': [
    {
      id: 'srv-paint-1',
      name: 'Single Room Accent Wall & Touchup',
      category: 'Painters',
      description: 'Single bedroom or accent wall painting with premium washable silk emulsion.',
      pricing_type: 'fixed',
      price: 15000,
      duration_estimate: '3-4 hrs'
    },
    {
      id: 'srv-paint-2',
      name: 'Full Apartment Interior Painting (2-3 Bedroom)',
      category: 'Painters',
      description: 'Sanding, minor crack filling, undercoat primer, and two finishing coats.',
      pricing_type: 'starting',
      price: 45000,
      duration_estimate: '2-3 days',
      popular: true
    },
    {
      id: 'srv-paint-3',
      name: 'Full Building POP Screeding & Exterior Stucco Decor',
      category: 'Painters',
      description: 'Full duplex POP wall screeding, waterproof exterior emulsion, and textured stucco.',
      pricing_type: 'quote_required',
      duration_estimate: '1-2 weeks'
    }
  ],
  'Welders': [
    {
      id: 'srv-weld-1',
      name: 'Gate Hinge Welding & Lock Plate Reinforcement',
      category: 'Welders',
      description: 'Electric arc welding repair of sagging compound gates and padlock ears.',
      pricing_type: 'fixed',
      price: 8500,
      duration_estimate: '1.5 hrs',
      popular: true
    },
    {
      id: 'srv-weld-2',
      name: 'Burglar Proof Window Grilles (Per Unit)',
      category: 'Welders',
      description: 'Solid wrought iron / square tube burglar proofing with anti-rust primer.',
      pricing_type: 'starting',
      price: 18000,
      duration_estimate: '1 day'
    },
    {
      id: 'srv-weld-3',
      name: 'Automated Electric Sliding Gate Fabrication',
      category: 'Welders',
      description: 'Bespoke architectural wrought iron gate, track laying, remote motor, and intercom.',
      pricing_type: 'quote_required',
      duration_estimate: '1-2 weeks'
    }
  ],
  'Cleaners': [
    {
      id: 'srv-clean-1',
      name: 'Standard 2-Bedroom Apartment Deep Cleaning',
      category: 'Cleaners',
      description: 'Kitchen degreasing, bathroom scrubbing, floor polishing, and window cleaning.',
      pricing_type: 'fixed',
      price: 20000,
      duration_estimate: '3-5 hrs',
      popular: true
    },
    {
      id: 'srv-clean-2',
      name: 'Upholstery & Sofa Steam Extraction',
      category: 'Cleaners',
      description: 'Deep foam shampooing and steam extraction for 5-seater fabric/velvet sofas.',
      pricing_type: 'starting',
      price: 15000,
      duration_estimate: '2 hrs'
    },
    {
      id: 'srv-clean-3',
      name: 'Post-Construction Full Mansion Debris Clearing & Fumigation',
      category: 'Cleaners',
      description: 'Paint stain stripping, industrial floor buffering, and eco-friendly fumigation.',
      pricing_type: 'quote_required',
      duration_estimate: '2-3 days'
    }
  ],
  'Tutors': [
    {
      id: 'srv-tut-1',
      name: 'Single 2-Hour STEM Assessment & Tutoring Session',
      category: 'Tutors',
      description: 'One-on-one intensive tutoring in Mathematics, Physics, or Chemistry.',
      pricing_type: 'fixed',
      price: 10000,
      duration_estimate: '2 hrs',
      popular: true
    },
    {
      id: 'srv-tut-2',
      name: 'Monthly Home Tutoring Package (3x / week)',
      category: 'Tutors',
      description: 'Regular 12-session monthly coaching plan with homework assistance and monthly progress tests.',
      pricing_type: 'starting',
      price: 45000,
      duration_estimate: '1 month'
    },
    {
      id: 'srv-tut-3',
      name: 'Comprehensive WAEC / JAMB / IGCSE Exam Preparation Track',
      category: 'Tutors',
      description: 'Customized multi-subject curriculum, mock examinations, and past question drills.',
      pricing_type: 'quote_required',
      duration_estimate: 'Custom'
    }
  ],
  'Tailors': [
    {
      id: 'srv-tail-1',
      name: 'Trouser & Dress Fitting / Alteration',
      category: 'Tailors',
      description: 'Waist taking-in, length hemming, zip replacement, and sleeve adjustment.',
      pricing_type: 'fixed',
      price: 4000,
      duration_estimate: '1 day',
      popular: true
    },
    {
      id: 'srv-tail-2',
      name: 'Custom 2-Piece Senator / Kaftan Suit Tailoring',
      category: 'Tailors',
      description: 'Bespoke cutting and stitching with premium interfacing and pocket details (fabric provided).',
      pricing_type: 'starting',
      price: 25000,
      duration_estimate: '4-6 days',
      popular: true
    },
    {
      id: 'srv-tail-3',
      name: 'Bespoke Luxury 3-Piece Agbada with Computer Embroidery',
      category: 'Tailors',
      description: 'Full bridal groom or executive Agbada with custom chest embroidery and cap.',
      pricing_type: 'quote_required',
      duration_estimate: '1-2 weeks'
    }
  ],
  'Hair Stylists': [
    {
      id: 'srv-hair-1',
      name: 'Lace Front Wig Revamp & Styling',
      category: 'Hair Stylists',
      description: 'Deep conditioning wash, bleaching knots, customization, and flat iron / curls.',
      pricing_type: 'fixed',
      price: 12000,
      duration_estimate: '2-3 hrs',
      popular: true
    },
    {
      id: 'srv-hair-2',
      name: 'Knotless Box Braids (Home Service)',
      category: 'Hair Stylists',
      description: 'Tension-free clean sectioned knotless braids (Medium/Jumbo length).',
      pricing_type: 'starting',
      price: 15000,
      duration_estimate: '4-6 hrs',
      popular: true
    },
    {
      id: 'srv-hair-3',
      name: 'Full Bridal Entourage Hair Styling Package',
      category: 'Hair Stylists',
      description: 'On-location bride plus 4 bridesmaids luxury hair preparation and touch-up.',
      pricing_type: 'quote_required',
      duration_estimate: 'Full Day'
    }
  ],
  'Photographers': [
    {
      id: 'srv-photo-1',
      name: 'Studio / Outdoor 1-Hour Headshot Session (5 Retouched)',
      category: 'Photographers',
      description: 'Executive portrait session with pro lighting, including 5 high-res edited retouched files.',
      pricing_type: 'fixed',
      price: 25000,
      duration_estimate: '1 hr',
      popular: true
    },
    {
      id: 'srv-photo-2',
      name: 'Birthday / Small Private Party Event Coverage',
      category: 'Photographers',
      description: 'Up to 3 hours event coverage with digital online gallery and 50 color-graded photos.',
      pricing_type: 'starting',
      price: 50000,
      duration_estimate: '3 hrs'
    },
    {
      id: 'srv-photo-3',
      name: 'Full Day Traditional & White Wedding Photo + Drone Video Package',
      category: 'Photographers',
      description: 'Dual shooter coverage, photobook album, cinematic 4K highlight reel, and drone aerial footage.',
      pricing_type: 'quote_required',
      duration_estimate: 'Full Day',
      popular: true
    }
  ],
  'Event Professionals': [
    {
      id: 'srv-event-1',
      name: 'Event Sound System & Wireless Mics (Up to 100 Guests)',
      category: 'Event Professionals',
      description: 'Compact 2-speaker PA system with sound technician and 2 wireless microphones.',
      pricing_type: 'fixed',
      price: 35000,
      duration_estimate: '4 hrs'
    },
    {
      id: 'srv-event-2',
      name: 'Birthday / Anniversary Hall Mood Lighting & Backdrop',
      category: 'Event Professionals',
      description: 'Custom sequin / floral photo backdrop with 8 wireless RGB LED ambient mood uplights.',
      pricing_type: 'starting',
      price: 60000,
      duration_estimate: 'Setup + Event'
    },
    {
      id: 'srv-event-3',
      name: 'Full Grand Wedding Planning & 500-Guest Hall Decor',
      category: 'Event Professionals',
      description: 'Turnkey event planning, grand walkway canopy, crystal chandeliers, centerpiece florals & catering coordination.',
      pricing_type: 'quote_required',
      duration_estimate: 'Multi-day',
      popular: true
    }
  ]
};
