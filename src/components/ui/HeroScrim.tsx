import React from 'react';

interface HeroScrimProps {
  /** The hero's photo. When given, the bottom of the photo blurs progressively; without one
   *  (the initials fallback) only the darkening is applied. */
  src?: string;
}

const mask = (from: string, to: string): React.CSSProperties => {
  const gradient = `linear-gradient(to top, black ${from}, transparent ${to})`;
  return { maskImage: gradient, WebkitMaskImage: gradient };
};

/**
 * The readability layer at the bottom of a full-bleed mobile hero photo, under the name and
 * details: the photo blurs progressively and darkens toward the bottom edge.
 *
 * The blur is two blurred copies of the photo laid exactly over it, each faded in from the bottom
 * with a mask -- a masked `filter` renders a smooth ramp everywhere, whereas a masked
 * `backdrop-filter` shows a hard line where the blur begins in Chromium. The copies are scaled up
 * slightly so the blur's soft edges never reveal the sharp photo at the sides.
 * Place it after the photo and before the text, inside the hero's positioned, overflow-hidden box.
 */
export const HeroScrim: React.FC<HeroScrimProps> = ({ src }) => (
  <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
    {src && (
      <>
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.04] blur-[4px]" style={mask('35%', '70%')} />
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.08] blur-[14px]" style={mask('10%', '45%')} />
      </>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 via-40% to-transparent to-75%" />
  </div>
);
