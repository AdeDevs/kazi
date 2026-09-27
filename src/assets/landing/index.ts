/// <reference types="vite/client" />
// The landing and auth illustrations. Imported (not served from /public) so the build bundles
// them: each is under the inline limit in vite.config.ts, so they arrive inside the app's
// JavaScript and draw with the page instead of as 20-odd separate requests after it. They were
// run through SVGO first. The hero skyline is the exception: it's larger, so it stays a file in
// /public/landing and index.html preloads it on the landing page.
const files = import.meta.glob<string>('./*.svg', { eager: true, import: 'default' });

export function art(name: string): string {
  const url = files[`./${name}.svg`];
  if (!url && import.meta.env.DEV) console.warn(`Missing landing illustration: ${name}`);
  return url ?? '';
}
