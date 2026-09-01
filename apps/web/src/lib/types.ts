/**
 * Strapi 5 content-type shapes, exactly as declared in CONTRACT.md.
 *
 * Strapi 5 REST responses are FLAT: `{ data: {...fields}, meta }` — there is
 * no `attributes` wrapper. These types describe the flat `data` shape.
 */

export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  mime: string | null;
}

export interface LinkComponent {
  id: number;
  label: string;
  href: string;
  external: boolean | null;
}

export interface MetricComponent {
  id: number;
  label: string;
  value: string;
  detail: string | null;
}

export type SocialPlatform = 'github' | 'linkedin' | 'x' | 'mastodon' | 'email' | 'rss';

export interface SocialComponent {
  id: number;
  platform: SocialPlatform;
  url: string;
}

export interface BulletComponent {
  id: number;
  text: string;
}

export interface SeoComponent {
  id: number;
  metaTitle: string | null;
  metaDescription: string | null;
  shareImage: StrapiMedia | null;
}

export interface SiteSetting {
  id: number;
  documentId: string;
  siteName: string;
  tagline: string | null;
  logo: StrapiMedia | null;
  navLinks: LinkComponent[];
  footerNote: string | null;
  metaDescription: string | null;
  socials: SocialComponent[];
}

export interface HomePage {
  id: number;
  documentId: string;
  heroEyebrow: string | null;
  heroHeadline: string;
  heroSubline: string | null;
  primaryCta: LinkComponent | null;
  secondaryCta: LinkComponent | null;
  heroImage: StrapiMedia | null;
  metrics: MetricComponent[];
  introTitle: string | null;
  introBody: string | null;
  seo: SeoComponent | null;
}

export interface AboutPage {
  id: number;
  documentId: string;
  name: string;
  role: string | null;
  portrait: StrapiMedia | null;
  bio: string | null;
  highlights: MetricComponent[];
  seo: SeoComponent | null;
}

export interface ContactPage {
  id: number;
  documentId: string;
  headline: string | null;
  body: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  bookingUrl: string | null;
  seo: SeoComponent | null;
}

export interface LegalPage {
  id: number;
  documentId: string;
  imprint: string | null;
  privacy: string | null;
  terms: string | null;
}

export interface Service {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  icon: string | null;
  order: number | null;
  deliverables: BulletComponent[];
}

export interface Project {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  client: string | null;
  year: number | null;
  summary: string | null;
  body: string | null;
  cover: StrapiMedia | null;
  gallery: StrapiMedia[];
  tags: string[] | null;
  outcome: string | null;
  url: string | null;
  order: number | null;
  seo: SeoComponent | null;
}

export interface Post {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover: StrapiMedia | null;
  readingMinutes: number | null;
  seo: SeoComponent | null;
  publishedAt: string | null;
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: unknown;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: unknown;
}
