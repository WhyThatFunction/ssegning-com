'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

/**
 * Scoped to just the button: the /branding page around it stays a Server
 * Component, and the SVG source it copies is passed in as a plain string
 * rather than re-derived client-side.
 */
export function CopyMarkSourceButton({ source }: { source: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context).
      // The <pre> below is still selectable by hand, so this fails soft.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:border-border-strong"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.5} />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
      )}
      {copied ? 'Copied' : 'Copy SVG source'}
    </button>
  );
}
