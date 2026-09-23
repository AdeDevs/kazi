import { useEffect } from 'react';

function upsertMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets a real per-page <title>/<meta description>/<link rel="canonical"> whenever the calling
 * page mounts or its title/description change. This app has no server-side rendering, so these
 * tags update client-side after JavaScript runs -- not before, and not for crawlers that don't
 * execute JS. That's an inherent limitation of this architecture, not something this hook works
 * around; it just stops every route from being permanently stuck on the homepage's <title>.
 */
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | KaziHub`;
    upsertMetaTag('description', description);
    upsertCanonicalLink(`${window.location.origin}${window.location.pathname}`);
    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}
