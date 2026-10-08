import React from 'react';
import { formatCurrency } from '../../utils';

/**
 * Small app screens drawn in a phone frame, used as illustrations on the landing and auth pages
 * (from the design canvas). Purely decorative: every one is aria-hidden, and the names and
 * amounts in them are illustrative, not data.
 *
 * Each screen is written at the frame's natural size (38px corners, 9px bezel); `scale` shrinks
 * or grows the whole phone, so one screen serves every placement.
 */
export const Phone: React.FC<{
  /** Natural size of the phone, before scaling. */
  w: number;
  h: number;
  scale: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ w, h, scale, className, style, children }) => (
  <div aria-hidden="true" className={className} style={{ width: w * scale, height: h * scale, ...style }}>
    <div
      style={{
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
        boxSizing: 'border-box',
        borderRadius: 38,
        background: '#0B1B3A',
        padding: 9,
        boxShadow: '0 18px 36px rgba(11,27,58,0.18)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          borderRadius: 30,
          background: '#FFF6EC',
          overflow: 'hidden',
          padding: '16px 14px',
          color: '#0B1B3A',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          textAlign: 'left',
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

// base 300.0 x 450.0
export const MockQuote = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 12 }}>
      <span>9:41</span>
      <span>Quote</span>
      <span>•••</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', flexShrink: '0', width: 40, height: 40, borderRadius: '50%', background: '#FFE3CC', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 12, top: 8, width: 16, height: 16, borderRadius: '50%', background: '#8A4A30' }} />
        <div style={{ position: 'absolute', left: 11.2, top: 6.4, width: 17.6, height: 8, borderRadius: '8px 8px 0 0', background: '#0B1B3A' }} />
        <div style={{ position: 'absolute', left: 6, top: 25.6, width: 28, height: 20, borderRadius: '14px 14px 0 0', background: '#FF6A2B' }} />
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: '800' }}>Musa Adebayo</div>
        <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Plumber · Bodija · ★ 4.9</div>
      </div>
    </div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, marginTop: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Leak under kitchen sink</div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 32, margin: '4px 0 6px' }}>{formatCurrency(18500)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: '600', padding: '6px 0', borderBottom: '1px dashed #E6DED3' }}>
        <span>Slip-joint + washer</span>
        <span>{formatCurrency(6500)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: '600', padding: '6px 0', borderBottom: '1px dashed #E6DED3' }}>
        <span>Labour</span>
        <span>{formatCurrency(10000)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: '600', padding: '6px 0' }}>
        <span>Transport</span>
        <span>{formatCurrency(2000)}</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, boxSizing: 'border-box', borderRadius: 14, background: '#FF6A2B', marginTop: 12, fontSize: 14, fontWeight: '800' }}>Accept quote</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40, boxSizing: 'border-box', borderRadius: 14, border: '2px solid #0B1B3A', marginTop: 8, fontSize: 14, fontWeight: '800' }}>Ask a question</div>
  </>
);

// base 286.0 x 440.0
export const MockNearYou = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 12 }}>
      <span>9:41</span>
      <span>Near you</span>
      <span>•••</span>
    </div>
    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 18, marginBottom: 4 }}>Bodija, Ibadan</div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 10, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flexShrink: '0', width: 34, height: 34, borderRadius: '50%', background: '#FFE3CC', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 10.1, top: 6.9, width: 13.6, height: 13.6, borderRadius: '50%', background: '#8A4A30' }} />
          <div style={{ position: 'absolute', left: 9.6, top: 5.4, width: 15, height: 6.9, borderRadius: '6.9px 6.9px 0 0', background: '#0B1B3A' }} />
          <div style={{ position: 'absolute', left: 5.1, top: 21.7, width: 23.9, height: 17, borderRadius: '11.9px 11.9px 0 0', background: '#FF6A2B' }} />
        </div>
        <div style={{ flexGrow: '1', minWidth: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: '800', whiteSpace: 'nowrap' }}>Musa A.<span style={{ flexShrink: '0', width: 14, height: 14, borderRadius: '50%', background: '#9BF0C4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: '900' }}>✓</span></div>
          <div style={{ fontSize: 11.4, fontWeight: '600', color: '#3A4458', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Plumber</div>
        </div>
        <span style={{ flexShrink: '0', whiteSpace: 'nowrap', padding: '4px 9px', borderRadius: 999, background: '#FFE3CC', fontSize: 11, fontWeight: '800' }}>0.8 km</span>
      </div>
    </div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 10, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flexShrink: '0', width: 34, height: 34, borderRadius: '50%', background: '#FFE3CC', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 10.1, top: 6.9, width: 13.6, height: 13.6, borderRadius: '50%', background: '#8A4A30' }} />
          <div style={{ position: 'absolute', left: 9.6, top: 5.4, width: 15, height: 6.9, borderRadius: '6.9px 6.9px 0 0', background: '#FFB020' }} />
          <div style={{ position: 'absolute', left: 5.1, top: 21.7, width: 23.9, height: 17, borderRadius: '11.9px 11.9px 0 0', background: '#3B35C9' }} />
        </div>
        <div style={{ flexGrow: '1', minWidth: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: '800', whiteSpace: 'nowrap' }}>Bisi A.<span style={{ flexShrink: '0', width: 14, height: 14, borderRadius: '50%', background: '#9BF0C4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: '900' }}>✓</span></div>
          <div style={{ fontSize: 11.4, fontWeight: '600', color: '#3A4458', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Electrician</div>
        </div>
        <span style={{ flexShrink: '0', whiteSpace: 'nowrap', padding: '4px 9px', borderRadius: 999, background: '#FFE3CC', fontSize: 11, fontWeight: '800' }}>1.2 km</span>
      </div>
    </div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 10, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flexShrink: '0', width: 34, height: 34, borderRadius: '50%', background: '#FFE3CC', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 10.1, top: 6.9, width: 13.6, height: 13.6, borderRadius: '50%', background: '#8A4A30' }} />
          <div style={{ position: 'absolute', left: 9.6, top: 5.4, width: 15, height: 6.9, borderRadius: '6.9px 6.9px 0 0', background: '#0B1B3A' }} />
          <div style={{ position: 'absolute', left: 5.1, top: 21.7, width: 23.9, height: 17, borderRadius: '11.9px 11.9px 0 0', background: '#6FD9A6' }} />
        </div>
        <div style={{ flexGrow: '1', minWidth: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: '800', whiteSpace: 'nowrap' }}>Tunde B.<span style={{ flexShrink: '0', width: 14, height: 14, borderRadius: '50%', background: '#9BF0C4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: '900' }}>✓</span></div>
          <div style={{ fontSize: 11.4, fontWeight: '600', color: '#3A4458', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AC technician</div>
        </div>
        <span style={{ flexShrink: '0', whiteSpace: 'nowrap', padding: '4px 9px', borderRadius: 999, background: '#FFE3CC', fontSize: 11, fontWeight: '800' }}>2.1 km</span>
      </div>
    </div>
  </>
);

// base 272.0 x 450.0
export const MockPayment = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 12 }}>
      <span>9:41</span>
      <span>Payment</span>
      <span>•••</span>
    </div>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#0B1B3A', color: '#FFF6EC', fontSize: 11, fontWeight: '800' }}><svg width="11px" height="11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
  <rect x="4" y="11" width="16" height="10" rx="2" />
  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
</svg>{' '}Held in escrow</span>
    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 30, margin: '8px 0 2px' }}>{formatCurrency(18500)}</div>
    <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Musa · Plumber</div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 10, marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0' }}>
        <div style={{ flexShrink: '0', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: '900', background: '#9BF0C4' }}>✓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: '800' }}>You paid</div>
          <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Mon, 9:12</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0' }}>
        <div style={{ flexShrink: '0', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: '900', background: '#9BF0C4' }}>✓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: '800' }}>Job marked done</div>
          <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Mon, 15:40</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0' }}>
        <div style={{ flexShrink: '0', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: '900', background: '#FFE3CC', boxShadow: 'inset 0 0 0 2px #FF6A2B' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: '800' }}>Your confirmation</div>
          <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Waiting for you</div>
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, boxSizing: 'border-box', borderRadius: 14, background: '#FF6A2B', marginTop: 12, fontSize: 14, fontWeight: '800' }}>Confirm & release</div>
  </>
);

// base 180.0 x 320.0
export const MockIdCheck = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
      <div style={{ position: 'relative', flexShrink: '0', width: 56, height: 56, borderRadius: '50%', background: '#FFE3CC', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 16.8, top: 11.2, width: 22.4, height: 22.4, borderRadius: '50%', background: '#8A4A30' }} />
        <div style={{ position: 'absolute', left: 15.7, top: 9, width: 24.6, height: 11.2, borderRadius: '11.2px 11.2px 0 0', background: '#0B1B3A' }} />
        <div style={{ position: 'absolute', left: 8.4, top: 35.8, width: 39.2, height: 28, borderRadius: '19.6px 19.6px 0 0', background: '#FF6A2B' }} />
      </div>
    </div>
    <div style={{ textAlign: 'center', marginTop: 8 }}>
      <div style={{ fontSize: 14, fontWeight: '800' }}>Musa Adebayo</div>
      <div style={{ marginTop: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#9BF0C4', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>✓ Verified</span>
      </div>
    </div>
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: '600', padding: '6px 0', borderBottom: '1px dashed #E6DED3' }}>
        <span>Government ID</span>
        <span>✓</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: '600', padding: '6px 0' }}>
        <span>Live selfie</span>
        <span>✓</span>
      </div>
    </div>
  </>
);

// base 269.7 x 439.5
export const MockNewRequest = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 11.9 }}>
      <span>9:41</span>
      <span>New request</span>
      <span>•••</span>
    </div>
    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 18 }}>What needs fixing?</div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, marginTop: 11.9 }}>
      <div style={{ fontSize: 13, fontWeight: '700' }}>Socket sparking in the kitchen</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <div style={{ width: 55.9, height: 55.9, borderRadius: 10, background: '#C9D1DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 25.9, height: 21.9, borderRadius: 4, background: '#FFFFFF' }} />
        </div>
        <div style={{ width: 55.9, height: 55.9, borderRadius: 10, border: '2.4px dashed #AAB5C6', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#8E9AB0' }}>+</div>
      </div>
    </div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 10, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#FFE3CC', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>Electrician</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#FFE3CC', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>Bodija</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, boxSizing: 'border-box', borderRadius: 14, background: '#FF6A2B', marginTop: 11.9, fontSize: 14, fontWeight: '800' }}>Post request</div>
  </>
);

// base 269.7 x 439.5
export const MockCheckout = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 11.9 }}>
      <span>9:41</span>
      <span>Checkout</span>
      <span>•••</span>
    </div>
    <div style={{ fontSize: 11.4, fontWeight: '600', color: '#3A4458' }}>Pay Musa for</div>
    <div style={{ fontSize: 14, fontWeight: '800' }}>Leak under kitchen sink</div>
    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 30, margin: '8px 0' }}>{formatCurrency(18500)}</div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 11.9, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexShrink: '0', width: 30, height: 30, borderRadius: '50%', background: '#0B1B3A', color: '#FFF6EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="11px" height="11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: '800' }}>Held by KaziHub</div>
          <div style={{ fontSize: 11.4, fontWeight: '600', color: '#3A4458' }}>Musa gets it when you confirm the job is done.</div>
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, boxSizing: 'border-box', borderRadius: 14, background: '#FF6A2B', marginTop: 14, fontSize: 14, fontWeight: '800' }}>Pay into escrow</div>
  </>
);

// base 269.7 x 439.5
export const MockWallet = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 11.9 }}>
      <span>9:41</span>
      <span>Wallet</span>
      <span>•••</span>
    </div>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#FFE3CC', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>Artisan app</span>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ flexShrink: '0', width: 48.4, height: 48.4, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26.3, fontWeight: '900', background: '#9BF0C4' }}>✓</div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 11.4, fontWeight: '600', color: '#3A4458' }}>Payment released</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 30, marginTop: 1.9 }}>+{formatCurrency(18500)}</div>
        <div style={{ fontSize: 11.4, fontWeight: '600', color: '#3A4458' }}>From Tolu A. · Leak under sink</div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, boxSizing: 'border-box', borderRadius: 14, background: '#D9F7E7', marginTop: 14, fontSize: 14, fontWeight: '800' }}>Sent to your bank account</div>
  </>
);

// base 250.0 x 520.0
export const MockHome = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 12 }}>
      <span>9:41</span>
      <span>Home</span>
      <span>•••</span>
    </div>
    <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Good morning,</div>
    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 24, marginBottom: 4 }}>Tolu</div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, marginTop: 10 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#FFE3CC', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>On the way</span>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: '0', width: 38, height: 38, borderRadius: '50%', background: '#FFE3CC', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 11.4, top: 7.6, width: 15.2, height: 15.2, borderRadius: '50%', background: '#8A4A30' }} />
            <div style={{ position: 'absolute', left: 10.6, top: 6.1, width: 16.7, height: 7.6, borderRadius: '7.6px 7.6px 0 0', background: '#0B1B3A' }} />
            <div style={{ position: 'absolute', left: 5.7, top: 24.3, width: 26.6, height: 19, borderRadius: '13.3px 13.3px 0 0', background: '#FF6A2B' }} />
          </div>
          <div style={{ flexGrow: '1' }}>
            <div style={{ fontSize: 13.5, fontWeight: '800' }}>Musa A.</div>
            <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Plumber · 12 min away</div>
          </div>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#F1E8DC', marginTop: 10, overflow: 'hidden' }}>
        <div style={{ width: '68%', height: '100%', borderRadius: 999, background: '#FF6A2B' }} />
      </div>
    </div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 12, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexShrink: '0', width: 32, height: 32, borderRadius: '50%', background: '#0B1B3A', color: '#FFF6EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="11px" height="11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <div style={{ flexGrow: '1' }}>
          <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Held in escrow</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 20 }}>{formatCurrency(18500)}</div>
        </div>
      </div>
    </div>
    <div style={{ marginTop: 14, fontSize: 12, fontWeight: '800' }}>Book again</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#FFFFFF', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>Electrician</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#FFFFFF', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>Plumber</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#FFFFFF', color: '#0B1B3A', fontSize: 11, fontWeight: '800' }}>AC repair</span>
    </div>
  </>
);

// base 250 x 520. The sign-up code arriving by email, as the app actually sends it (5 digits).
const EMAIL_CODE = '48291';
const codeBox: React.CSSProperties = { flex: '1', height: 40, borderRadius: 10, background: '#FFFFFF', boxShadow: 'inset 0 0 0 2px #0B1B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 20 };
export const MockCodeMail = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 12 }}>
      <span>9:41</span>
      <span />
      <span>•••</span>
    </div>
    <div style={{ textAlign: 'center', margin: '8px 0 18px' }}>
      <div style={{ fontSize: 12, fontWeight: '700', color: '#3A4458' }}>Monday, 14 September</div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 64, lineHeight: '1' }}>9:41</div>
    </div>
    <div style={{ background: '#FFFFFF', borderRadius: 18, padding: 12, boxShadow: '0 6px 16px rgba(11,27,58,0.10)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: '800', color: '#3A4458' }}><span style={{ width: 20, height: 20, borderRadius: 6, background: '#6FD9A6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0B1B3A', fontSize: 11 }}>✉</span>MAIL<span style={{ marginLeft: 'auto', fontWeight: '600' }}>now</span></div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: '800' }}>KaziHub</div>
      <div style={{ marginTop: 2, fontSize: 12.5, lineHeight: '1.4', fontWeight: '600', color: '#3A4458' }}>Your KaziHub verification code is{' '}<strong style={{ color: '#0B1B3A' }}>{EMAIL_CODE}</strong>. Don’t share it with anyone.</div>
    </div>
    <div style={{ marginTop: 18, fontSize: 12, fontWeight: '800' }}>Enter the code</div>
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {EMAIL_CODE.split('').map((d, i) => <div key={i} style={codeBox}>{d}</div>)}
    </div>
    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
      <span style={{ padding: '6px 12px', borderRadius: 999, background: '#F1E8DC', fontSize: 11.5, fontWeight: '700' }}>From Mail:{' '}<strong>{EMAIL_CODE}</strong></span>
    </div>
  </>
);

// base 250 x 520. The reset email with its 5-digit code (the app resets by code, not by link).
export const MockResetMail = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '800', marginBottom: 12 }}>
      <span>9:41</span>
      <span>Mail</span>
      <span>•••</span>
    </div>
    <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Inbox</div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexShrink: '0', width: 34, height: 34, borderRadius: '50%', background: '#3B35C9', color: '#FFF6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 15 }}>K</div>
        <div style={{ minWidth: '0' }}>
          <div style={{ fontSize: 13, fontWeight: '800' }}>KaziHub</div>
          <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>to you · 9:41</div>
        </div>
      </div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 20, lineHeight: '1.05', marginTop: 14 }}>Reset your password</div>
      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: '1.45', fontWeight: '600', color: '#3A4458' }}>Hi Tolu, use this code to set a new password. If you didn’t ask for this, you can ignore this email.</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, boxSizing: 'border-box', borderRadius: 14, background: '#FFE3CC', marginTop: 14, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '0.2em', fontSize: 24 }}>30517</div>
    </div>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 12, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#0B1B3A', color: '#FFF6EC', fontSize: 11, fontWeight: '800' }}><svg width="11px" height="11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
  <rect x="4" y="11" width="16" height="10" rx="2" />
  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
</svg>{' '}Escrow</span>
        <div style={{ fontSize: 11.5, fontWeight: '600', color: '#3A4458' }}>Your held payments are untouched.</div>
      </div>
    </div>
  </>
);

/**
 * For artisans: a hand holding the phone with a new job request, payment already secured.
 * Drawn at 400 x 520 and scaled from its bottom centre, so it sits on the bottom of its box.
 */
export const ArtisanScene: React.FC<{ scale: number; className?: string }> = ({ scale, className }) => (
    <div role="img" aria-label={`An artisan holding a phone showing a new job request, with ${formatCurrency(9000)} already secured in escrow`} className={className} style={{ position: 'relative', flexShrink: '0', width: 400, height: 520, transform: `scale(${scale})`, transformOrigin: '50% 100%' }}>
      <div style={{ position: 'absolute', inset: '0', transform: 'rotate(-6deg)', transformOrigin: '70% 100%' }}>
        <svg width="400" height="600" viewBox="0 0 400 600" style={{ position: 'absolute', left: '0', top: '0' }} aria-hidden="true">
          <path d="M 232 500 C 280 470, 340 452, 372 460 C 400 500, 440 560, 470 620 L 300 620 C 290 580, 266 540, 232 500 Z" fill="#8A4A30" />
          <path d="M 120 300 L 316 300 L 316 440 C 344 446, 372 452, 380 476 C 372 506, 300 522, 240 516 C 180 512, 140 480, 120 440 Z" fill="#8A4A30" />
          <rect x="56" y="285.0" width="84" height="30" rx="15.0" fill="#8A4A30" />
          <rect x="66" y="322.0" width="74" height="32" rx="16.0" fill="#8A4A30" />
          <rect x="72" y="360.5" width="68" height="31" rx="15.5" fill="#8A4A30" />
          <rect x="84" y="398.5" width="56" height="27" rx="13.5" fill="#8A4A30" />
          <path d="M 62 318 C 80 320, 92 321, 100 322" fill="none" stroke="#6E3A25" strokeWidth="3" strokeLinecap="round" />
          <path d="M 72 356 C 84 358, 94 359, 100 360" fill="none" stroke="#6E3A25" strokeWidth="3" strokeLinecap="round" />
          <path d="M 80 393 C 90 395, 96 396, 100 397" fill="none" stroke="#6E3A25" strokeWidth="3" strokeLinecap="round" />
          <path d="M 64 290 C 60 296, 60 304, 64 310" fill="none" stroke="#6E3A25" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div aria-hidden="true" style={{ position: 'absolute', left: 100, top: 30, width: 220, height: 440, boxSizing: 'border-box', borderRadius: 33.4, background: '#0B1B3A', padding: 7.9, boxShadow: '0 15.8px 31.7px rgba(11,27,58,0.18)' }}>
          <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 26.4, background: '#FFF6EC', overflow: 'hidden', padding: '14.1px 12.3px', color: '#0B1B3A', fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.7, fontWeight: '800', marginBottom: 10.6 }}>
                <span>9:41</span>
                <span>Jobs</span>
                <span>•••</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4.4, padding: '3.5px 8.8px', borderRadius: 999, background: '#FFB020', color: '#0B1B3A', fontSize: 9.7, fontWeight: '800' }}>New request</span>
                <div style={{ fontSize: 10.1, fontWeight: '600', color: '#3A4458' }}>0.6 km away</div>
              </div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 18.5, lineHeight: '1.02', margin: '8.8px 0 5.3px' }}>Socket sparking in the kitchen</div>
              <div style={{ fontSize: 10.1, fontWeight: '600', color: '#3A4458' }}>Tolu A. · Bodija, Ibadan</div>
              <div style={{ background: '#9BF0C4', borderRadius: 14.1, padding: 10.6, marginTop: 10.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8.8 }}>
                  <div style={{ flexShrink: '0', width: 26.4, height: 26.4, borderRadius: '50%', background: '#0B1B3A', color: '#FFF6EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="9.7px" height="9.7px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.1, fontWeight: '700' }}>Payment secured</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: '800', letterSpacing: '-0.04em', fontSize: 17.6 }}>{formatCurrency(9000)}</div>
                  </div>
                </div>
              </div>
              <div style={{ background: '#FFFFFF', borderRadius: 14.1, padding: 8.8, marginTop: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 7, fontSize: 11, fontWeight: '600', padding: '5.3px 0', borderBottom: '1px dashed #E6DED3' }}>
                  <span>Visit</span>
                  <span>Today, 4pm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 7, fontSize: 11, fontWeight: '600', padding: '5.3px 0' }}>
                  <span>Pays out</span>
                  <span>When Tolu confirms</span>
                </div>
              </div>
              <div style={{ marginTop: 7, padding: '8.8px 10.6px', borderRadius: 12.3, background: '#FFE3CC', fontSize: 10.6, lineHeight: '1.4', fontWeight: '600' }}>“It sparks when I plug in the kettle.”</div>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ height: 33.4, boxSizing: 'border-box', borderRadius: 11.4, border: '2px solid #0B1B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.4, fontWeight: '800' }}>Decline</div>
                <div style={{ height: 38.7, borderRadius: 11.4, background: '#FF6A2B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.3, fontWeight: '800' }}>Accept job</div>
              </div>
            </div>
          </div>
        </div>
        <svg width="400" height="600" viewBox="0 0 400 600" style={{ position: 'absolute', left: '0', top: '0' }} aria-hidden="true">
          <rect x="94" y="323.0" width="22" height="30" rx="14.0" fill="#8A4A30" />
          <rect x="104" y="328.0" width="9" height="20" rx="4.5" fill="#C08066" />
          <rect x="94" y="361.5" width="22" height="29" rx="13.5" fill="#8A4A30" />
          <rect x="104" y="366.5" width="9" height="19" rx="4.5" fill="#C08066" />
          <rect x="94" y="399.5" width="22" height="25" rx="11.5" fill="#8A4A30" />
          <rect x="104" y="404.5" width="9" height="15" rx="4.5" fill="#C08066" />
          <path d="M 378 478 C 372 430, 352 372, 340 338 C 334 322, 314 320, 309 334 C 304 368, 310 424, 316 474 Z" fill="#8A4A30" />
          <ellipse cx="316" cy="338" rx="6" ry="10" transform="rotate(-8 316 338)" fill="#C08066" />
          <path d="M 318 462 C 330 470, 344 478, 352 492" fill="none" stroke="#6E3A25" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
);
