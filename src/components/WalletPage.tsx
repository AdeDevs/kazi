import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, Banknote, CheckCircle2, Clock, Copy, CreditCard, HandCoins, Info, Lock, Undo2, Wallet, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Booking, BookingStatusHistoryEntry, Role } from '../types';
import { formatCurrency, formatCurrencyExact } from '../utils';
import { getBooking } from '../lib/bookingsApi';
import { useAccountFrozen } from '../hooks/useAccountFrozen';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { PersonAvatar } from './ui/PersonAvatar';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { ConsequenceSheet } from './ui/ConsequenceSheet';
import { PayoutSection } from './settings/PayoutSection';
import { FEATURES } from '../lib/features';
import { useAuth } from '../context/AuthContext';

/**
 * Wallet: money from bookings. The backend has no balance or ledger yet (backend asks 49–52), so
 * every figure here is added up from the bookings themselves, and nothing is shown that bookings
 * can't back up: no withdraw button, no dated activity feed, no payout-landed status.
 */

// ── Money per booking ────────────────────────────────────────────────────────────────────────

const paidIn = (b: Booking) => b.escrow_amount || b.amount || 0;
/** The artisan's share: the backend's figure once escrow is priced, else price minus the fees. */
const artisanShare = (b: Booking) =>
  (b.artisan_earnings ?? 0) > 0 ? (b.artisan_earnings as number) : Math.max(0, paidIn(b) - (b.platform_fee || 0) - (b.gateway_fee || 0));
/** Real bookings always carry escrow_status; the demo's sample bookings predate it, so infer it from status. */
const escrowOf = (b: Booking): string => {
  if (b.escrow_status) return b.escrow_status;
  if (b.status === 'paid_out') return 'released_to_artisan';
  if (['escrow_funded', 'in_progress', 'completed_by_artisan', 'disputed'].includes(b.status)) return 'held_in_escrow';
  return 'unfunded';
};
const isFunded = (b: Booking) => escrowOf(b) !== 'unfunded';
const isHeld = (b: Booking) => escrowOf(b) === 'held_in_escrow';
const isReleasing = (b: Booking) => isHeld(b) && b.status === 'completed_by_artisan';
const isReleased = (b: Booking) => escrowOf(b) === 'released_to_artisan' || b.status === 'paid_out';
const isRefunded = (b: Booking) => escrowOf(b) === 'refunded_to_client';
const isPartRefunded = (b: Booking) => escrowOf(b) === 'partially_refunded';

const dayFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' });
const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
};
const inDays = (n: number | null) => (n === null ? '' : n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`);

/** "KZ-ESCROW-6ac692fd-6ac69307c36fa3897f203d2f" => "KZ-ESCROW-6ac6…3d2f" for rows; the sheet shows it whole. */
const shortRef = (ref: string) => (ref.length > 20 ? `${ref.slice(0, 14)}…${ref.slice(-4)}` : ref);

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Reference copied.');
  } catch {
    toast.error('Couldn’t copy. Press and hold the reference to copy it.');
  }
};

// ── Status pills (one colour per meaning, used by cards, pills and the sheet) ─────────────────

type Tone = 'held' | 'released' | 'releasing' | 'refunded' | 'neutral' | 'failed';
const TONE: Record<Tone, string> = {
  held: 'bg-navy-50 text-navy-800 dark:bg-navy-950 dark:text-navy-300',
  released: 'bg-emerald-50 text-emerald-700 dark:bg-[#022C22] dark:text-emerald-300',
  releasing: 'bg-amber-50 text-amber-700 dark:bg-[#2A1E05] dark:text-amber-300',
  refunded: 'bg-orange-50 text-orange-700 dark:bg-[#2A1306] dark:text-orange-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  failed: 'bg-rose-50 text-rose-700 dark:bg-[#2A0A12] dark:text-rose-300',
};

interface StatusInfo { tone: Tone; text: string; Icon: React.ComponentType<{ className?: string }> }

function artisanStatus(b: Booking): StatusInfo {
  if (isReleasing(b)) {
    const d = b.auto_completion_deadline;
    return { tone: 'releasing', Icon: Clock, text: d ? `Releases ${dayFormat.format(new Date(d))} · ${inDays(daysUntil(d))}` : 'Releasing soon' };
  }
  if (b.status === 'disputed') return { tone: 'failed', Icon: AlertCircle, text: 'On hold · issue raised' };
  if (isHeld(b)) return { tone: 'held', Icon: Lock, text: 'Held in escrow' };
  if (isReleased(b)) return { tone: 'released', Icon: CheckCircle2, text: 'Released to you' };
  if (isRefunded(b)) return { tone: 'refunded', Icon: Undo2, text: 'Refunded to client' };
  if (isPartRefunded(b)) return { tone: 'refunded', Icon: Undo2, text: 'Part refunded to client' };
  return { tone: 'neutral', Icon: Clock, text: 'Not paid yet' };
}

function clientStatus(b: Booking): StatusInfo {
  if (isReleasing(b)) return { tone: 'releasing', Icon: Clock, text: 'Waiting for you to confirm' };
  if (b.status === 'disputed') return { tone: 'failed', Icon: AlertCircle, text: 'On hold · issue raised' };
  if (isHeld(b)) return { tone: 'held', Icon: Lock, text: 'Held in escrow' };
  if (isReleased(b)) return { tone: 'released', Icon: CheckCircle2, text: 'Released' };
  if (isRefunded(b)) return { tone: 'refunded', Icon: Undo2, text: 'Refunded' };
  if (isPartRefunded(b)) return { tone: 'refunded', Icon: Undo2, text: 'Part refunded' };
  return { tone: 'neutral', Icon: Clock, text: 'Not paid yet' };
}

const Pill: React.FC<{ s: StatusInfo }> = ({ s }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${TONE[s.tone]}`}>
    <s.Icon className="w-3.5 h-3.5 shrink-0" />
    {s.text}
  </span>
);

// ── Page ─────────────────────────────────────────────────────────────────────────────────────

type ArtisanFilter = 'all' | 'held' | 'releasing' | 'released';
type ClientFilter = 'all' | 'held' | 'released' | 'refunded';

interface WalletPageProps {
  role: Role;
  /** This user's bookings (the same list Bookings / Jobs show). */
  bookings: Booking[];
  /** False until bookings have loaded once. */
  loaded: boolean;
  /** Client: confirm the job and release escrow (the hold-to-release sheet confirms first). */
  onReleasePayment?: (bookingId: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ role, bookings, loaded, onReleasePayment }) => {
  const isArtisan = role === 'professional';
  const navigate = useNavigate();
  const { blockIfFrozen } = useAccountFrozen();
  const [artisanFilter, setArtisanFilter] = useState<ArtisanFilter>('all');
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');
  const [showAll, setShowAll] = useState(false);
  const [openBooking, setOpenBooking] = useState<Booking | null>(null);
  const [releaseBooking, setReleaseBooking] = useState<Booking | null>(null);
  const [showHow, setShowHow] = useState(false);

  const funded = useMemo(
    () => bookings.filter(isFunded).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [bookings],
  );

  // Artisan figures
  const released = funded.filter(isReleased);
  const releasing = funded.filter(isReleasing).sort((a, b) => (a.auto_completion_deadline || '').localeCompare(b.auto_completion_deadline || ''));
  const held = funded.filter((b) => isHeld(b) && !isReleasing(b));
  const sum = (list: Booking[], f: (b: Booking) => number) => list.reduce((t, b) => t + f(b), 0);

  // Client figures
  const clientHeld = funded.filter(isHeld);
  const waitingOnYou = clientHeld.filter(isReleasing);
  const refundedFull = funded.filter(isRefunded);
  const partRefunded = funded.filter(isPartRefunded);

  const rows = isArtisan
    ? funded.filter((b) =>
        artisanFilter === 'all' ? true
        : artisanFilter === 'held' ? isHeld(b) && !isReleasing(b)
        : artisanFilter === 'releasing' ? isReleasing(b)
        : isReleased(b))
    : funded.filter((b) =>
        clientFilter === 'all' ? true
        : clientFilter === 'held' ? isHeld(b)
        : clientFilter === 'released' ? isReleased(b)
        : isRefunded(b) || isPartRefunded(b));
  const visibleRows = showAll ? rows : rows.slice(0, 8);

  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  return (
    <div className="w-full max-w-none space-y-5 md:space-y-6">
      {/* Phones: title + link. Larger screens show the title in the shell header and the link by the list heading. */}
      <header className="flex items-center justify-between gap-3 md:hidden">
        {/* Phones show the logo in the top bar, so the title lives here; the desktop shell shows it in its header. */}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 md:sr-only">Wallet</h1>
        <button
          type="button"
          onClick={() => setShowHow(true)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-800 dark:text-navy-300 hover:underline cursor-pointer"
        >
          <Info className="w-4 h-4" />
          How it works
        </button>
      </header>

      {/* Summary cards. Tapping one filters the list below (the cards are the filters). */}
      <section aria-label="Overview" className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {!loaded ? (
          [0, 1, 2].map((i) => <div key={i} className="h-[150px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />)
        ) : isArtisan ? (
          <>
            <SummaryCard
              label="Released to you" tone="released" Icon={Banknote}
              value={formatCurrencyExact(sum(released, artisanShare))}
              sub={released.length ? `Sent to your bank account, from ${plural(released.length, 'job')}` : 'No payouts yet'}
              selected={artisanFilter === 'released'} onSelect={() => setArtisanFilter(artisanFilter === 'released' ? 'all' : 'released')}
            />
            <SummaryCard
              label="In escrow" tone="held" Icon={Lock}
              value={formatCurrencyExact(sum(held, artisanShare))}
              sub={held.length ? `${plural(held.length, 'job')} paid, not finished` : 'Nothing held right now'}
              selected={artisanFilter === 'held'} onSelect={() => setArtisanFilter(artisanFilter === 'held' ? 'all' : 'held')}
            />
            <SummaryCard
              label="Releasing soon" tone="releasing" Icon={Clock}
              value={formatCurrencyExact(sum(releasing, artisanShare))}
              sub={releasing.length ? 'Marked done, releasing on their own' : 'Jobs you mark done show here'}
              selected={artisanFilter === 'releasing'} onSelect={() => setArtisanFilter(artisanFilter === 'releasing' ? 'all' : 'releasing')}
            >
              {releasing.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {releasing.slice(0, 2).map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span className="truncate">{b.customerName} · {formatCurrencyExact(artisanShare(b))}</span>
                      <span className="shrink-0 text-amber-700 dark:text-amber-300">{inDays(daysUntil(b.auto_completion_deadline))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SummaryCard>
          </>
        ) : (
          <>
            <SummaryCard
              label="Held in escrow" tone="held" Icon={Lock}
              value={formatCurrency(sum(clientHeld, paidIn))}
              sub={clientHeld.length
                ? `${plural(clientHeld.length, 'job')}${waitingOnYou.length ? ` · ${waitingOnYou.length} waiting for you to confirm` : ''}`
                : 'Nothing held right now'}
              selected={clientFilter === 'held'} onSelect={() => setClientFilter(clientFilter === 'held' ? 'all' : 'held')}
            />
            <SummaryCard
              label="Paid in total" tone="neutral" Icon={CreditCard}
              value={formatCurrency(sum(funded, paidIn))}
              sub={funded.length ? `Across ${plural(funded.length, 'job')}` : 'Nothing paid yet'}
              selected={false} onSelect={() => setClientFilter('all')}
            />
            <SummaryCard
              label="Refunded" tone="refunded" Icon={Undo2}
              value={formatCurrency(sum(refundedFull, paidIn))}
              sub={
                refundedFull.length || partRefunded.length
                  ? [refundedFull.length ? plural(refundedFull.length, 'job') : '', partRefunded.length ? `${plural(partRefunded.length, 'part refund')} not counted` : ''].filter(Boolean).join(', ')
                  : 'No refunds'
              }
              selected={clientFilter === 'refunded'} onSelect={() => setClientFilter(clientFilter === 'refunded' ? 'all' : 'refunded')}
            />
          </>
        )}
      </section>

      {/* The payout account is a setting, not a figure, so it's a slim line under the cards, not a fourth card. */}
      {(isArtisan || FEATURES.clientPayoutAccount) && <PayoutSection />}

      {!isArtisan && loaded && partRefunded.length > 0 && (
        <p role="status" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-orange-50 dark:bg-[#2A1306] text-orange-800 dark:text-orange-200 text-sm font-medium">
          <Undo2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {partRefunded.length === 1
              ? <>Part of your {formatCurrency(paidIn(partRefunded[0]))} for “{partRefunded[0].title || partRefunded[0].category}” was refunded. The exact amount isn’t available here yet.</>
              : <>{partRefunded.length} payments were part refunded. The exact amounts aren’t available here yet.</>}
          </span>
        </p>
      )}

      <section aria-labelledby="wallet-list-title" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 id="wallet-list-title" className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {isArtisan
                ? artisanFilter === 'all' ? 'Jobs' : artisanFilter === 'held' ? 'Held in escrow' : artisanFilter === 'releasing' ? 'Releasing soon' : 'Released to you'
                : clientFilter === 'all' ? 'Payments' : clientFilter === 'held' ? 'Held in escrow' : clientFilter === 'released' ? 'Released' : 'Refunded'}
            </h2>
            <span className="flex items-center gap-4">
              {(isArtisan ? artisanFilter : clientFilter) !== 'all' && (
                <button type="button" onClick={() => (isArtisan ? setArtisanFilter('all') : setClientFilter('all'))} className="text-sm font-bold text-navy-800 dark:text-navy-300 hover:underline cursor-pointer">
                  Show all
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowHow(true)}
                className="hidden md:inline-flex items-center gap-1.5 text-sm font-bold text-navy-800 dark:text-navy-300 hover:underline cursor-pointer"
              >
                <Info className="w-4 h-4" />
                How it works
              </button>
            </span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {!loaded ? (
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-4 border-t first:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                </div>
              ))
            ) : rows.length === 0 ? (
              funded.length === 0 ? (
                <EmptyState
                  title={isArtisan ? 'No jobs yet' : 'You haven’t paid for a job yet'}
                  text={isArtisan
                    ? 'When a client pays for a job, it shows here, held in escrow until you finish. Make sure you’re accepting new work.'
                    : 'When you book an artisan, your payment shows here. It stays in escrow until you confirm the job is done.'}
                  cta={isArtisan ? 'See job requests' : 'Find an artisan'}
                  onCta={() => navigate(isArtisan ? '/jobs' : '/home')}
                />
              ) : (
                <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Nothing here right now.</p>
              )
            ) : (
              <ul>
                {visibleRows.map((b) => {
                  const s = isArtisan ? artisanStatus(b) : clientStatus(b);
                  const name = isArtisan ? b.customerName : b.professionalName;
                  const avatar = isArtisan ? b.customerAvatar : b.professionalAvatar;
                  const canRelease = !isArtisan && isReleasing(b) && b.status === 'completed_by_artisan' && onReleasePayment;
                  return (
                    <li key={b.id} className="border-t first:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <PersonAvatar name={name} src={avatar} sizeClassName="w-10 h-10" roundedClassName="rounded-full" />
                        <button type="button" onClick={() => setOpenBooking(b)} className="flex-1 min-w-0 text-left cursor-pointer space-y-1.5">
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-[15px] font-bold text-slate-900 dark:text-zinc-100 leading-snug">{b.title || b.category}</span>
                            <span className="text-[15px] font-extrabold text-slate-900 dark:text-zinc-100 whitespace-nowrap tabular-nums">
                              {isArtisan ? formatCurrencyExact(artisanShare(b)) : formatCurrency(paidIn(b))}
                            </span>
                          </span>
                          <span className="block text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">
                            {name}{!isArtisan && b.category ? ` · ${b.category}` : ''}{isArtisan ? ' · your share' : ''}
                          </span>
                          <span className="flex items-center justify-between gap-2 flex-wrap">
                            <Pill s={s} />
                            {!isArtisan && b.payment_reference && (
                              <span className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">Receipt {shortRef(b.payment_reference)}</span>
                            )}
                          </span>
                        </button>
                      </div>
                      {canRelease && (
                        <div className="px-4 pb-3.5 -mt-1 pl-[68px]">
                          <button
                            type="button"
                            onClick={() => { if (!blockIfFrozen()) setReleaseBooking(b); }}
                            className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 text-white text-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Confirm & release
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {loaded && rows.length > 8 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <button type="button" onClick={() => setShowAll(!showAll)} className="text-sm font-bold text-navy-800 dark:text-navy-300 hover:underline cursor-pointer">
                  {showAll ? 'Show fewer' : `Show all ${rows.length}`}
                </button>
              </div>
            )}
          </div>
        </section>


      <HowItWorksSheet isOpen={showHow} isArtisan={isArtisan} onClose={() => setShowHow(false)} />
      <BreakdownSheet booking={openBooking} isArtisan={isArtisan} onClose={() => setOpenBooking(null)} />

      {/* Client: confirm and release, hold to confirm (same as from Bookings) */}
      <ConsequenceSheet
        isOpen={Boolean(releaseBooking)}
        onClose={() => setReleaseBooking(null)}
        theme="money"
        icon={Banknote}
        title="Release payment?"
        amount={releaseBooking ? { value: paidIn(releaseBooking), to: releaseBooking.professionalName } : undefined}
        description="Only release it once you’re happy with the work. Once it’s paid out, it can’t be pulled back."
        pillsLabel="This will"
        pills={[{ label: 'Mark the job done', Icon: CheckCircle2 }, { label: 'Pay the artisan', Icon: HandCoins }]}
        note="Not happy with the job? Close this and report an issue from Bookings instead."
        confirm="hold"
        primaryLabel="Hold to release payment"
        busyLabel="Releasing…"
        onPrimary={() => {
          if (releaseBooking && onReleasePayment) onReleasePayment(releaseBooking.id);
          setReleaseBooking(null);
        }}
        secondaryLabel="Not yet"
      />
    </div>
  );
};

// ── Pieces ───────────────────────────────────────────────────────────────────────────────────

const SummaryCard: React.FC<{
  label: string; value: string; sub: string; tone: Tone; Icon: React.ComponentType<{ className?: string }>;
  selected: boolean; onSelect: () => void; children?: React.ReactNode;
}> = ({ label, value, sub, tone, Icon, selected, onSelect, children }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`text-left flex flex-col justify-start rounded-2xl bg-white dark:bg-slate-900 border p-5 md:p-[22px] cursor-pointer transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.99] ${
      selected
        ? 'border-navy-800 dark:border-navy-300 ring-1 ring-navy-800/30 dark:ring-navy-300/30'
        : 'border-slate-200 dark:border-slate-800 hover:border-navy-800/40 dark:hover:border-navy-300/40'
    }`}
  >
    <span className="flex items-start justify-between gap-3">
      <span className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`shrink-0 w-10 h-10 rounded-[11px] flex items-center justify-center ${TONE[tone]}`}>
        <Icon className="w-[19px] h-[19px]" />
      </span>
    </span>
    <span className="block mt-3.5 text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{value}</span>
    <span className="block mt-1 text-[13.5px] font-medium text-slate-500 dark:text-slate-400">{sub}</span>
    {children}
  </button>
);

const EmptyState: React.FC<{ title: string; text: string; cta: string; onCta: () => void }> = ({ title, text, cta, onCta }) => (
  <div className="flex flex-col items-center text-center gap-2.5 px-6 py-10">
    <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-600" strokeWidth={1.4} />
    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-zinc-100">{title}</p>
    <p className="max-w-[320px] text-[13.5px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">{text}</p>
    <button
      type="button"
      onClick={onCta}
      className="mt-2 h-11 px-5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 text-white text-sm font-bold inline-flex items-center gap-2 transition-[background-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer"
    >
      {cta} <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

/** "How it works", opened from the link by the title: useful once, so not always on the page. */
const HowItWorksSheet: React.FC<{ isOpen: boolean; isArtisan: boolean; onClose: () => void }> = ({ isOpen, isArtisan, onClose }) => {
  const sheet = useSlideUpSheet(isOpen, onClose);
  if (!sheet.shouldRender) return null;
  const steps = isArtisan
    ? [
        ['Client pays into escrow', 'KaziHub holds the money, not the client.'],
        ['You finish and mark it done', 'The client has 4 days to confirm or raise an issue.'],
        ['It’s released to your bank', 'Automatically, to your payout account, minus the KaziHub and Paystack fees.'],
      ]
    : [
        ['You pay into escrow', 'KaziHub holds it. The artisan can see it’s there.'],
        ['The artisan does the job', 'You check the work.'],
        ['You confirm, they get paid', 'Not happy? Raise an issue before you confirm and the money stays held.'],
      ];
  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm ${sheet.backdropAnimationClasses}`} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-title"
        className={`w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] space-y-4 ${sheet.sheetAnimationClasses}`}
        style={sheet.dragStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetDragHandle dragHandleProps={sheet.dragHandleProps} />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        <h2 id="how-title" className="text-xl font-extrabold text-slate-900 dark:text-zinc-100 pr-8">{isArtisan ? 'How payouts work' : 'How escrow works'}</h2>
        <ol className="space-y-3.5">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-300 text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
              <span className="space-y-0.5">
                <span className="block text-[15px] font-bold text-slate-900 dark:text-zinc-100">{t}</span>
                <span className="block text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          {isArtisan ? 'There’s nothing to withdraw: your share is sent as soon as a job is released.' : 'Each payment’s receipt number is its Paystack reference. Quote it if you contact support about a payment.'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 text-white text-sm font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

/** Tap a row: how the money splits, the full reference, and a short timeline from the booking's history. */
const BreakdownSheet: React.FC<{ booking: Booking | null; isArtisan: boolean; onClose: () => void }> = ({ booking, isArtisan, onClose }) => {
  const { isDemo } = useAuth();
  const sheet = useSlideUpSheet(Boolean(booking), onClose);
  const [shown, setShown] = useState<Booking | null>(booking);
  const [timeline, setTimeline] = useState<BookingStatusHistoryEntry[] | null>(null);

  useEffect(() => {
    if (!booking) return;
    setShown(booking);
    setTimeline(booking.timeline ?? null);
    // Demo bookings exist only in this browser, so there's no server history to fetch.
    if (booking.timeline || isDemo) {
      if (isDemo) setTimeline([]);
      return;
    }
    // One request for the booking the person opened (its detail carries the dated history).
    let cancelled = false;
    getBooking(booking.id)
      .then((d) => { if (!cancelled) setTimeline(d.timeline ?? []); })
      .catch(() => { if (!cancelled) setTimeline([]); });
    return () => { cancelled = true; };
  }, [booking, isDemo]);

  if (!sheet.shouldRender || !shown) return null;
  const b = shown;
  const s = isArtisan ? artisanStatus(b) : clientStatus(b);
  const rate = b.platform_commission_rate ? Math.round(b.platform_commission_rate * 1000) / 10 : null;
  const when = (status: string) => timeline?.find((e) => e.to_status === status)?.created_at;
  const steps: { label: string; at?: string; done: boolean }[] = [
    { label: isArtisan ? 'Client paid into escrow' : 'You paid into escrow', at: when('escrow_funded'), done: true },
    { label: isArtisan ? 'You marked it done' : 'Artisan marked it done', at: when('completed_by_artisan'), done: Boolean(when('completed_by_artisan')) || isReleasing(b) || isReleased(b) },
    isReleased(b)
      ? { label: isArtisan ? 'Released to you' : 'Released to the artisan', at: when('paid_out'), done: true }
      : isRefunded(b) || isPartRefunded(b)
        ? { label: isPartRefunded(b) ? 'Part refunded' : 'Refunded', done: true }
        : { label: 'Releases on its own', at: b.auto_completion_deadline, done: false },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm ${sheet.backdropAnimationClasses}`} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="breakdown-title"
        className={`w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] space-y-5 ${sheet.sheetAnimationClasses}`}
        style={sheet.dragStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetDragHandle dragHandleProps={sheet.dragHandleProps} />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-2 pr-8">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Payment breakdown</p>
          <h2 id="breakdown-title" className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">{b.title || b.category}</h2>
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={isArtisan ? b.customerName : b.professionalName} src={isArtisan ? b.customerAvatar : b.professionalAvatar} sizeClassName="w-7 h-7" roundedClassName="rounded-full" textClassName="text-[10px] font-bold" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{isArtisan ? b.customerName : b.professionalName}</span>
          </div>
          <Pill s={s} />
        </div>

        <dl className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <Line label={isArtisan ? 'Job price' : 'You paid'} value={formatCurrencyExact(paidIn(b))} />
          {isArtisan && (
            <>
              {/* Only what the booking actually carries: no made-up zero fees. */}
              {typeof b.platform_fee === 'number' && <Line label={`KaziHub fee${rate !== null ? ` (${rate}%)` : ''}`} value={`−${formatCurrencyExact(b.platform_fee)}`} muted />}
              {typeof b.gateway_fee === 'number' && <Line label="Paystack fee" value={`−${formatCurrencyExact(b.gateway_fee)}`} muted />}
              <Line label="Your share" value={formatCurrencyExact(artisanShare(b))} strong />
            </>
          )}
        </dl>

        {b.payment_reference && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{isArtisan ? 'Payment reference' : 'Receipt number (Paystack reference)'}</p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <code className="flex-1 min-w-0 font-mono text-xs text-slate-700 dark:text-slate-200 break-all select-all">{b.payment_reference}</code>
              <button type="button" onClick={() => copy(b.payment_reference as string)} aria-label="Copy reference" className="shrink-0 p-2 rounded-lg text-slate-500 hover:text-navy-800 dark:hover:text-navy-300 hover:bg-white dark:hover:bg-slate-900 cursor-pointer">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Timeline</p>
          <ol className="space-y-2.5">
            {steps.map((st) => (
              <li key={st.label} className="flex items-center gap-2.5 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.done ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} aria-hidden="true" />
                <span className={st.done ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}>{st.label}</span>
                {timeline === null && st.done ? (
                  <span className="ml-auto h-3 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" aria-label="Loading date" />
                ) : st.at ? (
                  <span className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">{dayFormat.format(new Date(st.at))}</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

const Line: React.FC<{ label: string; value: string; muted?: boolean; strong?: boolean }> = ({ label, value, muted, strong }) => (
  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
    <dt className={muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'}>{label}</dt>
    <dd className={`tabular-nums ${strong ? 'text-base font-extrabold text-slate-900 dark:text-zinc-100' : muted ? 'text-slate-500 dark:text-slate-400' : 'font-bold text-slate-900 dark:text-zinc-100'}`}>{value}</dd>
  </div>
);
