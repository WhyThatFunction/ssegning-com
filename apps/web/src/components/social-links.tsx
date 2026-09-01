import { icons } from 'lucide-react';

import type { SocialComponent, SocialPlatform } from '@/lib/types';

// lucide-react ships generic icons only (no brand/logo glyphs), so social
// platforms are represented with the closest neutral icon rather than a
// brand mark.
const PLATFORM_ICON: Record<SocialPlatform, string> = {
  github: 'Terminal',
  linkedin: 'Briefcase',
  x: 'AtSign',
  mastodon: 'MessageCircle',
  email: 'Mail',
  rss: 'Rss',
};

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  mastodon: 'Mastodon',
  email: 'Email',
  rss: 'RSS feed',
};

export function SocialLinks({ socials }: { socials: SocialComponent[] }) {
  if (socials.length === 0) return null;

  return (
    <ul className="flex items-center gap-4">
      {socials.map((social) => {
        const iconName = PLATFORM_ICON[social.platform] ?? 'Link';
        const IconComponent =
          (icons as Record<string, (typeof icons)[keyof typeof icons] | undefined>)[iconName] ??
          icons.Link;
        const label = PLATFORM_LABEL[social.platform] ?? social.platform;

        return (
          <li key={social.id}>
            <a
              href={social.url}
              target={social.platform === 'email' ? undefined : '_blank'}
              rel={social.platform === 'email' ? undefined : 'noopener noreferrer'}
              className="text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
              aria-label={label}
            >
              <IconComponent aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
