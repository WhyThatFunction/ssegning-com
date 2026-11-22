import 'server-only';

import type {
  AboutPage,
  ContactPage,
  HomePage,
  LegalPage,
  Lookup,
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
 * Thrown by a page that needs one record when the CMS did not answer.
 *
 * A page that throws during an incremental-static regeneration keeps serving
 * its last good copy: Next.js only replaces the cached page when a render
 * succeeds. Answering `notFound()` instead would cache a 404 for a real
 * article for a whole revalidation window, which is what happened on every
 * deploy while the web pods came up before Strapi did; a hand-written fallback
 * would likewise be cached in place of the real page. A first render with no
 * good copy yet gets a bare 500 ("Internal Server Error", not app/error.tsx),
 * which is not cached and tells a crawler to come back later rather than that
 * the URL is gone.
 */
export class CmsUnavailableError extends Error {
  constructor(what: string) {
    super(`The CMS gave no usable answer for ${what}`);
    this.name = 'CmsUnavailableError';
  }
}

/** Did the CMS answer at all, and if so with what. */
type StrapiResult<T> = { ok: true; body: T } | { ok: false };

/**
 * Generic fetch wrapper for the Strapi REST API.
 *
 * Hard requirement: this NEVER throws. Any failure — no STRAPI_URL
 * configured, network error, non-2xx response, malformed JSON, or a request
 * that exceeds the timeout — resolves to `{ ok: false }` so every call site
 * decides what no answer means: the slug lookups tell it apart from "no such
 * record", and everything else throws `CmsUnavailableError`.
 *
 * It reports whether the CMS *answered*, separately from what it said,
 * because those are different facts to a caller looking up one record: an
 * empty answer means "no such record", an absent answer means "ask again
 * later".
 */
async function strapiFetch<T>(path: string, tags: string[]): Promise<StrapiResult<T>> {
  const base = strapiBaseUrl();
  if (!base) return { ok: false };

  for (let attempt = 0; ; attempt++) {
    const { result, retryable } = await strapiFetchOnce<T>(`${base}${path}`, tags, attempt);
    if (result.ok || !retryable || attempt >= RETRY_DELAYS_MS.length) return result;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
}

/**
 * Pauses before each retry of a failure that is likely to pass on its own: a
 * dropped connection, a timeout, a 5xx or a 429. Without them one blip among
 * the dozens of requests a build makes fails the whole build, now that
 * nothing falls back. The 1 s and 3 s pauses ride out a short CMS restart
 * (a CI smoke build failed during one with 300 ms and 1 s); a CMS that stays
 * down still throws after the third attempt. Other 4xx answers are not
 * retried: asking again would get the same answer.
 */
const RETRY_DELAYS_MS = [1_000, 3_000];

async function strapiFetchOnce<T>(
  url: string,
  tags: string[],
  attempt: number,
): Promise<{ result: StrapiResult<T>; retryable: boolean }> {
  let response: Response;
  try {
    response = await fetch(url, {
      // Next.js memoizes identical fetches within a render, so a retry with
      // the same URL and options would get the first attempt's failure back
      // without touching the network. The header makes each retry its own
      // request; Strapi ignores it.
      headers: attempt > 0 ? { 'x-retry-attempt': String(attempt) } : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: DEFAULT_REVALIDATE_SECONDS, tags },
    });
  } catch {
    return { result: { ok: false }, retryable: true };
  }

  if (!response.ok) {
    return { result: { ok: false }, retryable: response.status === 429 || response.status >= 500 };
  }

  try {
    return { result: { ok: true, body: (await response.json()) as T }, retryable: false };
  } catch {
    return { result: { ok: false }, retryable: false };
  }
}

/**
 * `strapiFetch` for callers that need the answer to render at all: every
 * index and single-type page. No answer throws `CmsUnavailableError`, so a
 * regeneration during an outage keeps the last good copy rather than
 * replacing it with something the CMS never said.
 */
async function strapiFetchData<T>(path: string, tags: string[], what: string): Promise<T> {
  const result = await strapiFetch<T>(path, tags);
  if (!result.ok) throw new CmsUnavailableError(what);
  return result.body;
}

/**
 * A single type's record, or `CmsUnavailableError`. Strapi answers an unset or
 * unpublished single type with `data: null`; every page that reads one has
 * nothing to show without it, so that is treated like no answer.
 */
async function strapiFetchSingle<T>(path: string, tags: string[], what: string): Promise<T> {
  const json = await strapiFetchData<StrapiSingleResponse<T>>(path, tags, what);
  if (!json?.data) throw new CmsUnavailableError(what);
  return json.data;
}

/**
 * Strapi's REST page size, as configured in `apps/cms/config/api.ts`
 * (`maxLimit: 100`). Asking for more than this is silently clamped by Strapi,
 * so requesting exactly the maximum is the fewest round-trips allowed.
 */
const STRAPI_MAX_PAGE_SIZE = 100;

/** Belt-and-braces stop so a bad `pageCount` can never spin this forever; hitting it throws. */
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
 * All or nothing: a page that fails, or answers without a `data` list, throws
 * `CmsUnavailableError`. A partial list would be cached as if it were the
 * whole one, quietly dropping entries from the index and the sitemap.
 *
 * `path` must already carry its own query string (every caller sorts and/or
 * populates), so pagination is appended with `&`.
 */
async function strapiFetchAll<T>(path: string, tags: string[], what: string): Promise<T[]> {
  const collected: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const json = await strapiFetchData<StrapiListResponse<T>>(
      `${path}&pagination[page]=${page}&pagination[pageSize]=${STRAPI_MAX_PAGE_SIZE}`,
      tags,
      what,
    );

    if (!Array.isArray(json?.data)) throw new CmsUnavailableError(what);
    if (json.data.length === 0) return collected;
    collected.push(...json.data);

    const pageCount = json.meta?.pagination?.pageCount;
    if (pageCount === undefined) {
      // Without a page count, a short page is the only proof this was the last.
      if (json.data.length < STRAPI_MAX_PAGE_SIZE) return collected;
      throw new CmsUnavailableError(`${what} (no page count on a full page)`);
    }
    if (page >= pageCount) return collected;
  }

  throw new CmsUnavailableError(`${what} (more than ${MAX_PAGES} pages)`);
}

export async function getSiteSetting(): Promise<SiteSetting> {
  return strapiFetchSingle<SiteSetting>(
    '/api/site-setting?populate=*',
    ['site-setting'],
    'the site setting',
  );
}

export async function getHomePage(): Promise<HomePage> {
  return strapiFetchSingle<HomePage>('/api/home-page?populate=*', ['home-page'], 'the home page');
}

export async function getAboutPage(): Promise<AboutPage> {
  return strapiFetchSingle<AboutPage>(
    '/api/about-page?populate=*',
    ['about-page'],
    'the about page',
  );
}

export async function getContactPage(): Promise<ContactPage> {
  return strapiFetchSingle<ContactPage>(
    '/api/contact-page?populate=*',
    ['contact-page'],
    'the contact page',
  );
}

export async function getLegalPage(): Promise<LegalPage> {
  return strapiFetchSingle<LegalPage>('/api/legal-page', ['legal-page'], 'the legal page');
}

export async function getServices(): Promise<Service[]> {
  return strapiFetchAll<Service>(
    '/api/services?sort=order:asc&populate=*',
    ['services'],
    'the services list',
  );
}

export async function getProjects(): Promise<Project[]> {
  return strapiFetchAll<Project>(
    '/api/projects?sort=order:asc&populate=*',
    ['projects'],
    'the projects list',
  );
}

export async function getProjectBySlug(slug: string): Promise<Lookup<Project>> {
  const result = await strapiFetch<StrapiListResponse<Project>>(
    `/api/projects?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
    ['projects'],
  );

  // A 200 without a `data` list is not Strapi's answer (a proxy or maintenance
  // page in between), so it says nothing about whether the record exists.
  if (!result.ok || !Array.isArray(result.body?.data)) return { status: 'unavailable' };

  const record = result.body.data[0];
  return record ? { status: 'found', value: record } : { status: 'missing' };
}

export async function getPosts(): Promise<Post[]> {
  return strapiFetchAll<Post>(
    '/api/posts?sort=publishedAt:desc&populate=*',
    ['posts'],
    'the posts list',
  );
}

export async function getPostBySlug(slug: string): Promise<Lookup<Post>> {
  const result = await strapiFetch<StrapiListResponse<Post>>(
    `/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
    ['posts'],
  );

  // A 200 without a `data` list is not Strapi's answer (a proxy or maintenance
  // page in between), so it says nothing about whether the record exists.
  if (!result.ok || !Array.isArray(result.body?.data)) return { status: 'unavailable' };

  const record = result.body.data[0];
  return record ? { status: 'found', value: record } : { status: 'missing' };
}

/**
 * The content sitemap the CMS builds (`GET /api/sitemap.xml`, see
 * apps/cms/src/api/sitemap), as XML text, or `null` when the CMS did not
 * answer with one. Never cached here: the CMS already tells crawlers how
 * long to keep it, and a sitemap must never be served stale from a failure.
 */
export async function getContentSitemapXml(): Promise<string | null> {
  const base = strapiBaseUrl();
  if (!base) return null;

  try {
    const response = await fetch(`${base}/api/sitemap.xml`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const xml = await response.text();
    return xml.startsWith('<?xml') ? xml : null;
  } catch {
    return null;
  }
}
