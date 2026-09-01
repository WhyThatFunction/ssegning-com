import 'server-only';

import type {
  AboutPage,
  ContactPage,
  HomePage,
  LegalPage,
  Post,
  Project,
  Service,
  SiteSetting,
  StrapiListResponse,
  StrapiSingleResponse,
} from '@/lib/types';

const REQUEST_TIMEOUT_MS = 8_000;
const DEFAULT_REVALIDATE_SECONDS = 60;

function strapiBaseUrl(): string | null {
  const url = process.env.STRAPI_URL;
  return url && url.trim().length > 0 ? url.replace(/\/$/, '') : null;
}

/**
 * Generic fetch wrapper for the Strapi REST API.
 *
 * Hard requirement: this NEVER throws. Any failure — no STRAPI_URL
 * configured, network error, non-2xx response, malformed JSON, or a request
 * that exceeds the timeout — resolves to `null` so every call site can fail
 * soft into hand-written fallback copy instead of crashing the page.
 */
async function strapiFetch<T>(path: string, tags: string[]): Promise<T | null> {
  const base = strapiBaseUrl();
  if (!base) return null;

  try {
    const response = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: DEFAULT_REVALIDATE_SECONDS, tags },
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getSiteSetting(): Promise<SiteSetting | null> {
  const json = await strapiFetch<StrapiSingleResponse<SiteSetting>>(
    '/api/site-setting?populate=*',
    ['site-setting'],
  );
  return json?.data ?? null;
}

export async function getHomePage(): Promise<HomePage | null> {
  const json = await strapiFetch<StrapiSingleResponse<HomePage>>('/api/home-page?populate=*', [
    'home-page',
  ]);
  return json?.data ?? null;
}

export async function getAboutPage(): Promise<AboutPage | null> {
  const json = await strapiFetch<StrapiSingleResponse<AboutPage>>('/api/about-page?populate=*', [
    'about-page',
  ]);
  return json?.data ?? null;
}

export async function getContactPage(): Promise<ContactPage | null> {
  const json = await strapiFetch<StrapiSingleResponse<ContactPage>>(
    '/api/contact-page?populate=*',
    ['contact-page'],
  );
  return json?.data ?? null;
}

export async function getLegalPage(): Promise<LegalPage | null> {
  const json = await strapiFetch<StrapiSingleResponse<LegalPage>>('/api/legal-page', [
    'legal-page',
  ]);
  return json?.data ?? null;
}

export async function getServices(): Promise<Service[]> {
  const json = await strapiFetch<StrapiListResponse<Service>>(
    '/api/services?sort=order:asc&populate=*',
    ['services'],
  );
  return json?.data ?? [];
}

export async function getProjects(): Promise<Project[]> {
  const json = await strapiFetch<StrapiListResponse<Project>>(
    '/api/projects?sort=order:asc&populate=*',
    ['projects'],
  );
  return json?.data ?? [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const json = await strapiFetch<StrapiListResponse<Project>>(
    `/api/projects?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
    ['projects'],
  );
  return json?.data?.[0] ?? null;
}

export async function getPosts(): Promise<Post[]> {
  const json = await strapiFetch<StrapiListResponse<Post>>(
    '/api/posts?sort=publishedAt:desc&populate=*',
    ['posts'],
  );
  return json?.data ?? [];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const json = await strapiFetch<StrapiListResponse<Post>>(
    `/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
    ['posts'],
  );
  return json?.data?.[0] ?? null;
}
