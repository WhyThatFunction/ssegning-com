'use client';

import { useEffect, useMemo, useRef } from 'react';

import { SectionHeading } from '@/components/section-heading';

const GISCUS_ORIGIN = 'https://giscus.app';
const GISCUS_SCRIPT_SRC = 'https://giscus.app/client.js';

type GiscusTheme = 'light' | 'dark';

interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

/** Mirrors the subset of https://giscus.app/client.js's postMessage contract used to push a live theme change into the already-rendered iframe. */
interface GiscusSetConfigMessage {
  giscus: {
    setConfig: {
      theme: GiscusTheme;
    };
  };
}

function configFromProps(
  repo: string | undefined,
  repoId: string | undefined,
  category: string | undefined,
  categoryId: string | undefined,
): GiscusConfig | null {
  if (!repo || !repoId || !category || !categoryId) return null;
  return { repo, repoId, category, categoryId };
}

/**
 * Resolves the theme giscus should render in from the same source
 * ThemeToggle writes to: a `data-theme="light"|"dark"` attribute on
 * `<html>` when the visitor picked an explicit theme, falling back to the
 * OS-level `prefers-color-scheme` when the preference is "system" (no
 * attribute at all).
 */
function resolveGiscusTheme(): GiscusTheme {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Comment thread for a journal article, backed by giscus (GitHub
 * Discussions) — readers authenticate with their existing GitHub account,
 * comments live as Discussions on a repo we own, and no PII passes through
 * or is stored by this app.
 *
 * Config arrives as PROPS, not env reads in this (client) component. This
 * app's images are built in CI with no giscus config, and the real values
 * are only supplied later as plain Kubernetes Deployment env vars at
 * runtime — deliberately NOT `NEXT_PUBLIC_*`. A `NEXT_PUBLIC_*` var gets
 * inlined into the client bundle at *build* time, so it would be frozen as
 * `undefined` forever in this deployment model and comments would silently
 * never render no matter how the cluster is configured. The parent Server
 * Component (`app/journal/[slug]/page.tsx`) reads `process.env` at request
 * time instead — which does pick up a Deployment env change on pod
 * restart, no rebuild needed — and passes the four values down as props.
 * Renders nothing when any prop is missing, which is this site's default
 * state today: no console error, no layout gap, no placeholder box.
 */
export function Comments({
  repo,
  repoId,
  category,
  categoryId,
}: {
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
}) {
  // Memoized so the object identity is stable across re-renders — a fresh
  // object literal on every render would otherwise re-trigger the effect
  // below even though the props themselves didn't change.
  const config = useMemo(
    () => configFromProps(repo, repoId, category, categoryId),
    [repo, repoId, category, categoryId],
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config || !containerRef.current) return;

    const container = containerRef.current;
    const script = document.createElement('script');
    script.src = GISCUS_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', config.repo);
    script.setAttribute('data-repo-id', config.repoId);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.categoryId);
    // One discussion per article, keyed by its own URL path.
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', resolveGiscusTheme());
    script.setAttribute('data-lang', 'en');
    // Never blocks article rendering — the iframe loads once it scrolls near view.
    script.setAttribute('data-loading', 'lazy');

    container.appendChild(script);

    function postTheme(theme: GiscusTheme) {
      const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (!iframe?.contentWindow) return;
      const message: GiscusSetConfigMessage = { giscus: { setConfig: { theme } } };
      iframe.contentWindow.postMessage(message, GISCUS_ORIGIN);
    }

    // The giscus iframe only reads data-theme once, at load — it does not
    // watch for attribute or media-query changes on its own, so both the
    // manual toggle (ThemeToggle flips data-theme on <html>) and an OS-level
    // scheme change (when the visitor's preference is "system") need to be
    // re-posted explicitly.
    function handleThemeChange() {
      postTheme(resolveGiscusTheme());
    }

    const attributeObserver = new MutationObserver(handleThemeChange);
    attributeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', handleThemeChange);

    return () => {
      attributeObserver.disconnect();
      media.removeEventListener('change', handleThemeChange);
      container.replaceChildren();
    };
  }, [config]);

  if (!config) return null;

  return (
    <div className="mt-16 border-t border-border pt-12 md:mt-24 md:pt-16">
      <SectionHeading
        eyebrow="Discussion"
        title="Comments"
        description="Sign in with your GitHub account to join the discussion."
      />
      <div ref={containerRef} className="mt-8" />
    </div>
  );
}
