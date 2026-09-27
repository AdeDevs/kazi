import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TermsAndPrivacyModal } from './ui/TermsAndPrivacyModal';
import { savePendingSearch } from '../lib/pendingSearch';
import { formatCurrency } from '../utils';
import { art } from '../assets/landing';

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
};

const CLIENT_SIGNUP = '/signup?role=client';
const ARTISAN_SIGNUP = '/signup?role=artisan';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
// Preloaded from index.html on the landing page; the name is versioned so it can be cached for good.
const SKYLINE = '/landing/ibadan-skyline-1.svg';

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

function useIsDesktop() {
  const query = '(min-width: 1024px)';
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return matches;
}

const TRADES = [
  { name: 'Electricians', search: 'Electrician', lower: 'electricians', bg: C.orange, fg: C.navy, spot: 'spot-electrician', img: 'trade-electrician', desc: 'Sparking sockets, new wiring, inverter hook-ups and fault finding.' },
  { name: 'Plumbers', search: 'Plumber', lower: 'plumbers', bg: C.indigo, fg: C.cream, spot: 'spot-plumber', img: 'trade-plumber', desc: 'Leaking taps, blocked drains, water heaters and new fittings.' },
  { name: 'Mechanics', search: 'Mechanic', lower: 'mechanics', bg: C.pink, fg: C.navy, spot: 'spot-mechanic', img: 'trade-mechanic', desc: 'Diagnostics, servicing, brakes and roadside help.' },
  { name: 'Solar installers', search: 'Solar', lower: 'solar installers', bg: C.mint, fg: C.navy, spot: 'spot-solar', img: 'trade-solar', desc: 'Panels, batteries and inverters sized for your home.' },
  { name: 'AC technicians', search: 'AC', lower: 'AC technicians', bg: C.navy, fg: C.cream, spot: 'spot-ac', img: 'trade-ac', desc: 'Installs, gas top-ups, servicing and repairs.' },
];

const STEPS = [
  { title: 'Tell us what needs fixing', body: 'Search a trade or describe the problem. We show checked artisans near you.', bg: C.mint, fg: C.navy },
  { title: 'Agree a quote', body: 'Chat with the artisan and accept a written price before any work starts.', bg: C.pink, fg: C.navy },
  { title: 'Pay into escrow', body: 'Your money goes to KaziHub escrow, not the artisan. It stays there while the job is done.', bg: C.yellow, fg: C.navy },
  { title: 'Confirm, and they get paid', body: 'Happy with the work? Confirm it and the payment is released to the artisan.', bg: C.indigo, fg: C.cream },
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
// SAMPLE reviews, shown until real ones exist (backend ask 40: a public featured-reviews endpoint).
// The section labels them as samples; replace this list with real, consented reviews before relying
// on it, and never present these as genuine.
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

/**
 * A status bubble floating over the skyline, drawn in the skyline's own 1440×500 coordinates.
 * `left` is the bubble's left edge relative to its tail at (x, y).
 */
const Bubble: React.FC<{
  x: number; y: number; scale?: number; left: number; width: number;
  dot: string; done?: boolean; text: string; delay: number; floatDelay: number;
}> = ({ x, y, scale = 1, left, width, dot, done, text, delay, floatDelay }) => {
  const cx = left + 22;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g
        className="kh-bubble"
        style={{ animation: `kh-pop 600ms ${EASE} ${delay}ms both, kh-float 5.5s ease-in-out ${floatDelay}s infinite alternate` }}
      >
        <rect x={left} y="-52" width={width} height="40" rx="14" fill="#FFFFFF" stroke={C.navy} strokeWidth="2" />
        <path d="M -8 -13 L 0 -2 L 8 -13 Z" fill="#FFFFFF" stroke={C.navy} strokeWidth="2" strokeLinejoin="round" />
        <rect x="-9" y="-16" width="18" height="5" fill="#FFFFFF" />
        <circle cx={cx} cy="-32" r="11" fill={dot} />
        {done
          ? <path d={`M ${cx - 5.5} -32 l 4 4 l 7 -8`} fill="none" stroke={C.navy} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          : <circle cx={cx} cy="-32" r="4" fill="#FFFFFF" />}
        <text x={cx + 20} y="-26.5" fontFamily="Plus Jakarta Sans, system-ui, sans-serif" fontSize="15" fontWeight="800" fill={C.navy}>{text}</text>
      </g>
    </g>
  );
};

const JOB_DONE = `Job done · ${formatCurrency(18500)} released`;

/** The illustrated Ibadan skyline (Cocoa House, Bower's Tower, Mapo Hall) with its bubbles on top. */
const Skyline: React.FC<{ className: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ className, style, children }) => {
  // Fades in once downloaded rather than popping in on a slow connection. A cached copy can finish
  // before React attaches onLoad, so `complete` is checked on mount too.
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  return (
    <div className={`absolute aspect-[1440/500] ${className}`} style={style}>
      <img
        ref={imgRef}
        src={SKYLINE}
        alt=""
        fetchPriority="high"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-out motion-reduce:transition-none"
        style={{ opacity: loaded ? 1 : 0 }}
      />
      <svg viewBox="0 0 1440 500" aria-hidden="true" className="absolute inset-0 w-full h-full overflow-visible">{children}</svg>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState('');
  const [openTrade, setOpenTrade] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [review, setReview] = useState(0);
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
      {/* ───────── Hero: Ibadan skyline ───────── */}
      <section className="relative overflow-hidden flex flex-col lg:block lg:h-[1000px]" style={{ background: C.orange }}>
        <svg viewBox="0 0 1440 300" aria-hidden="true" className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 w-[1440px] h-[300px]">
          <g fill={C.cream} opacity="0.22">
            <path d="M -40 200 q 0 -70 70 -70 q 20 -80 110 -80 q 90 0 110 80 q 70 0 70 70 z" />
            <path d="M 1120 250 q 0 -60 60 -60 q 16 -70 96 -70 q 80 0 96 70 q 60 0 60 60 z" />
          </g>
        </svg>

        <div className="relative z-10 px-5 lg:px-[72px] flex flex-col items-center gap-5 lg:gap-0 max-w-[1440px] mx-auto w-full box-border">
          <header ref={menuRef} className="kh-fade relative z-30 self-stretch h-16 lg:h-[84px] flex items-center justify-between">
            <Link to="/" aria-label="KaziHub home" className={`${display} text-[24px] lg:text-[28px] tracking-[-0.04em]`}>KaziHub</Link>
            <nav aria-label="Sections" className="hidden lg:flex gap-7 text-[15px] font-bold">
              {sections.map(s => <a key={s.href} href={s.href} className="kh-link">{s.label}</a>)}
            </nav>
            <div className="flex items-center gap-2 lg:gap-3">
              <Link to="/signin" className="kh-link hidden lg:inline mx-3 py-1 text-[15px] font-extrabold">Sign in</Link>
              <Link to={CLIENT_SIGNUP} className="kh-btn kh-btn-on-orange px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-sm lg:text-[15px] font-extrabold">
                Get started
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="kh-menu"
                className="kh-menu-btn lg:hidden w-11 h-11 rounded-xl border-2 flex items-center justify-center cursor-pointer"
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
                className="kh-fade lg:hidden absolute right-0 top-[62px] z-20 w-56 rounded-[18px] border-2 p-2 flex flex-col text-base font-bold"
                style={{ background: C.cream, borderColor: C.navy, animationDuration: '180ms' }}
              >
                {sections.map(s => (
                  <a key={s.href} href={s.href} onClick={() => setMenuOpen(false)} className="kh-menu-item px-3 py-3 rounded-xl">{s.label}</a>
                ))}
                <Link to="/signin" className="kh-menu-item px-3 py-3 rounded-xl font-extrabold">Sign in</Link>
              </nav>
            )}
          </header>

          <h1 className={`kh-rise mt-6 lg:mt-12 text-center ${display} text-[48px] lg:text-[88px] leading-[0.92] lg:leading-[0.88] tracking-[-0.055em]`} style={{ animationDelay: '60ms' }}>
            Light don off?<br />Get person<br className="lg:hidden" /> wey sabi.
          </h1>
          <p className="kh-rise lg:mt-5 lg:mb-7 max-w-[320px] lg:max-w-[600px] text-center text-[15px] lg:text-[19px] leading-normal font-semibold" style={{ animationDelay: '160ms' }}>
            ID-verified artisans near you. Your money stays in escrow until the job is done, and you say so.
          </p>

          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Find an artisan"
            className="kh-rise kh-search self-stretch lg:self-auto lg:w-[720px] h-[58px] lg:h-[68px] box-border flex items-center gap-2.5 lg:gap-3 py-[5px] lg:py-1.5 pr-[5px] lg:pr-1.5 pl-4 lg:pl-6 bg-white rounded-full"
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
                placeholder={isDesktop ? 'What needs fixing? e.g. a leaking tap' : 'What needs fixing?'}
                className="w-full bg-transparent outline-none text-base lg:text-[17px] font-medium placeholder:text-[#5A6478]"
                style={{ color: C.navy }}
              />
            </label>
            <button
              type="submit"
              aria-label="Find artisans"
              className="kh-btn shrink-0 w-12 lg:w-auto h-12 lg:h-14 lg:px-7 rounded-full flex items-center justify-center text-[17px] font-extrabold cursor-pointer"
            >
              <span className="hidden lg:inline">Find artisans</span>
              <span className="kh-arrow lg:hidden flex">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                </svg>
              </span>
            </button>
          </form>
        </div>

        {/* Phone: cropped to Cocoa House and the cherry-picker */}
        <div className="kh-rise lg:hidden relative h-[260px] mt-4 overflow-hidden" style={{ animationDuration: '1100ms', animationDelay: '300ms' }}>
          <Skyline className="bottom-0 w-[749px]" style={{ left: 'calc(50% - 482px)' }}>
            <Bubble x={1000} y={140} scale={1.5} left={-204} width={238} dot={C.indigo} text="AC repair · Working" delay={900} floatDelay={1.7} />
            <Bubble x={1170} y={236} scale={1.5} left={-279} width={313} dot={C.mint} done text={JOB_DONE} delay={1400} floatDelay={2.2} />
          </Skyline>
        </div>
        {/* Desktop: the full skyline across the bottom of the hero */}
        <div className="kh-rise hidden lg:block absolute inset-x-0 bottom-0 h-[520px]" style={{ animationDuration: '1100ms', animationDelay: '300ms' }}>
          <Skyline className="bottom-0 left-1/2 -translate-x-1/2 w-[max(1500px,100%)]">
            <Bubble x={452} y={328} left={-124} width={248} dot={C.orange} text="Plumber · On the way" delay={900} floatDelay={1.7} />
            <Bubble x={362} y={132} left={-34} width={220} dot={C.indigo} text="Painter · Working" delay={1300} floatDelay={2.1} />
            <Bubble x={1152} y={254} left={-279} width={313} dot={C.mint} done text={JOB_DONE} delay={1700} floatDelay={2.5} />
          </Skyline>
        </div>
      </section>

      {/* ───────── Marquee ───────── */}
      <section aria-label="KaziHub at a glance" className="kh-marquee-wrap h-[52px] lg:h-16 overflow-hidden flex items-center" style={{ background: C.navy, color: C.cream }}>
        <div className={`kh-marquee flex w-max ${display} text-[15px] lg:text-[19px] tracking-[-0.02em]`}>
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
        {/* ───────── Illustrated mosaic ───────── */}
        <section aria-label="Why KaziHub" className="px-5 lg:px-[72px] pt-10 lg:pt-20 grid grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 gap-2.5 lg:gap-3.5 lg:h-[600px]">
          <div className="kh-rise relative overflow-hidden h-[230px] lg:h-auto lg:col-span-5 lg:row-span-2 rounded-[22px] lg:rounded-[28px]" style={{ background: C.pink, animationDelay: '360ms' }}>
            <div className="relative z-10 px-4 lg:px-[30px] pt-4 lg:pt-[26px] flex flex-col items-start gap-1.5 lg:gap-2.5">
              <img src={art('icon-quote')} alt="" className="hidden lg:block w-11 h-11" />
              <h3 className={`${display} text-[20px] lg:text-[34px] leading-[0.95] tracking-[-0.04em]`}>Quotes before work</h3>
              <p className="text-[13px] lg:text-base leading-snug lg:leading-[1.45] font-semibold lg:font-medium lg:max-w-[360px]">
                <span className="lg:hidden">Agree a written quote before work starts.</span>
                <span className="hidden lg:inline">Chat with the artisan and agree a written quote before any work starts.</span>
              </p>
            </div>
            <img src={art('mosaic-quotes')} alt="" className="absolute left-0 -bottom-4 lg:-bottom-[64px] w-full h-auto" />
          </div>
          <div className="kh-rise relative overflow-hidden h-[230px] lg:h-auto lg:col-span-4 rounded-[22px] lg:rounded-[28px]" style={{ background: C.mint, animationDelay: '430ms' }}>
            <div className="relative z-10 px-4 lg:px-[30px] pt-4 lg:pt-[26px] flex flex-col items-start gap-1.5 lg:gap-2.5">
              <h3 className={`${display} text-[20px] lg:text-[26px] leading-[0.95] tracking-[-0.04em]`}>People near you</h3>
              <p className="text-[13px] lg:text-base leading-snug lg:leading-[1.45] font-semibold lg:font-medium lg:max-w-[320px]">
                <span className="lg:hidden">Verified artisans close by, so help comes fast.</span>
                <span className="hidden lg:inline">Verified artisans in your area, so help arrives fast.</span>
              </p>
            </div>
            <img src={art('mosaic-near')} alt="" className="absolute -left-6 lg:left-0 -bottom-1.5 lg:-bottom-12 w-[220px] lg:w-full h-auto" />
          </div>
          <div className="kh-rise relative overflow-hidden h-[230px] lg:h-auto lg:col-span-3 lg:row-span-2 rounded-[22px] lg:rounded-[28px]" style={{ background: C.yellow, animationDelay: '500ms' }}>
            <div className="relative z-10 px-4 lg:px-[30px] pt-4 lg:pt-[26px] flex flex-col items-start gap-1.5 lg:gap-2.5">
              <img src={art('icon-paid')} alt="" className="hidden lg:block w-11 h-11" />
              <h3 className={`${display} text-[20px] lg:text-[34px] leading-[0.95] tracking-[-0.04em]`}>Paid when done</h3>
              <p className="text-[13px] lg:text-base leading-snug lg:leading-[1.45] font-semibold lg:font-medium">
                <span className="lg:hidden">Money waits in escrow till you confirm.</span>
                <span className="hidden lg:inline">Your money waits in escrow and moves only when you confirm.</span>
              </p>
            </div>
            <img src={art('mosaic-paid')} alt="" className="absolute -right-1 lg:right-auto lg:left-0 -bottom-[22px] lg:-bottom-10 w-[124px] lg:w-full h-auto" />
          </div>
          <div className="kh-rise relative overflow-hidden h-[230px] lg:h-auto lg:col-start-6 lg:col-span-4 lg:row-start-2 rounded-[22px] lg:rounded-[28px] px-4 pt-4 lg:px-[30px] lg:py-[26px] flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-[22px]" style={{ background: C.indigo, color: C.cream, animationDelay: '570ms' }}>
            <h3 className={`lg:hidden ${display} text-[20px] leading-[0.95] tracking-[-0.04em]`}>Every artisan checked</h3>
            <p className="lg:hidden text-[13px] leading-snug font-semibold">Government ID and a live selfie, before any job.</p>
            <span aria-hidden="true" className={`absolute lg:static left-4 bottom-1.5 ${display} text-[64px] lg:text-[56px] leading-none tracking-[-0.06em] lg:tracking-[-0.05em]`} style={{ color: C.mint }}>ID+</span>
            <span className="hidden lg:block text-base leading-[1.45] font-semibold">Every artisan checked with a government ID and a live selfie before the Verified badge.</span>
          </div>
        </section>

        {/* ───────── How it works ───────── */}
        <section id="how" className="scroll-mt-4 pt-14 lg:pt-[104px] lg:px-[72px] flex flex-col gap-5 lg:gap-11">
          <div className="px-5 lg:px-0 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 lg:gap-10">
            <div className="flex flex-col gap-3 lg:gap-4">
              <p className={eyebrow}>How it works</p>
              <h2 className={`${display} text-[40px] lg:text-[60px] leading-[0.92] tracking-[-0.055em]`}>Book it. We hold the money.<br className="hidden lg:block" /> You say when it’s done.</h2>
            </div>
            <p className="lg:mb-1.5 lg:max-w-[340px] text-[15px] lg:text-[17px] leading-normal font-medium">
              Four steps, and your money is protected at every one<span className="hidden lg:inline"> of them</span>.<span className="lg:hidden"> Swipe through.</span>
            </p>
          </div>
          <ol className="kh-snap flex lg:grid lg:grid-cols-4 gap-2.5 lg:gap-4 px-5 lg:px-0 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scroll-pl-5 lg:h-[410px]">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="kh-rise relative overflow-hidden shrink-0 basis-[256px] lg:basis-auto h-[360px] lg:h-auto snap-start rounded-[22px] lg:rounded-[26px]"
                style={{ background: s.bg, color: s.fg, animationDelay: `${200 + i * 90}ms` }}
              >
                <div className="relative z-10 px-5 lg:px-[26px] pt-5 lg:pt-[26px] flex flex-col items-start gap-2.5 lg:gap-3">
                  <span className="px-[11px] lg:px-3 py-[5px] lg:py-1.5 rounded-full text-xs lg:text-[13px] font-extrabold tracking-[0.04em]" style={{ background: s.fg, color: s.bg === C.indigo ? C.navy : C.cream }}>
                    Step {i + 1}<span className="lg:hidden"> of 4</span>
                  </span>
                  <h3 className={`mt-0.5 lg:mt-1 ${display} text-[24px] lg:text-[26px] leading-[0.98] tracking-[-0.04em]`}>{s.title}</h3>
                  <p className="text-sm lg:text-[15px] leading-[1.45] font-medium">{s.body}</p>
                </div>
                <img src={art(`step-${i + 1}`)} alt="" className="absolute left-0 -bottom-2 lg:-bottom-2.5 w-full h-auto" />
              </li>
            ))}
            <li aria-hidden="true" className="lg:hidden shrink-0 basis-2.5" />
          </ol>
        </section>

        {/* ───────── Trades: expanding cards (desktop) / accordion (phone) ───────── */}
        <section id="trades" className="scroll-mt-4 px-5 lg:px-[72px] pt-14 lg:pt-[92px] flex flex-col gap-5 lg:gap-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3 lg:gap-10">
            <h2 className={`${display} text-[44px] lg:text-[72px] leading-[0.9] tracking-[-0.055em]`}>The trades people<br className="hidden lg:block" /> book most.</h2>
            <Link to={CLIENT_SIGNUP} className="kh-link pb-0.5 text-[15px] lg:text-[17px] font-extrabold">See all trades <Arrow /></Link>
          </div>
          <ul className="flex flex-col lg:flex-row gap-2.5 lg:gap-3 lg:h-[520px]">
            {TRADES.map((t, i) => {
              const open = i === openTrade;
              return (
                <li
                  key={t.name}
                  onMouseEnter={isDesktop ? () => setOpenTrade(i) : undefined}
                  className="relative box-border overflow-hidden rounded-[22px] lg:rounded-[26px] min-w-0"
                  style={{
                    background: t.bg,
                    color: t.fg,
                    ...(isDesktop
                      ? { flexGrow: open ? 3.8 : 1, flexBasis: 0, transition: `flex-grow 620ms ${EASE}` }
                      : { height: open ? 380 : 68, transition: `height 520ms ${EASE}` }),
                  }}
                >
                  {isDesktop ? (
                    open ? (
                      <>
                        <div className="kh-rise absolute inset-x-0 -bottom-14" style={{ animationDuration: '620ms', animationDelay: '180ms' }}>
                          <img src={art(t.img)} alt="" className="block w-full h-auto" />
                        </div>
                        <div className="kh-fade relative px-[30px] pt-[26px] flex flex-col gap-3.5" style={{ animationDuration: '420ms', animationDelay: '120ms' }}>
                          <div className="flex items-center justify-between">
                            <img src={art(t.spot)} alt="" className="w-12 h-12" />
                            <button
                              type="button"
                              onClick={() => seeTrade(t.search)}
                              aria-label={`See ${t.lower}`}
                              className="kh-turn w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
                              style={{ background: t.fg, color: t.bg }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
                            </button>
                          </div>
                          <h3 className={`mt-1.5 ${display} text-[clamp(2.5rem,3.6vw,3.25rem)] leading-[0.92] tracking-[-0.05em]`}>{t.name}</h3>
                          <p className="max-w-[420px] text-[17px] leading-[1.45] font-medium">{t.desc}</p>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenTrade(i)}
                        onFocus={() => setOpenTrade(i)}
                        aria-expanded="false"
                        aria-label={t.name}
                        className="absolute inset-0 w-full box-border px-[22px] py-6 flex flex-col justify-end items-start text-left cursor-pointer"
                      >
                        <span className={`[writing-mode:vertical-rl] rotate-180 ${display} text-[40px] leading-[0.95] tracking-[-0.04em] whitespace-nowrap`}>{t.name}</span>
                      </button>
                    )
                  ) : (
                    <>
                      {open && <img src={art(t.img)} alt="" className="kh-rise absolute left-0 -bottom-[26px] w-full h-auto" style={{ animationDuration: '560ms', animationDelay: '160ms' }} />}
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
                      {open && (
                        <div className="kh-fade relative z-10 px-5 flex flex-col items-start gap-2.5" style={{ animationDuration: '400ms', animationDelay: '120ms' }}>
                          <p className="text-[15px] leading-[1.45] font-medium">{t.desc}</p>
                          <button type="button" onClick={() => seeTrade(t.search)} className="kh-link pb-0.5 text-[15px] font-extrabold cursor-pointer">
                            See {t.lower} <Arrow />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* ───────── For clients: tiles rise in on first view ───────── */}
        <section id="clients" ref={why.ref} className="scroll-mt-4 px-5 lg:px-[72px] pt-14 lg:pt-24 grid grid-cols-2 lg:grid-cols-12 lg:grid-rows-[auto_1fr_1fr] gap-2.5 lg:gap-3 lg:h-[780px]">
          <div className="col-span-2 lg:col-span-5 rounded-[22px] lg:rounded-[26px] bg-white border-2 p-[22px] lg:p-[30px] flex flex-col justify-between items-start gap-4" style={{ borderColor: C.navy, ...reveal(0) }}>
            <div className="flex flex-col gap-3 lg:gap-3">
              <p className={eyebrow}>For clients</p>
              <h2 className={`${display} text-[40px] lg:text-[48px] leading-[0.92] tracking-[-0.05em]`}>Hire without the wahala.</h2>
            </div>
            <Link to={CLIENT_SIGNUP} className="kh-btn px-5 lg:px-6 py-3.5 lg:py-4 rounded-[14px] text-[15px] lg:text-base font-extrabold">
              Find an artisan <Arrow />
            </Link>
          </div>
          <div className="relative overflow-hidden h-[156px] lg:h-auto lg:col-span-7 rounded-[22px] lg:rounded-[26px] p-[18px] lg:p-[30px] flex flex-col justify-between" style={{ background: C.indigo, color: C.cream, ...reveal(1) }}>
            <Swoosh viewBox="0 0 150 130" d="M20 20 C 20 120, 120 120, 120 20" color={C.mint} width={26} className="lg:hidden w-[150px] -right-20 -bottom-[70px]" />
            <Swoosh viewBox="0 0 420 300" d="M60 40 C 60 260, 250 260, 250 110 S 400 -20, 400 200" color={C.mint} width={56} className="hidden lg:block w-[420px] -right-[150px] -top-[70px]" />
            <span className={`relative ${display} text-[40px] lg:text-[84px] leading-[0.86] lg:leading-[0.8] tracking-[-0.06em]`}>2<br className="lg:hidden" /> checks</span>
            <span className="relative text-[13px] lg:text-base font-semibold leading-snug lg:max-w-[340px]">
              <span className="lg:hidden">Government ID and a live selfie</span>
              <span className="hidden lg:inline">A government ID and a live selfie, before any artisan gets the Verified badge.</span>
            </span>
          </div>
          <div className="h-[156px] lg:h-auto lg:col-span-6 rounded-[22px] lg:rounded-[26px] p-[18px] lg:p-[30px] flex flex-col justify-between bg-[#F7B8D2] lg:bg-[#FF6A2B]" style={reveal(2)}>
            <span className={`${display} text-[56px] lg:text-[100px] leading-[0.8] tracking-[-0.06em]`}>₦0</span>
            <span className="text-[13px] lg:text-base font-bold leading-snug lg:max-w-[380px]">
              <span className="lg:hidden">to the artisan until you confirm</span>
              <span className="hidden lg:inline">reaches the artisan until you confirm the job is done. It waits in escrow.</span>
            </span>
          </div>
          <div className="relative overflow-hidden col-span-2 lg:col-span-6 h-[156px] lg:h-auto rounded-[22px] lg:rounded-[26px] p-5 lg:p-[30px] flex flex-col justify-between bg-[#FF6A2B] lg:bg-[#F7B8D2]" style={reveal(3)}>
            <Swoosh viewBox="0 0 200 170" d="M30 160 C 30 40, 170 40, 170 150" color={C.orangeSoft} width={40} className="lg:hidden w-[200px] -right-[30px] -bottom-[60px]" />
            <span className={`relative ${display} text-[52px] lg:text-[88px] leading-[0.8] tracking-[-0.06em]`}>Quote first</span>
            <span className="relative text-sm lg:text-base font-bold max-w-[260px] lg:max-w-[380px]">
              The price is agreed in writing<span className="hidden lg:inline">, in chat,</span> before anyone picks up a tool.
            </span>
          </div>
          <div className="relative overflow-hidden hidden lg:flex lg:col-span-7 rounded-[26px] p-[30px] items-center justify-center" style={{ background: C.mint, ...reveal(4) }}>
            <Swoosh viewBox="0 0 260 260" d="M30 30 C 30 200, 200 230, 230 60" color={C.indigo} width={50} className="w-[260px] -left-[60px] -bottom-20" />
            <p className={`relative text-center ${display} text-[38px] leading-none tracking-[-0.04em]`}>Checked pros, clear quotes,<br />and a record of every job</p>
          </div>
          <div className="relative overflow-hidden col-span-2 lg:col-span-5 rounded-[22px] lg:rounded-[26px] p-[22px] lg:p-[30px] flex flex-col justify-between gap-3" style={{ background: C.navy, color: C.cream, ...reveal(5) }}>
            <Swoosh viewBox="0 0 220 240" d="M190 20 C 40 20, 40 220, 190 220" color={C.orange} width={48} className="hidden lg:block w-[220px] -right-[50px] -top-10" />
            <span className={`relative ${display} text-[30px] lg:text-[38px] leading-[0.95] tracking-[-0.04em]`}>Reviews from<br className="hidden lg:block" /> real jobs only</span>
            <span className="relative text-sm leading-relaxed lg:hidden" style={{ color: C.muted }}>Only after a paid, completed booking. No friends, no fakes.</span>
            <ul className="relative hidden lg:block pl-[18px] list-disc text-sm leading-[1.7]" style={{ color: C.muted }}>
              <li>Only after a paid, completed booking</li>
              <li>No friends, no fakes</li>
            </ul>
          </div>
        </section>

        {/* ───────── For artisans ───────── */}
        <section id="artisans" className="scroll-mt-4 mx-5 lg:mx-[72px] mt-14 lg:mt-24 rounded-[28px] lg:rounded-[32px] overflow-hidden flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-6 px-[22px] pt-[26px] pb-[22px] lg:p-0 lg:h-[560px]" style={{ background: C.peach }}>
          <div className="contents lg:flex lg:col-span-7 lg:p-12 lg:pr-0 lg:flex-col lg:justify-between lg:items-start">
            <div className="flex flex-col gap-3 lg:gap-4">
              <p className={eyebrow}>For artisans</p>
              <h2 className={`${display} text-[40px] lg:text-[64px] leading-[0.9] tracking-[-0.055em]`}>You do the work. The money don already land.</h2>
            </div>
            <div className="lg:hidden h-52 rounded-[20px] overflow-hidden flex items-end justify-center" style={{ background: C.indigo }}>
              <img src={art('artisan')} alt="An artisan receiving a job request, with payment already secured in escrow" className="w-full h-full object-contain object-bottom" />
            </div>
            <ul className="flex flex-col lg:grid lg:grid-cols-2 gap-3 lg:gap-x-7 lg:gap-y-4 lg:self-stretch">
              {ARTISAN_POINTS.map(p => (
                <li key={p} className="flex items-center gap-2.5 lg:gap-3 text-[15px] lg:text-base font-bold leading-tight">
                  <span className="lg:hidden"><Check size={24} /></span>
                  <span className="hidden lg:inline"><Check size={28} /></span>
                  {p}
                </li>
              ))}
            </ul>
            <Link to={ARTISAN_SIGNUP} className="kh-btn text-center p-[17px] lg:px-6 lg:py-[18px] rounded-2xl text-base font-extrabold">
              Join as an artisan <Arrow />
            </Link>
          </div>
          <div className="hidden lg:flex lg:col-start-9 lg:col-span-4 my-5 mr-5 rounded-3xl overflow-hidden items-end justify-center" style={{ background: C.indigo }}>
            <img src={art('artisan')} alt="An artisan receiving a job request, with payment already secured in escrow" className="w-full h-full object-contain object-bottom" />
          </div>
        </section>

        {/* ───────── Reviews: fanned illustrated cards + quote (samples until real reviews exist) ───────── */}
        <section aria-label="Customer reviews" className="px-5 lg:px-[72px] pt-14 lg:pt-24">
          <div className="rounded-[28px] lg:rounded-[32px] overflow-hidden flex flex-col lg:grid lg:grid-cols-12 gap-[22px] lg:gap-6 px-[22px] pt-[26px] pb-[22px] lg:px-14 lg:py-12 lg:h-[410px]" style={{ background: C.navy, color: C.cream }}>
            <p className={`lg:hidden ${eyebrow}`} style={{ color: C.mint }}>Sample reviews</p>
            <div className="relative h-[240px] lg:h-auto lg:col-span-5" aria-hidden="true">
              {REVIEW_CARDS.map((c, i) => {
                const pos = (i - review + 3) % 3;
                return (
                  <div
                    key={c.art}
                    className="absolute left-1.5 top-2 lg:left-0 lg:top-1 w-[180px] h-[220px] lg:w-[240px] lg:h-[295px] rounded-[20px] lg:rounded-3xl overflow-hidden motion-reduce:transition-none"
                    style={{
                      background: c.bg,
                      zIndex: 3 - pos,
                      transform: (isDesktop ? FAN_DESKTOP : FAN_PHONE)[pos],
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
            <div className="lg:col-start-6 lg:col-span-7 flex flex-col justify-between gap-[22px] lg:gap-6">
              <p className={`hidden lg:block ${eyebrow}`} style={{ color: C.mint }}>Sample reviews</p>
              <figure key={review} className="kh-fade flex flex-col gap-[22px] lg:gap-6" style={{ animationDuration: '300ms' }} aria-live="polite">
                <blockquote className={`${display} !font-bold text-[21px] lg:text-[30px] leading-[1.15] lg:leading-[1.12] tracking-[-0.03em]`}>“{SAMPLE_REVIEWS[review].quote}”</blockquote>
                <figcaption className="flex flex-col gap-1">
                  <span className="text-base lg:text-[17px] font-extrabold">{SAMPLE_REVIEWS[review].name}</span>
                  <span className="text-sm font-medium" style={{ color: C.muted }}>{SAMPLE_REVIEWS[review].meta}</span>
                </figcaption>
              </figure>
              <div className="flex items-center justify-between lg:justify-end gap-3">
                <span className="lg:mr-1.5 text-sm font-bold tabular-nums" style={{ color: C.muted }}>{review + 1} / {SAMPLE_REVIEWS.length}</span>
                <div className="flex gap-2.5 lg:gap-3">
                  <button type="button" onClick={() => setReview(r => (r + SAMPLE_REVIEWS.length - 1) % SAMPLE_REVIEWS.length)} aria-label="Previous review" className="kh-rev-prev w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
                  </button>
                  <button type="button" onClick={() => setReview(r => (r + 1) % SAMPLE_REVIEWS.length)} aria-label="Next review" className="kh-rev-next w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FAQ: one answer open at a time ───────── */}
        <section id="faq" className="scroll-mt-4 px-5 lg:px-[72px] pt-14 lg:pt-24 flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-6 lg:items-start">
          <div className="lg:col-span-4 flex flex-col gap-3 lg:gap-[18px]">
            <p className={eyebrow}>FAQ</p>
            <h2 className={`${display} text-[40px] lg:text-[64px] leading-[0.9] tracking-[-0.055em]`}>Questions, answered.</h2>
          </div>
          <ul className="lg:col-start-6 lg:col-span-7 flex flex-col gap-2 lg:gap-2.5">
            {FAQS.map((f, i) => {
              const open = i === openFaq;
              return (
                <li key={f.q} className="kh-faq rounded-[18px] lg:rounded-[20px] border-2 overflow-hidden" style={{ borderColor: C.navy, background: open ? '#FFFFFF' : C.cream }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    aria-controls={`faq-${i}`}
                    className="w-full min-h-[60px] lg:min-h-16 box-border py-3 lg:py-4 pr-3 lg:pr-4 pl-[18px] lg:pl-[26px] flex items-center justify-between gap-3.5 lg:gap-5 text-left cursor-pointer"
                  >
                    <span className={`${display} text-[17px] lg:text-[20px] leading-[1.15] tracking-[-0.02em]`}>{f.q}</span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center"
                      style={{ background: C.navy, color: C.cream, transform: `rotate(${open ? 45 : 0}deg)`, transition: `transform 220ms ${EASE}` }}
                    >
                      <PlusIcon />
                    </span>
                  </button>
                  {/* Stays mounted so closing slides too: the row animates 0fr ↔ 1fr, no height measuring. */}
                  <div id={`faq-${i}`} inert={!open} className="kh-collapse grid" style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}>
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-[18px] lg:pl-[26px] lg:pr-[84px] pb-[18px] lg:pb-6 text-[15px] lg:text-base leading-[1.55] font-medium">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="mt-16 lg:mt-28 overflow-hidden" style={{ background: C.navy, color: C.cream }}>
        <div className="max-w-[1440px] mx-auto px-5 lg:px-[72px] pt-12 lg:pt-20 flex flex-col gap-10 lg:gap-16">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-6">
            <div className="lg:col-span-5 flex flex-col items-start gap-[22px] lg:gap-7">
              <p className={`${display} text-[28px] lg:text-[36px] leading-none tracking-[-0.04em]`}>Checked artisans. Money held until it’s done.</p>
              <Link to={CLIENT_SIGNUP} className="kh-btn kh-btn-orange px-6 lg:px-[26px] py-[17px] lg:py-[18px] rounded-2xl text-base font-extrabold">
                Find an artisan <Arrow />
              </Link>
            </div>
            <div className="lg:col-start-7 lg:col-span-6 grid grid-cols-2 lg:grid-cols-3 gap-x-4 lg:gap-x-6 gap-y-7 text-[15px] font-semibold">
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
              <nav aria-label="KaziHub" className="col-span-2 lg:col-span-1 flex flex-row flex-wrap lg:flex-col items-start gap-x-5 gap-y-1 lg:gap-1.5">
                <span className="hidden lg:block pb-1 text-sm font-extrabold uppercase tracking-[0.08em]" style={{ color: C.mint }}>KaziHub</span>
                <Link to="/signin" className="kh-link py-2 lg:py-1">Sign in</Link>
                <button type="button" onClick={() => setLegal('terms')} className="kh-link py-2 lg:py-1 text-left cursor-pointer">Terms</button>
                <button type="button" onClick={() => setLegal('escrow')} className="kh-link py-2 lg:py-1 text-left cursor-pointer">Escrow policy</button>
                <button type="button" onClick={() => setLegal('privacy')} className="kh-link py-2 lg:py-1 text-left cursor-pointer">Privacy</button>
              </nav>
            </div>
          </div>
          <div className="flex flex-col gap-[18px] lg:gap-7">
            <div className="pt-[18px] lg:pt-6 border-t border-[#243A66] flex flex-col lg:flex-row lg:justify-between text-sm font-semibold" style={{ color: C.muted }}>
              <span className="lg:hidden">Made in Ibadan · Payments held in escrow until you confirm</span>
              <span className="hidden lg:inline">Made in Ibadan</span>
              <span className="hidden lg:inline">Payments held in escrow until you confirm</span>
            </div>
            <span aria-hidden="true" className={`block -mb-[0.16em] ${display} text-[min(25.8vw,23.25rem)] leading-[0.8] tracking-[-0.065em] whitespace-nowrap text-[#1B3160]`}>KaziHub</span>
          </div>
        </div>
      </footer>

      <TermsAndPrivacyModal isOpen={legal !== null} onClose={() => setLegal(null)} initialTab={legal ?? 'terms'} />
    </div>
  );
};
