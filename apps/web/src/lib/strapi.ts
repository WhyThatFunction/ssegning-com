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

/**
 * Strapi's REST page size, as configured in `apps/cms/config/api.ts`
 * (`maxLimit: 100`). Asking for more than this is silently clamped by Strapi,
 * so requesting exactly the maximum is the fewest round-trips allowed.
 */
const STRAPI_MAX_PAGE_SIZE = 100;

/** Belt-and-braces stop so a bad `pageCount` can never spin this forever. */
const MAX_PAGES = 50;

/**
 * Fetches EVERY record of a list endpoint, following Strapi's pagination.
 *
 * Why this exists: Strapi's `defaultLimit` is 25 (`apps/cms/config/api.ts`).
 * A list request that does not say otherwise gets at most 25 records and no
 * error — the 26th article would simply stop appearing on the journal index
 * and in the sitemap, with nothing anywhere to say so. That is a silent
 * content-loss bug on a site whose article count only grows, so paging is
 * done here once rather than left to each caller to remember.
 *
 * Keeps `strapiFetch`'s contract: never throws. A failed page resolves to
 * `null` and this returns whatever it had, so a partial outage degrades to
 * fewer entries instead of an exception.
 *
 * `path` must already carry its own query string (every caller sorts and/or
 * populates), so pagination is appended with `&`.
 */
async function strapiFetchAll<T>(path: string, tags: string[]): Promise<T[]> {
  const collected: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const json = await strapiFetch<StrapiListResponse<T>>(
      `${path}&pagination[page]=${page}&pagination[pageSize]=${STRAPI_MAX_PAGE_SIZE}`,
      tags,
    );

    if (!json?.data?.length) break;
    collected.push(...json.data);

    const pageCount = json.meta?.pagination?.pageCount;
    // No `pageCount` (withCount off, or an unexpected shape) means there is
    // nothing reliable to loop on — stop rather than guess at a next page.
    if (pageCount === undefined || page >= pageCount) break;
  }

  return collected;
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
  return strapiFetchAll<Service>('/api/services?sort=order:asc&populate=*', ['services']);
}

export async function getProjects(): Promise<Project[]> {
  return strapiFetchAll<Project>('/api/projects?sort=order:asc&populate=*', ['projects']);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const json = await strapiFetch<StrapiListResponse<Project>>(
    `/api/projects?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
    ['projects'],
  );
  return json?.data?.[0] ?? null;
}

export async function getPosts(): Promise<Post[]> {
  return strapiFetchAll<Post>('/api/posts?sort=publishedAt:desc&populate=*', ['posts']);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const json = await strapiFetch<StrapiListResponse<Post>>(
    `/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
    ['posts'],
  );
  return json?.data?.[0] ?? null;
}
