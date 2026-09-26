import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Car, Hammer, MapPin, Plus, Smartphone, Snowflake, Sun, Wrench, Zap,
} from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import { TermsAndPrivacyModal } from './ui/TermsAndPrivacyModal';
import { NIGERIAN_STATES } from '../lib/inputRules';
import { savePendingSearch } from '../lib/pendingSearch';

// The landing page keeps its own palette (from the design canvas, direction E), separate from
// the app's theme and independent of dark mode.
const C = {
  orange: '#FF6A2B',
  orangeSoft: '#FF9A6B',
  navy: '#0B1B3A',
  cream: '#FFF6EC',
  indigo: '#3B35C9',
  pink: '#F7B8D2',
  mint: '#9BF0C4',
  peach: '#FFE3CC',
  muted: '#C9D1DE',
};

const CLIENT_SIGNUP = '/signup?role=client';
const ARTISAN_SIGNUP = '/signup?role=artisan';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Real photos of KaziHub artisans at work go here (e.g. files in /public/landing/, referenced as
 * '/landing/carpenter.jpg'). Until a photo exists, its tile shows its colour and the trade's icon,
 * never a stock or made-up image.
 */
const PHOTOS: Record<string, string | undefined> = {
  carpenter: undefined,
  plumber: undefined,
  solar: undefined,
  electrician: undefined,
  mechanic: undefined,
  ac: undefined,
  artisanPhone: undefined,
};

const Photo: React.FC<{
  src?: string;
  alt: string;
  tone: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ src, alt, tone, icon: Icon, className = '', style, children }) => (
  <div className={`relative overflow-hidden ${className}`} style={{ background: tone, ...style }}>
    {src ? (
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <Icon aria-hidden="true" className="absolute right-[-6%] top-1/2 -translate-y-1/2 w-[62%] h-auto max-w-[260px] opacity-[0.14]" style={{ color: C.navy }} />
    )}
    {children}
  </div>
);

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

/** Counts 0 → 1 once over `duration`, starting when `start` turns true. Jumps to 1 for reduced motion. */
function useCountUp(start: boolean, duration = 1500) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setT(1);
      return;
    }
    let raf = 0;
    const begin = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - begin) / duration);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, duration]);
  return t;
}
const easeOutCubic = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

const TRADES = [
  { name: 'Electricians', bg: C.orange, fg: C.navy, tone: '#D7C5B0', photo: PHOTOS.electrician, icon: Zap, blurb: 'Sockets, wiring, inverter hook-ups and fault finding.' },
  { name: 'Plumbers', bg: C.indigo, fg: C.cream, tone: '#CDBBA7', photo: PHOTOS.plumber, icon: Wrench, blurb: 'Leaks, blocked drains, water heaters and new fittings.' },
  { name: 'Mechanics', bg: C.pink, fg: C.navy, tone: '#D7C5B0', photo: PHOTOS.mechanic, icon: Car, blurb: 'Diagnostics, servicing, brakes and roadside help.' },
  { name: 'Solar installers', bg: C.mint, fg: C.navy, tone: '#CDBBA7', photo: PHOTOS.solar, icon: Sun, blurb: 'Panels, batteries and inverters sized for your home.' },
  { name: 'AC technicians', bg: C.navy, fg: C.cream, tone: '#D7C5B0', photo: PHOTOS.ac, icon: Snowflake, blurb: 'Installs, gas top-ups, servicing and repairs.' },
];

const display = "font-['Bricolage_Grotesque',sans-serif] font-extrabold";
const pressable = 'transition-[transform,background-color,opacity] duration-150 active:scale-[0.97]';

const Swoosh: React.FC<{ d: string; color: string; width: number; className: string; viewBox: string }> = ({ d, color, width, className, viewBox }) => (
  <svg viewBox={viewBox} fill="none" aria-hidden="true" className={`absolute pointer-events-none ${className}`}>
    <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" />
  </svg>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [state, setState] = useState('');
  const [query, setQuery] = useState('');
  const [openTrade, setOpenTrade] = useState(0);
  const [legal, setLegal] = useState<null | 'terms' | 'escrow' | 'privacy'>(null);

  const why = useInView<HTMLElement>(0.2);
  const count = useCountUp(why.inView);
  const nTrades = Math.round(16 * easeOutCubic(count / 0.85));
  const nStates = Math.round(36 * easeOutCubic((count - 0.15) / 0.85));
  const artisans = useInView<HTMLElement>(0.25);

  // The directory needs an account, so the search is carried through sign-up (lib/pendingSearch)
  // and the new client lands on the artisan search with it filled in.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    savePendingSearch([query.trim(), state].filter(Boolean).join(' '));
    navigate(CLIENT_SIGNUP);
  };

  return (
    <div className="min-h-dvh overflow-x-clip font-['Plus_Jakarta_Sans',system-ui,sans-serif]" style={{ background: C.cream, color: C.navy }}>
      {/* ───────── Hero ───────── */}
      <section style={{ background: C.orange }} className="px-5 lg:px-[72px] pb-8 lg:pb-16">
        <header className="kh-fade h-[68px] lg:h-24 flex items-center justify-between max-w-[1296px] mx-auto">
          <Link to="/" aria-label="KaziHub home" className={`${display} text-[26px] lg:text-[32px] tracking-[-0.04em]`}>KaziHub</Link>
          <nav aria-label="Sections" className="hidden lg:flex gap-8 text-[15px] font-bold">
            <a href="#trades" className="hover:underline underline-offset-4">Trades</a>
            <a href="#why" className="hover:underline underline-offset-4">Why KaziHub</a>
            <a href="#artisans" className="hover:underline underline-offset-4">For artisans</a>
          </nav>
          <div className="flex items-center gap-1.5 lg:gap-3">
            <Link to="/signin" className={`px-2.5 lg:px-4 py-3 text-sm lg:text-[15px] font-extrabold rounded-xl ${pressable}`}>Sign in</Link>
            <Link to={CLIENT_SIGNUP} className={`px-4 lg:px-[22px] py-3 lg:py-3.5 rounded-xl lg:rounded-2xl text-sm lg:text-[15px] font-extrabold ${pressable}`} style={{ background: C.navy, color: C.cream }}>
              Get started
            </Link>
          </div>
        </header>

        <div className="max-w-[1296px] mx-auto flex flex-col gap-6 lg:gap-9 pt-5 lg:pt-40">
          <h1 className={`kh-rise ${display} text-[clamp(3.9rem,10.4vw,9.4rem)] leading-[0.87] tracking-[-0.055em]`} style={{ animationDelay: '60ms' }}>
            Light don off?<br className="hidden lg:block" /> Get person wey sabi.
          </h1>
          <p className="kh-rise text-[17px] lg:text-[22px] leading-normal font-semibold max-w-[640px]" style={{ animationDelay: '180ms' }}>
            ID-verified artisans near you. Your money stays in escrow until the job is done, and you say so.
          </p>

          <form onSubmit={handleSearch} role="search" aria-label="Find an artisan" className="kh-rise flex flex-col lg:flex-row gap-2.5 max-w-[980px]" style={{ animationDelay: '280ms' }}>
            <div className="flex-1 flex flex-col lg:flex-row bg-white rounded-2xl lg:rounded-[18px] border-2 overflow-hidden" style={{ borderColor: C.navy }}>
              <div className="flex items-center gap-1 pl-3.5 lg:pl-5 lg:min-w-[230px] border-b-[1.5px] lg:border-b-0 lg:border-r-[1.5px] border-[#D9DCE2]">
                <MapPin className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                <CustomDropdown
                  value={state}
                  onChange={(v) => setState(String(v))}
                  options={NIGERIAN_STATES.map(s => ({ value: s, label: s }))}
                  placeholder="Your state"
                  className="flex-1"
                  buttonClassName="!border-0 !shadow-none !bg-transparent !text-base !font-bold h-[52px] lg:h-[64px]"
                />
              </div>
              <label className="flex-none lg:flex-1 flex items-center px-4 lg:px-5 h-[54px] lg:h-auto">
                <span className="sr-only">What needs fixing?</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.slice(0, 80))}
                  enterKeyHint="search"
                  placeholder={isDesktop ? 'What needs fixing? e.g. sparking socket, leaking tap' : 'What needs fixing?'}
                  className="w-full bg-transparent outline-none text-base lg:text-[17px] placeholder:text-[#6B7486]"
                />
              </label>
            </div>
            <button type="submit" className={`h-[58px] lg:h-[68px] px-8 rounded-2xl lg:rounded-[18px] text-[17px] lg:text-lg font-extrabold cursor-pointer ${pressable}`} style={{ background: C.navy, color: C.cream }}>
              Find an artisan
            </button>
          </form>
          <a href="#artisans" className="kh-fade self-start text-[15px] lg:text-base font-extrabold underline-offset-[5px] hover:underline" style={{ animationDelay: '420ms' }}>
            I’m an artisan. Get jobs near me →
          </a>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto">
        {/* ───────── Photo mosaic ───────── */}
        <section aria-label="KaziHub at work" className="px-5 lg:px-[72px] pt-4 lg:pt-5 grid grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 gap-2.5 lg:gap-4 lg:h-[600px]">
          <Photo src={PHOTOS.carpenter} alt="A KaziHub carpenter at a workbench" tone="#CDBBA7" icon={Hammer} style={{ animationDelay: '380ms' }} className="kh-rise col-span-2 lg:col-span-5 lg:row-span-2 h-[260px] lg:h-auto rounded-3xl lg:rounded-[28px]">
            <span className={`absolute left-5 lg:left-6 bottom-4 lg:bottom-5 ${display} text-2xl lg:text-[30px] tracking-[-0.03em] leading-none`}>Quotes before work</span>
          </Photo>
          <Photo src={PHOTOS.plumber} alt="A KaziHub plumber with a customer" tone="#D7C5B0" icon={Wrench} style={{ animationDelay: '470ms' }} className="kh-rise h-[180px] lg:h-auto lg:col-span-4 rounded-3xl lg:rounded-[28px]" >
            <span className={`absolute left-4 lg:left-6 bottom-4 lg:bottom-5 ${display} text-lg lg:text-[26px] tracking-[-0.03em] leading-none`}>People near you</span>
          </Photo>
          <Photo src={PHOTOS.solar} alt="A KaziHub solar installer on a rooftop" tone="#C6B4A0" icon={Sun} style={{ animationDelay: '560ms' }} className="kh-rise hidden lg:block lg:col-span-3 lg:row-span-2 rounded-[28px]">
            <span className={`absolute left-6 bottom-5 ${display} text-[26px] tracking-[-0.03em] leading-none`}>Paid when done</span>
          </Photo>
          <div className="kh-rise h-[180px] lg:h-auto lg:col-start-6 lg:col-span-4 lg:row-start-2 rounded-3xl lg:rounded-[28px] p-[18px] lg:px-[30px] lg:py-[26px] flex flex-col lg:flex-row justify-between lg:justify-start lg:items-center gap-3 lg:gap-[22px]" style={{ background: C.indigo, color: C.cream, animationDelay: '650ms' }}>
            <span className={`${display} text-[44px] lg:text-[64px] tracking-[-0.05em] leading-none`} style={{ color: C.mint }}>ID+</span>
            <span className="text-[13px] lg:text-[17px] leading-snug font-semibold">
              <span className="lg:hidden">Government ID and live selfie checked</span>
              <span className="hidden lg:inline">Every artisan checked with a government ID and a live selfie before the Verified badge.</span>
            </span>
          </div>
        </section>

        {/* ───────── Trades: expanding cards (desktop) / accordion (phone) ───────── */}
        <section id="trades" className="scroll-mt-6 px-5 lg:px-[72px] pt-16 lg:pt-[104px] flex flex-col gap-6 lg:gap-9">
          <div className="flex items-end justify-between gap-10">
            <h2 className={`${display} text-[52px] lg:text-[84px] leading-[0.9] tracking-[-0.055em]`}>Sixteen trades.<br className="hidden lg:block" /> One place.</h2>
            <Link to={CLIENT_SIGNUP} className="hidden lg:inline text-[17px] font-extrabold underline-offset-[5px] hover:underline">See all 16 →</Link>
          </div>
          <ul className="flex flex-col lg:flex-row gap-2 lg:gap-3.5 lg:h-[480px]">
            {TRADES.map((t, i) => {
              const open = i === openTrade;
              return (
                <li
                  key={t.name}
                  onMouseEnter={isDesktop ? () => setOpenTrade(i) : undefined}
                  className="relative box-border overflow-hidden rounded-[22px] lg:rounded-[26px] border-2 flex flex-col min-w-0"
                  style={{
                    background: t.bg,
                    color: t.fg,
                    borderColor: t.bg,
                    ...(isDesktop
                      ? { flexGrow: open ? 3.6 : 1, flexBasis: 0, transition: `flex-grow 620ms ${EASE}` }
                      : { height: open ? 330 : 64, transition: `height 520ms ${EASE}` }),
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenTrade(isDesktop ? i : (open ? -1 : i))}
                    onFocus={isDesktop ? () => setOpenTrade(i) : undefined}
                    aria-expanded={open}
                    className="shrink-0 min-h-[60px] lg:min-h-16 box-border flex items-center lg:items-start justify-between gap-3 pl-[18px] pr-3 lg:px-[18px] py-3 lg:pt-[18px] lg:pb-3.5 text-left text-[17px] lg:text-lg font-extrabold leading-tight cursor-pointer"
                  >
                    <span className="min-w-0">{t.name}</span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 h-[34px] rounded-full flex items-center justify-center overflow-hidden"
                      style={{
                        background: t.fg,
                        color: t.bg,
                        // Closed desktop cards are narrow: the arrow steps aside so the trade's name fits.
                        opacity: isDesktop && !open ? 0 : 1,
                        width: isDesktop && !open ? 0 : 34,
                        transform: `rotate(${isDesktop ? (open ? '0deg' : '45deg') : (open ? '45deg' : '0deg')})`,
                        transition: `transform 480ms ${EASE}, opacity 300ms ease, width 480ms ${EASE}`,
                      }}
                    >
                      {isDesktop ? <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} /> : <Plus className="w-4 h-4" strokeWidth={2.4} />}
                    </span>
                  </button>
                  {open && (
                    <Photo src={t.photo} alt={`A KaziHub ${t.name.toLowerCase().replace(/s$/, '')} at work`} tone={t.tone} icon={t.icon} className="kh-fade flex-1 mx-[5px] lg:mx-1.5 mb-[5px] lg:mb-1.5 rounded-[17px] lg:rounded-[20px]">
                      <div className="kh-rise absolute left-2.5 right-2.5 bottom-2.5 lg:left-3 lg:right-3 lg:bottom-3 box-border rounded-[14px] lg:rounded-2xl p-3.5 lg:px-5 lg:py-[18px] flex flex-col lg:flex-row lg:items-end lg:justify-between gap-2 lg:gap-[18px]" style={{ background: C.cream, color: C.navy, animationDelay: '180ms' }}>
                        <p className="text-sm lg:text-base leading-snug font-semibold lg:max-w-[300px]">{t.blurb}</p>
                        <Link to={CLIENT_SIGNUP} className="shrink-0 text-sm lg:text-[15px] font-extrabold underline-offset-4 hover:underline">See {t.name.toLowerCase().replace('ac ', 'AC ')} →</Link>
                      </div>
                    </Photo>
                  )}
                </li>
              );
            })}
          </ul>
          <Link to={CLIENT_SIGNUP} className="lg:hidden self-start text-[15px] font-extrabold underline-offset-[5px] hover:underline">See all 16 →</Link>
        </section>

        {/* ───────── Fact grid: true facts only; numbers count up once on first view ───────── */}
        <section id="why" ref={why.ref} className="scroll-mt-6 px-5 lg:px-[72px] pt-16 lg:pt-28 grid grid-cols-2 lg:grid-cols-12 lg:grid-rows-3 gap-2.5 lg:gap-3.5 lg:h-[708px]">
          {[
            <div key="lead" className="order-1 lg:order-none col-span-2 lg:col-span-5 rounded-[22px] lg:rounded-[26px] bg-white border-2 p-[22px] lg:p-[30px] flex flex-col justify-between gap-6" style={{ borderColor: C.navy }}>
              <p className={`${display} text-[30px] lg:text-4xl leading-none tracking-[-0.035em]`}>The secret to hiring well? Checks, and money held until it’s done.</p>
              <span className="hidden lg:block text-sm font-bold">How KaziHub works</span>
            </div>,
            <div key="trades" className="order-2 lg:order-none relative overflow-hidden h-[170px] lg:h-auto lg:col-span-7 rounded-[22px] lg:rounded-[26px] p-[18px] lg:p-[30px] flex flex-col justify-between" style={{ background: C.indigo, color: C.cream }}>
              <Swoosh viewBox="0 0 420 300" d="M60 40 C 60 260, 250 260, 250 110 S 400 -20, 400 200" color={C.mint} width={56} className="w-[130px] lg:w-[420px] -right-14 lg:-right-10 -top-12 lg:-top-[60px]" />
              <span className={`relative ${display} text-[64px] lg:text-[120px] leading-[0.8] tracking-[-0.06em] tabular-nums`}>{nTrades}</span>
              <span className="relative text-[13px] lg:text-base font-semibold lg:max-w-[280px]">
                <span className="lg:hidden">trades</span>
                <span className="hidden lg:inline">trades, from electricians and plumbers to tailors and event pros</span>
              </span>
            </div>,
            <div key="states" className="order-4 lg:order-none relative overflow-hidden col-span-2 lg:col-span-6 h-[170px] lg:h-auto rounded-[22px] lg:rounded-[26px] p-5 lg:p-[30px] flex flex-col justify-between" style={{ background: C.orange }}>
              <Swoosh viewBox="0 0 300 260" d="M40 240 C 40 60, 260 60, 260 220" color={C.orangeSoft} width={54} className="w-[200px] lg:w-[300px] -right-8 -bottom-16 lg:-bottom-[70px]" />
              <span className={`relative ${display} text-[72px] lg:text-[120px] leading-[0.8] tracking-[-0.06em] tabular-nums`}>{nStates} + FCT</span>
              <span className="relative text-sm lg:text-base font-bold">Every Nigerian state, plus Abuja</span>
            </div>,
            <div key="escrow" className="order-3 lg:order-none h-[170px] lg:h-auto lg:col-span-6 rounded-[22px] lg:rounded-[26px] p-[18px] lg:p-[30px] flex flex-col justify-between" style={{ background: C.pink }}>
              <span className={`${display} text-[64px] lg:text-[120px] leading-[0.8] tracking-[-0.06em]`}>₦0</span>
              <span className="text-[13px] lg:text-base font-bold lg:max-w-[380px]">
                <span className="lg:hidden">to the artisan until you confirm</span>
                <span className="hidden lg:inline">reaches the artisan until you confirm the job is done. It waits in escrow.</span>
              </span>
            </div>,
            <div key="record" className="relative overflow-hidden hidden lg:flex lg:col-span-7 rounded-[26px] p-[30px] items-center justify-center" style={{ background: C.mint }}>
              <Swoosh viewBox="0 0 260 260" d="M30 30 C 30 200, 200 230, 230 60" color={C.indigo} width={50} className="w-[220px] -left-[110px] -bottom-24" />
              <p className={`relative text-center ${display} text-[44px] leading-none tracking-[-0.04em]`}>Checked pros, clear quotes,<br />and a record of every job</p>
            </div>,
            <div key="reviews" className="order-5 lg:order-none relative overflow-hidden col-span-2 lg:col-span-5 rounded-[22px] lg:rounded-[26px] p-[22px] lg:p-[30px] flex flex-col justify-between gap-3" style={{ background: C.navy, color: C.cream }}>
              <Swoosh viewBox="0 0 220 240" d="M190 20 C 40 20, 40 220, 190 220" color={C.orange} width={48} className="hidden lg:block w-[220px] -right-[50px] -top-10" />
              <span className={`relative ${display} text-[34px] lg:text-[44px] leading-[0.95] tracking-[-0.04em]`}>Reviews from<br className="hidden lg:block" /> real jobs only</span>
              <span className="relative text-sm leading-relaxed" style={{ color: C.muted }}>Only after a paid, completed booking. No friends, no fakes.</span>
            </div>,
          ].map((tile, i) => (
            <div key={i} className="contents">
              {React.cloneElement(tile, {
                style: {
                  ...(tile.props.style || {}),
                  opacity: why.inView ? 1 : 0,
                  transform: why.inView ? 'none' : 'translateY(40px)',
                  transition: `opacity 600ms ease ${i * 90}ms, transform 800ms ${EASE} ${i * 90}ms`,
                },
              })}
            </div>
          ))}
        </section>

        {/* ───────── For artisans ───────── */}
        <section
          id="artisans"
          ref={artisans.ref}
          className="scroll-mt-6 mx-5 lg:mx-[72px] mt-16 lg:mt-28 rounded-[28px] lg:rounded-[32px] overflow-hidden grid lg:grid-cols-12 gap-5 lg:gap-6 p-[22px] lg:p-0 lg:h-[460px]"
          style={{
            background: C.peach,
            opacity: artisans.inView ? 1 : 0,
            transform: artisans.inView ? 'none' : 'translateY(40px)',
            transition: `opacity 600ms ease, transform 800ms ${EASE}`,
          }}
        >
          <div className="lg:col-span-7 lg:py-14 lg:pl-14 flex flex-col justify-between gap-5">
            <h2 className={`${display} text-[48px] lg:text-[80px] leading-[0.9] tracking-[-0.055em]`}>You do the work. The money don already land.</h2>
            <Photo src={PHOTOS.artisanPhone} alt="An artisan checking a job request on their phone" tone="#D7C5B0" icon={Smartphone} className="lg:hidden h-[180px] rounded-[20px]" />
            <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-7">
              <Link to={ARTISAN_SIGNUP} className={`order-last lg:order-none text-center px-7 py-[19px] lg:py-5 rounded-2xl text-[17px] font-extrabold ${pressable}`} style={{ background: C.navy, color: C.cream }}>
                Join as an artisan
              </Link>
              <p className="text-[15px] lg:text-base leading-normal font-medium lg:max-w-[340px]">Requests from people near you, quotes from your phone, payment secured before you start.</p>
            </div>
          </div>
          <Photo src={PHOTOS.artisanPhone} alt="An artisan checking a job request on their phone" tone="#D7C5B0" icon={Smartphone} className="hidden lg:block lg:col-start-9 lg:col-span-4 my-5 mr-5 rounded-3xl" />
        </section>
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="mt-16 lg:mt-28 overflow-hidden" style={{ background: C.navy, color: C.cream }}>
        <div className="max-w-[1440px] mx-auto px-5 lg:px-[72px] pt-12 lg:pt-20 flex flex-col gap-10 lg:gap-16">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-6">
            <div className="lg:col-span-5 flex flex-col items-start gap-6 lg:gap-7">
              <p className={`${display} text-[32px] lg:text-[40px] leading-none tracking-[-0.04em]`}>Checked artisans. Money held until it’s done.</p>
              <Link to={CLIENT_SIGNUP} className={`px-6 lg:px-[26px] py-[17px] lg:py-[18px] rounded-2xl text-base font-extrabold ${pressable}`} style={{ background: C.orange, color: C.navy }}>Find an artisan</Link>
            </div>
            <div className="lg:col-start-7 lg:col-span-6 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-7 text-[15px] font-semibold">
              <nav aria-label="Customers" className="flex flex-col">
                <span className="pb-2 text-xs lg:text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ color: C.mint }}>Customers</span>
                <Link to={CLIENT_SIGNUP} className="py-2 hover:underline underline-offset-4">Find an artisan</Link>
                <button type="button" onClick={() => setLegal('escrow')} className="py-2 text-left hover:underline underline-offset-4 cursor-pointer">How escrow works</button>
                <a href="#trades" className="py-2 hover:underline underline-offset-4">All 16 trades</a>
              </nav>
              <nav aria-label="Artisans" className="flex flex-col">
                <span className="pb-2 text-xs lg:text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ color: C.mint }}>Artisans</span>
                <Link to={ARTISAN_SIGNUP} className="py-2 hover:underline underline-offset-4">Join KaziHub</Link>
                <Link to="/signin" className="py-2 hover:underline underline-offset-4">Sign in</Link>
              </nav>
              <nav aria-label="KaziHub" className="col-span-2 lg:col-span-1 flex flex-row flex-wrap lg:flex-col gap-x-5">
                <span className="hidden lg:block pb-2 text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ color: C.mint }}>KaziHub</span>
                <button type="button" onClick={() => setLegal('terms')} className="py-2 text-left hover:underline underline-offset-4 cursor-pointer">Terms</button>
                <button type="button" onClick={() => setLegal('privacy')} className="py-2 text-left hover:underline underline-offset-4 cursor-pointer">Privacy</button>
              </nav>
            </div>
          </div>
          <div className="flex flex-col gap-5 lg:gap-7">
            <div className="pt-5 lg:pt-6 border-t border-[#243A66] flex flex-col lg:flex-row lg:justify-between gap-1 text-[13px] lg:text-sm font-semibold" style={{ color: C.muted }}>
              <span>Across all 36 states and the FCT</span>
              <span>Payments held in escrow until you confirm</span>
            </div>
            <span aria-hidden="true" className={`block -mb-[0.16em] ${display} text-[clamp(6rem,25.8vw,23.25rem)] leading-[0.8] tracking-[-0.065em] whitespace-nowrap text-[#1B3160]`}>KaziHub</span>
          </div>
        </div>
      </footer>

      <TermsAndPrivacyModal isOpen={legal !== null} onClose={() => setLegal(null)} initialTab={legal ?? 'terms'} />
    </div>
  );
};
