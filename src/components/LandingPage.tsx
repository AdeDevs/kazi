import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TermsAndPrivacyModal } from './ui/TermsAndPrivacyModal';
import { savePendingSearch } from '../lib/pendingSearch';
import { formatCurrency } from '../utils';
import { listFeaturedReviews } from '../lib/reviewsApi';
import { art } from '../assets/landing';
import { Phone, MockQuote, MockNearYou, MockPayment, MockIdCheck, MockNewRequest, MockCheckout, MockWallet, ArtisanScene } from './landing/PhoneMocks';

// The landing page keeps its own palette (from the design canvas, direction E "Ibadan hero,
// illustrated"), separate from the app's theme and independent of dark mode.
const C = {
  orange: '#FF6A2B',
  orangeSoft: '#FF9A6B',
  navy: '#0B1B3A',
  cream: '#FFF6EC',
  indigo: '#3B35C9',
  pink: '#F7B8D2',
  mint: '#9BF0C4',
  yellow: '#FFB020',
  peach: '#FFE3CC',
  muted: '#C9D1DE',
  night: '#0B1238',
  lilac: '#DCD8F4',
};

const CLIENT_SIGNUP = '/signup?role=client';
const ARTISAN_SIGNUP = '/signup?role=artisan';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
// Preloaded from index.html on the landing page; the name is versioned so it can be cached for good.
// Hero art: Ibadan at dusk, one lit house where an electrician fixes the porch lamp. One crop per
// layout, so a phone never downloads the desktop picture. Preloaded from index.html on "/".
// AVIF (about 50 KB each), with WebP for browsers without AVIF. Originals: design/hero/*.png.
const heroArt = (size: 'phone' | 'tablet' | 'desktop', ext: 'avif' | 'webp') => `/landing/hero-dusk-${size}.${ext}`;

const display = "font-['Bricolage_Grotesque',sans-serif] font-extrabold";
const eyebrow = 'text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.08em]';

/** Fades and lifts a block in the first time it scrolls into view. */
function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.intersectionRatio >= threshold)) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold: [0, threshold] });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Where an element's bottom edge sits inside its offset parent, kept current as it resizes. */
function useBottomEdge<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [bottom, setBottom] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setBottom(el.offsetTop + el.offsetHeight);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, bottom };
}

/**
 * A trade's illustration, sat on the card's bottom edge at full width. The drawings have empty
 * space above them (`artTop` is that share of the height), so they may reach up behind the text,
 * but their drawn part never does: the height is capped so the content starts `clearance` px down.
 */
const TradeArt: React.FC<{ src: string; artTop: number; clearance: number; className?: string; style?: React.CSSProperties }> = ({ src, artTop, clearance, className = '', style }) => (
  <img
    src={src}
    alt=""
    className={`absolute left-0 bottom-0 w-full h-auto object-contain object-bottom ${className}`}
    style={{ maxHeight: `calc((100% - ${Math.round(clearance)}px) / ${1 - artTop})`, ...style }}
  />
);

const TRADES = [
  { name: 'Electricians', search: 'Electrician', lower: 'electricians', bg: C.orange, fg: C.navy, spot: 'spot-electrician', img: 'trade-electrician', artTop: 0.34, desc: 'Sparking sockets, new wiring, inverter hook-ups and fault finding.' },
  { name: 'Plumbers', search: 'Plumber', lower: 'plumbers', bg: C.indigo, fg: C.cream, spot: 'spot-plumber', img: 'trade-plumber', artTop: 0.48, desc: 'Leaking taps, blocked drains, water heaters and new fittings.' },
  { name: 'Mechanics', search: 'Mechanic', lower: 'mechanics', bg: C.pink, fg: C.navy, spot: 'spot-mechanic', img: 'trade-mechanic', artTop: 0.48, desc: 'Diagnostics, servicing, brakes and roadside help.' },
  { name: 'Solar installers', search: 'Solar', lower: 'solar installers', bg: C.mint, fg: C.navy, spot: 'spot-solar', img: 'trade-solar', artTop: 0.11, desc: 'Panels, batteries and inverters sized for your home.' },
  { name: 'AC technicians', search: 'AC', lower: 'AC technicians', bg: C.navy, fg: C.cream, spot: 'spot-ac', img: 'trade-ac', artTop: 0.36, desc: 'Installs, gas top-ups, servicing and repairs.' },
];

type Trade = (typeof TRADES)[number];

/** Desktop: the open (widened) trade card's text, with its illustration kept clear of it. */
const TradeOpenDesktop: React.FC<{ t: Trade; onSee: () => void }> = ({ t, onSee }) => {
  const text = useBottomEdge<HTMLDivElement>();
  return (
    <>
      <TradeArt src={art(t.img)} artTop={t.artTop} clearance={text.bottom + 16} className="kh-rise" style={{ animationDuration: '620ms', animationDelay: '180ms' }} />
      <div ref={text.ref} className="kh-fade relative px-6 pt-[22px] lg:px-[30px] lg:pt-[26px] flex flex-col gap-3 lg:gap-3.5" style={{ animationDuration: '420ms', animationDelay: '120ms' }}>
        <div className="flex items-center justify-between">
          <img src={art(t.spot)} alt="" className="w-12 h-12" />
          <button
            type="button"
            onClick={onSee}
            aria-label={`See ${t.lower}`}
            className="kh-turn w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: t.fg, color: t.bg }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
          </button>
        </div>
        <h3 className={`mt-1.5 ${display} text-[44px] lg:text-[clamp(2.5rem,3.6vw,3.25rem)] leading-[0.92] tracking-[-0.05em]`}>{t.name}</h3>
        <p className="max-w-[320px] lg:max-w-[420px] text-base lg:text-[17px] leading-[1.45] font-medium">{t.desc}</p>
      </div>
    </>
  );
};

/** Phones: the open accordion card's description and link, with the illustration kept clear of it. */
const TradeOpenMobile: React.FC<{ t: Trade; onSee: () => void }> = ({ t, onSee }) => {
  const text = useBottomEdge<HTMLDivElement>();
  return (
    <>
      <TradeArt src={art(t.img)} artTop={t.artTop} clearance={text.bottom + 12} className="kh-rise" style={{ animationDuration: '560ms', animationDelay: '160ms' }} />
      <div ref={text.ref} className="kh-fade relative z-10 px-5 flex flex-col items-start gap-2.5" style={{ animationDuration: '400ms', animationDelay: '120ms' }}>
        <p className="text-[15px] leading-[1.45] font-medium">{t.desc}</p>
        <button type="button" onClick={onSee} className="kh-link pb-0.5 text-[15px] font-extrabold cursor-pointer">
          See {t.lower} <Arrow />
        </button>
      </div>
    </>
  );
};


const STEPS = [
  { title: 'Tell us what needs fixing', body: 'Search a trade or describe the problem. We show checked artisans near you.', bg: C.mint, fg: C.navy, screen: MockNewRequest },
  { title: 'Agree a quote', body: 'Chat with the artisan and accept a written price before any work starts.', bg: C.pink, fg: C.navy, screen: null },
  { title: 'Pay into escrow', body: 'Your money goes to KaziHub escrow, not the artisan. It stays there while the job is done.', bg: C.yellow, fg: C.navy, screen: MockCheckout },
  { title: 'Confirm, and they get paid', body: 'Happy with the work? Confirm it and the payment is released to the artisan.', bg: C.indigo, fg: C.cream, screen: MockWallet },
];

const MARQUEE = [
  { text: 'ID-checked artisans', star: C.orange },
  { text: 'Money held in escrow', star: C.mint },
  { text: 'Written quotes before work', star: C.yellow },
  { text: 'You confirm, then they get paid', star: C.orange },
  { text: 'Reviews from paid jobs only', star: C.mint },
  { text: 'Electricians, plumbers, mechanics and more', star: C.yellow },
  { text: 'Made in Ibadan', star: C.orange },
];

const ARTISAN_POINTS = [
  'Job requests from people near you',
  'Send quotes from your phone',
  'Payment secured before you start',
  'Reviews from paid jobs build your name',
];

const FAQS = [
  { q: 'How does escrow work on KaziHub?', a: 'When you book, you pay into KaziHub escrow, not to the artisan. The money stays there while the work is done and is released only when you confirm the job is finished.' },
  { q: 'How are artisans checked?', a: 'Every artisan verifies with a government ID and a live selfie before they get the Verified badge.' },
  { q: 'What if I am not happy with the job?', a: 'Don’t confirm it. Raise it in the app instead, and the payment stays held while KaziHub looks into it with you and the artisan.' },
  { q: 'Can I agree the price before work starts?', a: 'Yes. You chat with the artisan and accept a written quote first. Work starts only after you accept it.' },
  { q: 'When do artisans get paid?', a: 'As soon as the customer confirms the job is done, the payment in escrow is released to the artisan.' },
  { q: 'How do I join as an artisan?', a: 'Sign up, verify your ID and selfie, add your trade and the areas you cover, and you’ll start getting requests from people nearby.' },
];
// SAMPLE reviews, shown only while GET /reviews/featured has none to give (it lists reviews clients
// chose to share, from paid-out jobs). The section labels them as samples; never present them as genuine.
const SAMPLE_REVIEWS = [
  { quote: 'My socket was sparking at night. The electrician came the next morning, sent the quote in chat, and I only released the money after testing every switch.', name: 'Tolu A.', meta: 'Bodija, Ibadan · Electrician job' },
  { quote: 'I have been burnt by plumbers before. This time the money sat in escrow until the leak was actually fixed. Na so e suppose be.', name: 'Chinedu O.', meta: 'Yaba, Lagos · Plumber job' },
  { quote: 'The installer sized the panels for what we actually use, not what he wanted to sell. The quote did not change once.', name: 'Aisha B.', meta: 'Akobo, Ibadan · Solar job' },
];
const REVIEW_CARDS = [
  { bg: C.orange, art: 'review-1' },
  { bg: C.pink, art: 'review-2' },
  { bg: C.mint, art: 'review-3' },
];
// Fanned stack: front, middle, back. Desktop cards are larger, so they fan wider.
const FAN_DESKTOP = ['translate(0px, 0px) rotate(-4deg)', 'translate(86px, 6px) rotate(5deg) scale(0.93)', 'translate(158px, 14px) rotate(13deg) scale(0.86)'];
const FAN_TABLET = ['translate(0px, 0px) rotate(-4deg)', 'translate(46px, 4px) rotate(5deg) scale(0.93)', 'translate(86px, 12px) rotate(13deg) scale(0.86)'];
const FAN_PHONE = ['translate(0px, 0px) rotate(-4deg)', 'translate(62px, 4px) rotate(5deg) scale(0.93)', 'translate(118px, 12px) rotate(13deg) scale(0.86)'];

const FAQ_VERIFIED = 1;
const FAQ_PAID = 4;

const Arrow = () => <span className="kh-arrow" aria-hidden="true">→</span>;

const Star: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="-14 -14 28 28" aria-hidden="true" className="shrink-0">
    <path d="M 0 -14 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 z" fill={color} />
  </svg>
);

const Check: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <circle cx="12" cy="12" r="11" fill={C.mint} stroke={C.navy} strokeWidth="2" />
    <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={C.navy} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" /><path d="M5 12h14" />
  </svg>
);

const Swoosh: React.FC<{ d: string; color: string; width: number; className: string; viewBox: string }> = ({ d, color, width, className, viewBox }) => (
  <svg viewBox={viewBox} fill="none" aria-hidden="true" className={`absolute pointer-events-none ${className}`}>
    <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" />
  </svg>
);

/** The dusk illustration under the hero. Fades in once downloaded rather than popping in on a slow connection. */
const HeroArt: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // A cached copy can finish before React attaches onLoad, so `complete` is checked on mount too.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <div
      // Top-anchored like the board: the art's top edge is the hero colour, so it melts in. Past
      // 1920px it stops growing and fades out at the sides instead of turning the hero into a wall.
      className="kh-rise kh-hero-art relative w-full max-w-[1920px] mx-auto overflow-hidden -mt-[96px] aspect-[390/403] min-[600px]:aspect-[768/498] md:-mt-[300px] lg:-mt-[290px] lg:aspect-[1440/720]"
      style={{ animationDuration: '1100ms', animationDelay: '300ms' }}
    >
      <picture>
        <source media="(min-width: 1024px)" type="image/avif" srcSet={heroArt('desktop', 'avif')} />
        <source media="(min-width: 1024px)" type="image/webp" srcSet={heroArt('desktop', 'webp')} />
        {/* The tablet crop from 600px: the tall phone crop gets too big on large phones. */}
        <source media="(min-width: 600px)" type="image/avif" srcSet={heroArt('tablet', 'avif')} />
        <source media="(min-width: 600px)" type="image/webp" srcSet={heroArt('tablet', 'webp')} />
        <source type="image/avif" srcSet={heroArt('phone', 'avif')} />
        <img
          ref={imgRef}
          src={heroArt('phone', 'webp')}
          alt="Dusk in Ibadan: the street is dark except one house, where an electrician on a ladder fixes the porch lamp. Ibadan landmarks stand behind."
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-out motion-reduce:transition-none"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </picture>
      {/* Fades the hero blue into the art's sky, so the text sits on one continuous night. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[42%] pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${C.night} 0%, ${C.night}E6 25%, ${C.night}80 55%, ${C.night}00 100%)` }}
      />
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // Tablets (768px up) get their own layout: wider grids and the desktop's expanding trade cards.
  const isTablet = useMediaQuery('(min-width: 768px)');
  const [query, setQuery] = useState('');
  const [openTrade, setOpenTrade] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [review, setReview] = useState(0);
  const [realReviews, setRealReviews] = useState<typeof SAMPLE_REVIEWS | null>(null);
  useEffect(() => {
    let cancelled = false;
    listFeaturedReviews(6)
      .then((list) => {
        const usable = list
          .filter((r) => r.comment?.trim())
          .map((r) => ({
            quote: r.comment!.trim(),
            name: r.client_first_name,
            meta: [r.client_area, r.category && `${r.category} job`].filter(Boolean).join(' · '),
          }));
        if (!cancelled && usable.length) {
          setRealReviews(usable);
          setReview(0);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const reviews = realReviews ?? SAMPLE_REVIEWS;
  const reviewsLabel = realReviews ? 'What customers say' : 'Sample reviews';
  const [menuOpen, setMenuOpen] = useState(false);
  const [legal, setLegal] = useState<null | 'terms' | 'escrow' | 'privacy'>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const why = useInView<HTMLElement>(0.2);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [menuOpen]);

  // The directory needs an account, so the search is carried through sign-up (lib/pendingSearch)
  // and the new client lands on the artisan search with it filled in.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    savePendingSearch(query);
    navigate(CLIENT_SIGNUP);
  };
  const seeTrade = (search: string) => {
    savePendingSearch(search);
    navigate(CLIENT_SIGNUP);
  };

  const reveal = (i: number): React.CSSProperties => ({
    opacity: why.inView ? 1 : 0,
    transform: why.inView ? 'none' : 'translateY(40px)',
    transition: `opacity 600ms ease ${i * 90}ms, transform 800ms ${EASE} ${i * 90}ms`,
  });

  const sections = [
    { href: '#how', label: 'How it works' },
    { href: '#trades', label: 'Trades' },
    { href: '#clients', label: 'For clients' },
    { href: '#artisans', label: 'For artisans' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="kh-landing min-h-dvh overflow-x-clip font-['Plus_Jakarta_Sans',system-ui,sans-serif]" style={{ background: C.cream, color: C.navy }}>
      {/* ───────── Hero: Ibadan at dusk ───────── */}
      <section className="kh-dark relative overflow-hidden flex flex-col" style={{ background: C.night, color: C.cream }}>
        <div className="relative z-10 px-5 md:px-10 lg:px-[72px] flex flex-col items-center gap-5 md:gap-0 md:h-[568px] lg:h-[535px] max-w-[1440px] mx-auto w-full box-border">
          <header ref={menuRef} className="kh-fade relative z-30 self-stretch h-16 md:h-[84px] flex items-center justify-between">
            <Link to="/" aria-label="KaziHub home" className={`${display} text-[24px] md:text-[28px] tracking-[-0.04em]`}>KaziHub</Link>
            <nav aria-label="Sections" className="hidden lg:flex gap-7 text-[15px] font-bold">
              {sections.map(s => <a key={s.href} href={s.href} className="kh-link">{s.label}</a>)}
            </nav>
            <div className="flex items-center gap-2 lg:gap-3">
              <Link to="/signin" className="kh-link hidden md:inline mx-3 py-1 text-[15px] md:text-base lg:text-[15px] font-extrabold">Sign in</Link>
              <Link to={CLIENT_SIGNUP} className="kh-btn kh-btn-orange px-4 md:px-[22px] lg:px-5 py-2.5 md:py-3.5 lg:py-3 rounded-xl md:rounded-[14px] lg:rounded-xl text-sm md:text-[15px] font-extrabold">
                Get started
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="kh-menu"
                className="kh-menu-btn kh-menu-btn-light lg:hidden w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-[14px] border-2 flex items-center justify-center cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  {menuOpen
                    ? <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>
                    : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
                </svg>
              </button>
            </div>
            {menuOpen && (
              <nav
                id="kh-menu"
                aria-label="Sections"
                className="kh-fade lg:hidden absolute right-0 top-[62px] md:top-[74px] z-20 w-56 rounded-[18px] border-2 p-2 flex flex-col text-base font-bold"
                style={{ background: C.cream, borderColor: C.navy, color: C.navy, animationDuration: '180ms' }}
              >
                {sections.map(s => (
                  <a key={s.href} href={s.href} onClick={() => setMenuOpen(false)} className="kh-menu-item px-3 py-3 rounded-xl">{s.label}</a>
                ))}
                <Link to="/signin" className="kh-menu-item px-3 py-3 rounded-xl font-extrabold">Sign in</Link>
              </nav>
            )}
          </header>

          <h1 className={`kh-rise mt-3 md:mt-6 lg:mt-7 text-center ${display} text-[48px] md:text-[76px] lg:text-[88px] leading-[0.92] md:leading-[0.88] tracking-[-0.055em]`} style={{ animationDelay: '60ms' }}>
            Light don off?<br />Get person<br className="md:hidden" /> wey sabi.
          </h1>
          <p className="kh-rise md:mt-5 md:mb-7 max-w-[330px] md:max-w-[540px] lg:max-w-[600px] text-center text-[15px] md:text-[19px] leading-normal font-semibold" style={{ animationDelay: '160ms', color: C.lilac }}>
            ID-verified artisans near you. Your money stays in escrow until the job is done, and you say so.
          </p>

          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Find an artisan"
            className="kh-rise kh-search self-stretch md:self-auto md:w-[620px] lg:w-[720px] h-[58px] md:h-[72px] lg:h-[68px] box-border flex items-center gap-2.5 md:gap-3.5 lg:gap-3 py-[5px] md:py-2 lg:py-1.5 pr-[5px] md:pr-2 lg:pr-1.5 pl-4 md:pl-[26px] lg:pl-6 bg-white rounded-full"
            style={{ animationDelay: '260ms' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <label className="flex-1 min-w-0 flex items-center">
              <span className="sr-only">What needs fixing?</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 80))}
                enterKeyHint="search"
                placeholder={isTablet ? 'What needs fixing? e.g. a leaking tap' : 'What needs fixing?'}
                className="w-full bg-transparent outline-none text-base md:text-lg lg:text-[17px] font-medium placeholder:text-[#5A6478]"
                style={{ color: C.navy }}
              />
            </label>
            <button
              type="submit"
              aria-label="Find artisans"
              className="kh-btn shrink-0 w-12 md:w-auto h-12 md:h-14 md:px-[26px] lg:px-7 rounded-full flex items-center justify-center text-[17px] md:text-lg lg:text-[17px] font-extrabold cursor-pointer"
            >
              <span className="hidden md:inline">Find artisans</span>
              <span className="kh-arrow md:hidden flex">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                </svg>
              </span>
            </button>
          </form>
        </div>

        <HeroArt />
      </section>

      {/* ───────── Marquee ───────── */}
      <section aria-label="KaziHub at a glance" className="kh-marquee-wrap h-[52px] md:h-[58px] lg:h-16 overflow-hidden flex items-center" style={{ background: C.navy, color: C.cream }}>
        <div className={`kh-marquee flex w-max ${display} text-[15px] md:text-[17px] lg:text-[19px] tracking-[-0.02em]`}>
          {[0, 1].map(copy => (
            <div key={copy} aria-hidden={copy === 1 || undefined} className="flex">
              {MARQUEE.map(m => (
                <span key={m.text} className="inline-flex items-center gap-5 lg:gap-7 pr-5 lg:pr-7 whitespace-nowrap">
                  {m.text}<Star color={m.star} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto">
        {/* ───────── Mosaic: each promise shown on an app screen ─────────
            Phones: Quotes and Paid span the width, Near you and ID check side by side.
            Tablets: an even 2x2 (Quotes, Near you / Paid, ID check), phones centred under the text.
            Desktop: the design's 12-column arrangement. */}
        <section aria-label="Why KaziHub" className="px-5 md:px-10 lg:px-[72px] pt-10 md:pt-[72px] lg:pt-20 grid grid-cols-2 md:grid-rows-[444px_444px] lg:grid-cols-12 lg:grid-rows-2 gap-2.5 md:gap-4 lg:gap-3.5 lg:h-[600px]">
          <div className="kh-rise relative overflow-hidden col-span-2 h-[196px] md:h-auto md:col-span-1 lg:col-span-5 lg:row-span-2 rounded-[22px] md:rounded-[26px] lg:rounded-[28px]" style={{ background: C.pink, animationDelay: '360ms' }}>
            <div className="relative z-10 max-w-[132px] md:max-w-none px-[18px] md:px-[26px] lg:px-[30px] pt-[18px] md:pt-[26px] flex flex-col items-start gap-2 md:gap-2.5">
              <h3 className={`${display} text-[23px] md:text-[34px] leading-[0.95] tracking-[-0.04em]`}>Quotes before work</h3>
              <p className="text-[13px] md:text-base leading-snug md:leading-[1.45] font-semibold md:font-medium md:max-w-[280px] lg:max-w-[360px]">
                <span className="md:hidden">Agree a written quote with the artisan before any work starts.</span>
                <span className="hidden md:inline">Chat with the artisan and agree a written quote before any work starts.</span>
              </p>
            </div>
            <Phone w={300} h={560} scale={0.5} className="md:hidden absolute right-3.5 top-4"><MockQuote /></Phone>
            <Phone w={300} h={450} scale={0.86} className="hidden md:block lg:hidden absolute left-1/2 -translate-x-1/2 top-[176px]"><MockQuote /></Phone>
            <Phone w={300} h={450} scale={0.87} className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[162px]"><MockQuote /></Phone>
          </div>
          <div className="kh-rise relative overflow-hidden h-[230px] md:h-auto lg:col-span-4 rounded-[22px] md:rounded-[26px] lg:rounded-[28px]" style={{ background: C.mint, animationDelay: '430ms' }}>
            <div className="relative z-10 px-4 md:px-[26px] lg:px-[30px] pt-4 md:pt-[26px] flex flex-col items-start gap-2 md:gap-2.5">
              <h3 className={`${display} text-[20px] md:text-[34px] lg:text-[26px] leading-[0.95] tracking-[-0.04em] lg:max-w-[150px]`}>People near you</h3>
              <p className="text-[13px] md:text-base leading-snug md:leading-[1.45] font-semibold md:font-medium md:max-w-[280px] lg:max-w-[150px]">
                <span className="md:hidden">Verified artisans close by, so help comes fast.</span>
                <span className="hidden md:inline">Verified artisans in your area, so help arrives fast.</span>
              </p>
            </div>
            <Phone w={280} h={450} scale={0.46} className="md:hidden absolute left-1/2 -translate-x-1/2 top-[124px]"><MockNearYou /></Phone>
            <Phone w={286} h={440} scale={0.83} className="hidden md:block lg:hidden absolute left-1/2 -translate-x-1/2 top-[176px]"><MockNearYou /></Phone>
            <Phone w={286} h={440} scale={0.61} className="hidden lg:block absolute right-3.5 top-[22px]"><MockNearYou /></Phone>
          </div>
          <div className="kh-rise relative overflow-hidden h-[230px] md:h-auto md:col-start-2 md:row-start-2 lg:col-start-6 lg:col-span-4 lg:row-start-2 rounded-[22px] md:rounded-[26px] lg:rounded-[28px]" style={{ background: C.indigo, color: C.cream, animationDelay: '500ms' }}>
            <div className="relative z-10 px-4 md:px-[26px] lg:px-[30px] pt-4 md:pt-[26px] flex flex-col items-start gap-2 md:gap-2.5">
              <h3 className={`${display} text-[20px] md:text-[34px] lg:text-[26px] leading-[0.95] tracking-[-0.04em] lg:max-w-[180px]`}>Every artisan checked</h3>
              <p className="text-[13px] md:text-base lg:text-[15px] leading-snug md:leading-[1.45] font-semibold md:font-medium md:max-w-[280px] lg:max-w-[170px]">
                <span className="md:hidden">Government ID and a live selfie, before any job.</span>
                <span className="hidden md:inline">Government ID and a live selfie before the Verified badge.</span>
              </p>
            </div>
            <Phone w={220} h={340} scale={0.5} className="md:hidden absolute left-1/2 -translate-x-1/2 top-[124px]"><MockIdCheck /></Phone>
            <Phone w={180} h={320} scale={1.3} className="hidden md:block lg:hidden absolute left-1/2 -translate-x-1/2 top-[176px]"><MockIdCheck /></Phone>
            <Phone w={180} h={320} scale={0.87} className="hidden lg:block absolute right-5 top-[22px]"><MockIdCheck /></Phone>
          </div>
          <div className="kh-rise relative overflow-hidden col-span-2 h-[196px] md:h-auto md:col-span-1 md:col-start-1 md:row-start-2 lg:col-start-10 lg:col-span-3 lg:row-start-1 lg:row-span-2 rounded-[22px] md:rounded-[26px] lg:rounded-[28px]" style={{ background: C.yellow, animationDelay: '570ms' }}>
            <div className="relative z-10 max-w-[132px] md:max-w-none ml-auto md:ml-0 px-[18px] md:px-[26px] lg:px-[30px] pt-[18px] md:pt-[26px] flex flex-col items-start gap-2 md:gap-2.5">
              <h3 className={`${display} text-[23px] md:text-[34px] leading-[0.95] tracking-[-0.04em]`}>Paid when done</h3>
              <p className="text-[13px] md:text-base leading-snug md:leading-[1.45] font-semibold md:font-medium md:max-w-[280px] lg:max-w-none">Your money waits in escrow and moves only when you confirm.</p>
            </div>
            <Phone w={280} h={560} scale={0.5} className="md:hidden absolute left-3.5 top-4"><MockPayment /></Phone>
            <Phone w={272} h={450} scale={0.95} className="hidden md:block lg:hidden absolute left-1/2 -translate-x-1/2 top-[176px]"><MockPayment /></Phone>
            <Phone w={272} h={450} scale={0.87} className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[202px]"><MockPayment /></Phone>
          </div>
        </section>

        {/* ───────── How it works ───────── */}
        <section id="how" className="scroll-mt-4 pt-14 md:pt-[88px] lg:pt-[104px] md:px-10 lg:px-[72px] flex flex-col gap-5 md:gap-8 lg:gap-11">
          <div className="px-5 md:px-0 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 md:gap-4 lg:gap-10">
            <div className="flex flex-col gap-3 md:gap-4">
              <p className={eyebrow}>How it works</p>
              <h2 className={`${display} text-[40px] md:text-[56px] lg:text-[60px] leading-[0.92] tracking-[-0.055em]`}>Book it. We hold the money.<br className="hidden lg:block" /> You say when it’s done.</h2>
            </div>
            <p className="lg:mb-1.5 md:max-w-[480px] lg:max-w-[340px] text-[15px] md:text-lg lg:text-[17px] leading-normal font-medium">
              Four steps, and your money is protected at every one<span className="hidden md:inline"> of them</span>.<span className="md:hidden"> Swipe through.</span>
            </p>
          </div>
          <ol className="kh-snap flex md:grid md:grid-cols-2 md:grid-rows-[470px_470px] lg:grid-cols-4 lg:grid-rows-1 gap-2.5 md:gap-4 px-5 md:px-0 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-pl-5 lg:h-[410px]">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="kh-rise relative overflow-hidden shrink-0 basis-[256px] md:basis-auto h-[384px] md:h-auto snap-start rounded-[22px] md:rounded-[26px]"
                style={{ background: s.bg, color: s.fg, animationDelay: `${200 + i * 90}ms` }}
              >
                <div className="relative z-10 px-5 md:px-[26px] pt-5 md:pt-[26px] flex flex-col items-start gap-2.5 md:gap-3">
                  <span className="px-[11px] md:px-3 py-[5px] md:py-1.5 rounded-full text-xs md:text-[13px] font-extrabold tracking-[0.04em]" style={{ background: s.fg, color: s.bg === C.indigo ? C.navy : C.cream }}>
                    Step {i + 1}<span className="md:hidden"> of 4</span>
                  </span>
                  <h3 className={`mt-0.5 md:mt-1 ${display} text-[24px] md:text-[30px] lg:text-[26px] leading-[0.98] tracking-[-0.04em]`}>{s.title}</h3>
                  <p className="text-sm md:text-base lg:text-[15px] leading-[1.45] font-medium">{s.body}</p>
                </div>
                {s.screen ? (
                  <>
                    <Phone w={270} h={440} scale={0.63} className="md:hidden absolute left-1/2 -translate-x-1/2 top-[190px]"><s.screen /></Phone>
                    <Phone w={270} h={440} scale={0.82} className="hidden md:block lg:hidden absolute left-1/2 -translate-x-1/2 top-[236px]"><s.screen /></Phone>
                    <Phone w={270} h={440} scale={0.72} className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[206px]"><s.screen /></Phone>
                  </>
                ) : (
                  <img src={art('step-2')} alt="An artisan sits on his toolbox and sends the quote from his phone" className="absolute left-0 -bottom-2 w-full h-auto" />
                )}
              </li>
            ))}
            <li aria-hidden="true" className="md:hidden shrink-0 basis-2.5" />
          </ol>
        </section>

        {/* ───────── Trades: expanding cards (desktop) / accordion (phone) ───────── */}
        <section id="trades" className="scroll-mt-4 px-5 md:px-10 lg:px-[72px] pt-14 md:pt-[88px] lg:pt-[92px] flex flex-col gap-5 md:gap-7 lg:gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-6 lg:gap-10">
            <h2 className={`${display} text-[44px] md:text-[56px] lg:text-[72px] leading-[0.9] tracking-[-0.055em]`}>The trades people<br className="hidden md:block" /> book most.</h2>
            <Link to={CLIENT_SIGNUP} className="kh-link shrink-0 pb-0.5 text-[15px] md:text-[17px] font-extrabold">See all trades <Arrow /></Link>
          </div>
          <ul className="flex flex-col md:flex-row gap-2.5 lg:gap-3 md:h-[580px] lg:h-[520px]">
            {TRADES.map((t, i) => {
              const open = i === openTrade;
              return (
                <li
                  key={t.name}
                  onMouseEnter={isTablet ? () => setOpenTrade(i) : undefined}
                  className="relative box-border overflow-hidden rounded-[22px] md:rounded-[24px] lg:rounded-[26px] min-w-0"
                  style={{
                    background: t.bg,
                    color: t.fg,
                    ...(isTablet
                      ? { flexGrow: open ? (isDesktop ? 3.8 : 5.4) : 1, flexBasis: 0, transition: `flex-grow 620ms ${EASE}` }
                      : { height: open ? 380 : 68, transition: `height 520ms ${EASE}` }),
                  }}
                >
                  {isTablet ? (
                    open ? (
                      <TradeOpenDesktop t={t} onSee={() => seeTrade(t.search)} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenTrade(i)}
                        onFocus={() => setOpenTrade(i)}
                        aria-expanded="false"
                        aria-label={t.name}
                        className="absolute inset-0 w-full box-border px-4 py-5 lg:px-[22px] lg:py-6 flex flex-col justify-end items-start text-left cursor-pointer"
                      >
                        <span className={`[writing-mode:vertical-rl] rotate-180 ${display} text-[34px] lg:text-[40px] leading-[0.95] tracking-[-0.04em] whitespace-nowrap`}>{t.name}</span>
                      </button>
                    )
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenTrade(open ? -1 : i)}
                        aria-expanded={open}
                        className="relative z-10 w-full h-[68px] box-border pl-5 pr-3 flex items-center gap-3 text-left cursor-pointer"
                      >
                        <span className={`flex-1 ${display} text-[25px] leading-none tracking-[-0.04em]`}>{t.name}</span>
                        <span
                          aria-hidden="true"
                          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: t.fg, color: t.bg, transform: `rotate(${open ? 45 : 0}deg)`, transition: `transform 460ms ${EASE}` }}
                        >
                          <PlusIcon size={16} />
                        </span>
                      </button>
                      {open && <TradeOpenMobile t={t} onSee={() => seeTrade(t.search)} />}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* ───────── For clients: tiles rise in on first view ───────── */}
        <section id="clients" ref={why.ref} className="scroll-mt-4 px-5 md:px-10 lg:px-[72px] pt-14 md:pt-20 lg:pt-24 grid grid-cols-2 md:grid-cols-12 md:grid-rows-3 lg:grid-rows-[auto_1fr_1fr] gap-2.5 md:gap-3 md:h-[838px] lg:h-[780px]">
          <div className="col-span-2 md:col-span-5 rounded-[22px] md:rounded-[24px] lg:rounded-[26px] bg-white border-2 p-[22px] md:p-6 lg:p-[30px] flex flex-col justify-between items-start gap-4" style={{ borderColor: C.navy, ...reveal(0) }}>
            <div className="flex flex-col gap-3 lg:gap-3">
              <p className={eyebrow}>For clients</p>
              <h2 className={`${display} text-[40px] lg:text-[48px] leading-[0.92] tracking-[-0.05em]`}>Hire without the wahala.</h2>
            </div>
            <Link to={CLIENT_SIGNUP} className="kh-btn px-5 lg:px-6 py-3.5 lg:py-4 rounded-[14px] text-[15px] md:text-base font-extrabold">
              Find an artisan <Arrow />
            </Link>
          </div>
          <div className="relative overflow-hidden h-[156px] md:h-auto md:col-span-7 rounded-[22px] md:rounded-[24px] lg:rounded-[26px] p-[18px] md:p-6 lg:p-[30px] flex flex-col justify-between" style={{ background: C.indigo, color: C.cream, ...reveal(1) }}>
            <Swoosh viewBox="0 0 150 130" d="M20 20 C 20 120, 120 120, 120 20" color={C.mint} width={26} className="md:hidden w-[150px] -right-20 -bottom-[70px]" />
            <Swoosh viewBox="0 0 420 300" d="M60 40 C 60 260, 250 260, 250 110 S 400 -20, 400 200" color={C.mint} width={56} className="hidden md:block w-[300px] lg:w-[420px] -right-[110px] lg:-right-[150px] -top-[50px] lg:-top-[70px]" />
            <span className={`relative ${display} text-[40px] md:text-[68px] lg:text-[84px] leading-[0.86] md:leading-[0.8] tracking-[-0.06em]`}>2<br className="md:hidden" /> checks</span>
            <span className="relative text-[13px] md:text-[15px] lg:text-base font-semibold leading-snug md:max-w-[250px] lg:max-w-[340px]">
              <span className="md:hidden">Government ID and a live selfie</span>
              <span className="hidden md:inline">A government ID and a live selfie, before any artisan gets the Verified badge.</span>
            </span>
          </div>
          <div className="h-[156px] md:h-auto md:col-span-6 rounded-[22px] md:rounded-[24px] lg:rounded-[26px] p-[18px] md:p-6 lg:p-[30px] flex flex-col justify-between bg-[#F7B8D2] md:bg-[#FF6A2B]" style={reveal(2)}>
            <span className={`${display} text-[56px] md:text-[88px] lg:text-[100px] leading-[0.8] tracking-[-0.06em]`}>₦0</span>
            <span className="text-[13px] md:text-[15px] lg:text-base font-bold leading-snug md:max-w-[260px] lg:max-w-[380px]">
              <span className="md:hidden">to the artisan until you confirm</span>
              <span className="hidden md:inline">reaches the artisan until you confirm the job is done. It waits in escrow.</span>
            </span>
          </div>
          <div className="relative overflow-hidden col-span-2 md:col-span-6 h-[156px] md:h-auto rounded-[22px] md:rounded-[24px] lg:rounded-[26px] p-5 md:p-6 lg:p-[30px] flex flex-col justify-between bg-[#FF6A2B] md:bg-[#F7B8D2]" style={reveal(3)}>
            <Swoosh viewBox="0 0 200 170" d="M30 160 C 30 40, 170 40, 170 150" color={C.orangeSoft} width={40} className="md:hidden w-[200px] -right-[30px] -bottom-[60px]" />
            <span className={`relative ${display} text-[52px] md:text-[60px] lg:text-[88px] leading-[0.8] tracking-[-0.06em]`}>Quote first</span>
            <span className="relative text-sm md:text-[15px] lg:text-base font-bold max-w-[260px] lg:max-w-[380px]">
              The price is agreed in writing<span className="hidden md:inline">, in chat,</span> before anyone picks up a tool.
            </span>
          </div>
          <div className="relative overflow-hidden hidden md:flex md:col-span-7 rounded-[24px] lg:rounded-[26px] p-6 lg:p-[30px] items-center justify-center" style={{ background: C.mint, ...reveal(4) }}>
            <Swoosh viewBox="0 0 260 260" d="M30 30 C 30 200, 200 230, 230 60" color={C.indigo} width={50} className="w-[200px] lg:w-[260px] -left-[60px] -bottom-20" />
            <p className={`relative text-center ${display} text-[28px] lg:text-[38px] leading-none tracking-[-0.04em]`}>Checked pros, clear quotes,<br />and a record of every job</p>
          </div>
          <div className="relative overflow-hidden col-span-2 md:col-span-5 rounded-[22px] md:rounded-[24px] lg:rounded-[26px] p-[22px] md:p-6 lg:p-[30px] flex flex-col justify-between gap-3" style={{ background: C.navy, color: C.cream, ...reveal(5) }}>
            <Swoosh viewBox="0 0 220 240" d="M190 20 C 40 20, 40 220, 190 220" color={C.orange} width={48} className="hidden md:block w-[180px] lg:w-[220px] -right-[50px] -top-10" />
            <span className={`relative ${display} text-[30px] lg:text-[38px] leading-[0.95] tracking-[-0.04em]`}>Reviews from<br className="hidden md:block" /> real jobs only</span>
            <span className="relative text-sm leading-relaxed md:hidden" style={{ color: C.muted }}>Only after a paid, completed booking. No friends, no fakes.</span>
            <ul className="relative hidden md:block pl-[18px] list-disc text-sm leading-[1.7]" style={{ color: C.muted }}>
              <li>Only after a paid, completed booking</li>
              <li>No friends, no fakes</li>
            </ul>
          </div>
        </section>

        {/* ───────── For artisans ───────── */}
        <section id="artisans" className="scroll-mt-4 mx-5 md:mx-10 lg:mx-[72px] mt-14 md:mt-[88px] lg:mt-24 rounded-[28px] lg:rounded-[32px] overflow-hidden flex flex-col md:grid md:grid-cols-12 gap-5 md:gap-4 lg:gap-6 px-[22px] pt-[26px] pb-[22px] md:p-0 md:h-[600px] lg:h-[560px]" style={{ background: C.peach }}>
          <div className="contents md:flex md:col-span-7 md:p-9 lg:p-12 md:pr-0 lg:pr-0 md:flex-col md:justify-between md:items-start">
            <div className="flex flex-col gap-3 md:gap-4">
              <p className={eyebrow}>For artisans</p>
              <h2 className={`${display} text-[40px] md:text-[48px] lg:text-[64px] leading-[0.9] tracking-[-0.055em]`}>You do the work. The money don already land.</h2>
            </div>
            <div className="md:hidden h-[300px] rounded-[20px] overflow-hidden flex items-end justify-center" style={{ background: C.indigo }}>
              <ArtisanScene scale={0.57} />
            </div>
            <ul className="flex flex-col lg:grid lg:grid-cols-2 gap-3 md:gap-3.5 lg:gap-x-7 lg:gap-y-4 lg:self-stretch">
              {ARTISAN_POINTS.map(p => (
                <li key={p} className="flex items-center gap-2.5 md:gap-3 text-[15px] md:text-base font-bold leading-tight">
                  <span className="md:hidden"><Check size={24} /></span>
                  <span className="hidden md:inline"><Check size={28} /></span>
                  {p}
                </li>
              ))}
            </ul>
            <Link to={ARTISAN_SIGNUP} className="kh-btn text-center p-[17px] md:px-6 md:py-[18px] rounded-2xl text-base md:text-[17px] lg:text-base font-extrabold">
              Join as an artisan <Arrow />
            </Link>
          </div>
          <div className="hidden md:flex md:col-start-8 md:col-span-5 lg:col-start-9 lg:col-span-4 my-4 mr-4 lg:my-5 lg:mr-5 rounded-[22px] lg:rounded-3xl overflow-hidden items-end justify-center" style={{ background: C.indigo }}>
            <ArtisanScene scale={0.82} className="lg:hidden" />
            <ArtisanScene scale={0.98} className="hidden lg:block" />
          </div>
        </section>

        {/* ───────── Reviews: fanned illustrated cards + quote (real shared reviews, or labelled samples) ───────── */}
        <section aria-label="Customer reviews" className="px-5 md:px-10 lg:px-[72px] pt-14 md:pt-[88px] lg:pt-24">
          <div className="rounded-[28px] lg:rounded-[32px] overflow-hidden flex flex-col md:grid md:grid-cols-12 gap-[22px] md:gap-4 lg:gap-6 px-[22px] pt-[26px] pb-[22px] md:px-9 md:py-10 lg:px-14 lg:py-12 md:h-[420px] lg:h-[410px]" style={{ background: C.navy, color: C.cream }}>
            <p className={`md:hidden ${eyebrow}`} style={{ color: C.mint }}>{reviewsLabel}</p>
            <div className="relative h-[240px] md:h-auto md:col-span-6 lg:col-span-5" aria-hidden="true">
              {REVIEW_CARDS.map((c, i) => {
                const pos = (i - (review % 3) + 3) % 3;
                return (
                  <div
                    key={c.art}
                    className="absolute left-1.5 top-2 md:left-0 md:top-[30px] lg:top-1 w-[180px] h-[220px] md:w-[190px] md:h-[232px] lg:w-[240px] lg:h-[295px] rounded-[20px] lg:rounded-3xl overflow-hidden motion-reduce:transition-none"
                    style={{
                      background: c.bg,
                      zIndex: 3 - pos,
                      transform: (isDesktop ? FAN_DESKTOP : isTablet ? FAN_TABLET : FAN_PHONE)[pos],
                      transformOrigin: '30% 100%',
                      transition: `transform 640ms ${EASE}`,
                      boxShadow: '0 18px 36px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <img src={art(c.art)} alt="" className="block w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
            <div className="md:col-start-7 md:col-span-6 lg:col-start-6 lg:col-span-7 flex flex-col justify-between gap-[22px] md:gap-5 lg:gap-6">
              <p className={`hidden md:block ${eyebrow}`} style={{ color: C.mint }}>{reviewsLabel}</p>
              <figure key={review} className="kh-fade flex flex-col gap-[22px] lg:gap-6" style={{ animationDuration: '300ms' }} aria-live="polite">
                <blockquote className={`${display} !font-bold text-[21px] md:text-[23px] lg:text-[30px] leading-[1.15] lg:leading-[1.12] tracking-[-0.03em]`}>“{reviews[review].quote}”</blockquote>
                <figcaption className="flex flex-col gap-1">
                  <span className="text-base lg:text-[17px] font-extrabold">{reviews[review].name}</span>
                  <span className="text-sm md:text-[13px] lg:text-sm font-medium" style={{ color: C.muted }}>{reviews[review].meta}</span>
                </figcaption>
              </figure>
              <div className="flex items-center justify-between md:justify-end gap-3">
                <span className="md:mr-1.5 text-sm font-bold tabular-nums" style={{ color: C.muted }}>{review + 1} / {reviews.length}</span>
                <div className="flex gap-2.5 lg:gap-3">
                  <button type="button" onClick={() => setReview(r => (r + reviews.length - 1) % reviews.length)} aria-label="Previous review" className="kh-rev-prev w-12 h-12 md:w-[46px] md:h-[46px] lg:w-12 lg:h-12 rounded-full border-2 flex items-center justify-center cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
                  </button>
                  <button type="button" onClick={() => setReview(r => (r + 1) % reviews.length)} aria-label="Next review" className="kh-rev-next w-12 h-12 md:w-[46px] md:h-[46px] lg:w-12 lg:h-12 rounded-full border-2 flex items-center justify-center cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FAQ: one answer open at a time ───────── */}
        <section id="faq" className="scroll-mt-4 px-5 md:px-10 lg:px-[72px] pt-14 md:pt-[88px] lg:pt-24 flex flex-col lg:grid lg:grid-cols-12 gap-5 md:gap-8 lg:gap-6 lg:items-start">
          <div className="lg:col-span-4 flex flex-col gap-3 md:gap-3.5 lg:gap-[18px]">
            <p className={eyebrow}>FAQ</p>
            <h2 className={`${display} text-[40px] md:text-[56px] lg:text-[64px] leading-[0.9] tracking-[-0.055em]`}>Questions, answered.</h2>
          </div>
          <ul className="lg:col-start-6 lg:col-span-7 flex flex-col gap-2 md:gap-2.5">
            {FAQS.map((f, i) => {
              const open = i === openFaq;
              return (
                <li key={f.q} className="kh-faq rounded-[18px] md:rounded-[20px] border-2 overflow-hidden" style={{ borderColor: C.navy, background: open ? '#FFFFFF' : C.cream }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    aria-controls={`faq-${i}`}
                    className="w-full min-h-[60px] md:min-h-[72px] lg:min-h-16 box-border py-3 md:py-4 pr-3 md:pr-4 pl-[18px] md:pl-[26px] flex items-center justify-between gap-3.5 md:gap-5 text-left cursor-pointer"
                  >
                    <span className={`${display} text-[17px] md:text-[22px] lg:text-[20px] leading-[1.15] tracking-[-0.02em]`}>{f.q}</span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                      style={{ background: C.navy, color: C.cream, transform: `rotate(${open ? 45 : 0}deg)`, transition: `transform 220ms ${EASE}` }}
                    >
                      <PlusIcon />
                    </span>
                  </button>
                  {/* Stays mounted so closing slides too: the row animates 0fr ↔ 1fr, no height measuring. */}
                  <div id={`faq-${i}`} inert={!open} className="kh-collapse grid" style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}>
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-[18px] md:pl-[26px] md:pr-[84px] pb-[18px] md:pb-6 text-[15px] md:text-base leading-[1.55] font-medium">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="mt-16 md:mt-[88px] lg:mt-28 overflow-hidden" style={{ background: C.navy, color: C.cream }}>
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-[72px] pt-12 md:pt-16 lg:pt-20 flex flex-col gap-10 md:gap-12 lg:gap-16">
          <div className="grid md:grid-cols-12 gap-10 md:gap-x-6 lg:gap-6">
            <div className="md:col-span-12 lg:col-span-5 flex flex-col md:flex-row lg:flex-col items-start md:items-center lg:items-start md:justify-between gap-[22px] md:gap-6 lg:gap-7">
              <p className={`${display} text-[28px] md:text-[36px] md:max-w-[420px] lg:max-w-none leading-none tracking-[-0.04em]`}>Checked artisans. Money held until it’s done.</p>
              <Link to={CLIENT_SIGNUP} className="kh-btn kh-btn-orange shrink-0 px-6 md:px-[26px] py-[17px] md:py-[18px] rounded-2xl text-base font-extrabold">
                Find an artisan <Arrow />
              </Link>
            </div>
            <div className="md:col-span-12 lg:col-start-7 lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-7 text-[15px] font-semibold">
              <nav aria-label="Customers" className="flex flex-col items-start gap-1 lg:gap-1.5">
                <span className="pb-1 text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.08em]" style={{ color: C.mint }}>Customers</span>
                <Link to={CLIENT_SIGNUP} className="kh-link py-2 lg:py-1">Find an artisan</Link>
                <a href="#how" className="kh-link py-2 lg:py-1">How it works</a>
                <a href="#trades" className="kh-link py-2 lg:py-1">All trades</a>
              </nav>
              <nav aria-label="Artisans" className="flex flex-col items-start gap-1 lg:gap-1.5">
                <span className="pb-1 text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.08em]" style={{ color: C.mint }}>Artisans</span>
                <Link to={ARTISAN_SIGNUP} className="kh-link py-2 lg:py-1">Join KaziHub</Link>
                <a href="#faq" className="kh-link py-2 lg:py-1">FAQ</a>
                <a href="#faq" onClick={() => setOpenFaq(FAQ_VERIFIED)} className="kh-link py-2 lg:py-1">Getting verified</a>
                <a href="#faq" onClick={() => setOpenFaq(FAQ_PAID)} className="kh-link py-2 lg:py-1">Getting paid</a>
              </nav>
              <nav aria-label="KaziHub" className="col-span-2 md:col-span-1 flex flex-row flex-wrap md:flex-col items-start gap-x-5 gap-y-1 md:gap-1.5">
                <span className="hidden md:block pb-1 text-sm font-extrabold uppercase tracking-[0.08em]" style={{ color: C.mint }}>KaziHub</span>
                <Link to="/signin" className="kh-link py-2 lg:py-1">Sign in</Link>
                <button type="button" onClick={() => setLegal('terms')} className="kh-link py-2 lg:py-1 text-left cursor-pointer">Terms</button>
                <button type="button" onClick={() => setLegal('escrow')} className="kh-link py-2 lg:py-1 text-left cursor-pointer">Escrow policy</button>
                <button type="button" onClick={() => setLegal('privacy')} className="kh-link py-2 lg:py-1 text-left cursor-pointer">Privacy</button>
              </nav>
            </div>
          </div>
          <div className="flex flex-col gap-[18px] lg:gap-7">
            <div className="pt-[18px] md:pt-6 border-t border-[#243A66] flex flex-col md:flex-row md:justify-between text-sm font-semibold" style={{ color: C.muted }}>
              <span className="md:hidden">Made in Ibadan · Payments held in escrow until you confirm</span>
              <span className="hidden md:inline">Made in Ibadan</span>
              <span className="hidden md:inline">Payments held in escrow until you confirm</span>
            </div>
            <span aria-hidden="true" className={`block -mb-[0.16em] ${display} text-[min(25.8vw,23.25rem)] leading-[0.8] tracking-[-0.065em] whitespace-nowrap text-[#1B3160]`}>KaziHub</span>
          </div>
        </div>
      </footer>

      <TermsAndPrivacyModal isOpen={legal !== null} onClose={() => setLegal(null)} initialTab={legal ?? 'terms'} />
    </div>
  );
};
