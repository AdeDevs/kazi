import React, { useLayoutEffect, useRef, useState } from 'react';

interface HeroScrimProps {
  /** The hero's photo. Without one (the initials fallback) only the darkening is applied. */
  src?: string;
  /** Classes for the text block, which sits over the photo (position it: absolute, bottom, sides). */
  textClassName: string;
  /** The name / details shown over the photo. */
  children: React.ReactNode;
}

/** How far above the top line of text the blur and darkening take to fade out completely. */
const FADE_PX = 28;

// Blurred copies of the photo, lightest first. Each reaches a fraction of the way up the text
// area and fades out over its upper half, so going up from the bottom edge the heavier copies
// drop away one by one: the blur eases off gradually until only the clear photo is left.
const LAYERS = [
  { blur: 2, reach: 1 },
  { blur: 5, reach: 0.8 },
  { blur: 10, reach: 0.58 },
  { blur: 18, reach: 0.36 },
];

const bandMask = (reachPx: number): React.CSSProperties => {
  const gradient = `linear-gradient(to top, black 0, black ${Math.round(reachPx * 0.45)}px, transparent ${Math.round(reachPx)}px)`;
  return { maskImage: gradient, WebkitMaskImage: gradient };
};

/**
 * The text over the bottom of a full-bleed mobile hero photo, with the photo under it blurred
 * progressively (strongest at the bottom edge, clear by the top of the text) and darkened for
 * readability. The blurred area is measured from the text block itself, so it always ends just
 * above the first line of text -- never short of it, never far above it -- whatever the text holds.
 *
 * The blur is copies of the photo with `filter: blur` and a mask; a masked `backdrop-filter` shows
 * a hard line where the blur begins in Chromium. Render it inside the hero's positioned,
 * overflow-hidden box, after the photo.
 */
export const HeroScrim: React.FC<HeroScrimProps> = ({ src, textClassName, children }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  // Distance from the hero's bottom edge to the top of the text.
  const [textReach, setTextReach] = useState(72);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const text = textRef.current;
    if (!root || !text) return;
    const measure = () => setTextReach(Math.max(0, root.clientHeight - text.offsetTop));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(text);
    return () => observer.disconnect();
  }, []);

  const reach = textReach + FADE_PX;

  return (
    <>
      <div ref={rootRef} aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {src && LAYERS.map(({ blur, reach: fraction }) => (
          <img
            key={blur}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover origin-bottom"
            // Scaled up a touch (from the bottom edge) so the blur's soft rim never shows the sharp photo.
            style={{ filter: `blur(${blur}px)`, transform: `scale(${1 + blur / 120})`, ...bandMask(reach * fraction) }}
          />
        ))}
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent"
          style={{ height: reach + 16 }}
        />
      </div>
      <div ref={textRef} className={textClassName}>
        {children}
      </div>
    </>
  );
};
