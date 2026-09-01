'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { LinkComponent } from '@/lib/types';

export function MobileNav({ navLinks }: { navLinks: LinkComponent[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-ink"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? (
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
        ) : (
          <Menu aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
        )}
      </button>

      {open ? (
        <nav
          id="mobile-nav-panel"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full border-b border-border bg-canvas px-6 py-4"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-input px-2 py-2.5 text-base text-ink hover:bg-canvas-subtle"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
