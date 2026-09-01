/**
 * Hand-written default copy, used whenever Strapi is unreachable, empty, or
 * returns malformed data. Every helper in `src/lib/strapi.ts` fails soft to
 * `null`/`[]`; every page falls back to the matching export here so the site
 * always renders fully — a cold cluster must never show a 500 or a blank
 * page. Tone matches the seeded CMS content: a solo software & platform
 * engineering consultancy (Cloud, Kubernetes, Rust, TypeScript) run by
 * Stephane Segning Lambou, based in Germany.
 */

import type {
  AboutPage,
  ContactPage,
  HomePage,
  LegalPage,
  Post,
  Project,
  Service,
  SiteSetting,
} from '@/lib/types';

export const siteSetting: SiteSetting = {
  id: 0,
  documentId: 'fallback-site-setting',
  siteName: 'Stephane Segning Lambou',
  tagline: 'Cloud, Kubernetes & platform engineering, one engagement at a time.',
  logo: null,
  navLinks: [
    { id: 1, label: 'Services', href: '/services', external: false },
    { id: 2, label: 'Work', href: '/work', external: false },
    { id: 3, label: 'About', href: '/about', external: false },
    { id: 4, label: 'Journal', href: '/journal', external: false },
    { id: 5, label: 'Contact', href: '/contact', external: false },
  ],
  footerNote: 'Built and operated by one engineer. No bench, no bureaucracy.',
  metaDescription:
    'Independent software and platform engineering consultancy specializing in Kubernetes, cloud infrastructure, Rust, and TypeScript.',
  socials: [
    { id: 1, platform: 'github', url: 'https://github.com/ssegning' },
    { id: 2, platform: 'linkedin', url: 'https://www.linkedin.com/in/ssegning' },
    { id: 3, platform: 'x', url: 'https://x.com/ssegning' },
    { id: 4, platform: 'email', url: 'mailto:hello@ssegning.com' },
  ],
};

export const homePage: HomePage = {
  id: 0,
  documentId: 'fallback-home-page',
  heroEyebrow: 'Independent consultancy',
  heroHeadline: 'Platform engineering that ships and then gets out of the way.',
  heroSubline:
    'I design, build, and operate Kubernetes platforms and the Rust and TypeScript services that run on them — for teams who need senior judgment without the overhead of a full agency.',
  primaryCta: { id: 1, label: 'Start a conversation', href: '/contact', external: false },
  secondaryCta: { id: 2, label: 'See the work', href: '/work', external: false },
  heroImage: null,
  metrics: [
    {
      id: 1,
      label: 'Years in production systems',
      value: '10+',
      detail: 'Cloud & platform engineering',
    },
    {
      id: 2,
      label: 'Clusters brought to steady state',
      value: '20+',
      detail: 'Talos, EKS, bare metal',
    },
    { id: 3, label: 'Solo-run engagements', value: '1', detail: 'One engineer, direct line' },
  ],
  introTitle: 'One engineer, the whole platform.',
  introBody:
    'Most infrastructure problems are not solved by more headcount — they are solved by someone who has done it before and is willing to own the outcome. I work directly with founders and engineering leads, from first architecture sketch through to an on-call rotation your own team can run without me.',
  seo: null,
};

export const aboutPage: AboutPage = {
  id: 0,
  documentId: 'fallback-about-page',
  name: 'Stephane Segning Lambou',
  role: 'Software & Platform Engineering Consultant',
  portrait: null,
  bio: "I'm a software and platform engineer based in Germany, working independently with teams that need production-grade cloud infrastructure without hiring a full platform team. My background spans backend services in Rust and TypeScript, Kubernetes at the scale of a handful of nodes and at the scale of hundreds, and the unglamorous operational work — observability, incident response, cost control — that decides whether a platform survives contact with real traffic.\n\nI take on a small number of engagements at a time so that every client gets direct access to the person doing the work, not a account manager relaying it.",
  highlights: [
    { id: 1, label: 'Core stack', value: 'Rust · TypeScript · Kubernetes', detail: null },
    {
      id: 2,
      label: 'Based in',
      value: 'Germany',
      detail: 'Working with clients across the EU & US',
    },
    { id: 3, label: 'Engagement style', value: 'Solo, direct', detail: 'No handoffs, no bench' },
  ],
  seo: null,
};

export const contactPage: ContactPage = {
  id: 0,
  documentId: 'fallback-contact-page',
  headline: "Let's talk about what you're building.",
  body: "Tell me about the system you're running or the one you need to build. I read every message myself and reply within a business day or two — if it's not a fit, I'll say so and point you somewhere better.",
  email: 'hello@ssegning.com',
  phone: null,
  location: 'Germany (remote-first, EU & US hours)',
  bookingUrl: null,
  seo: null,
};

export const legalPage: LegalPage = {
  id: 0,
  documentId: 'fallback-legal-page',
  imprint:
    '## Imprint\n\nThis page is shown while the CMS content is unavailable. Contact hello@ssegning.com for the current legal imprint (Impressum).',
  privacy:
    '## Privacy Policy\n\nThis page is shown while the CMS content is unavailable. Contact hello@ssegning.com for the current privacy policy.',
  terms:
    '## Terms of Service\n\nThis page is shown while the CMS content is unavailable. Contact hello@ssegning.com for the current terms of service.',
};

export const services: Service[] = [
  {
    id: 1,
    documentId: 'fallback-service-1',
    title: 'Kubernetes Platform Builds',
    slug: 'kubernetes-platform-builds',
    summary:
      'A production-ready Kubernetes platform — GitOps, ingress, secrets, storage, and observability — designed for your team to operate after I leave.',
    body: null,
    icon: 'container',
    order: 1,
    deliverables: [
      { id: 1, text: 'Cluster architecture sized to your actual traffic, not a vendor template' },
      { id: 2, text: 'GitOps delivery pipeline (ArgoCD or Flux) with automated sync and rollback' },
      {
        id: 3,
        text: 'Observability stack: metrics, logs, traces, and alerting that pages the right person',
      },
    ],
  },
  {
    id: 2,
    documentId: 'fallback-service-2',
    title: 'Rust & TypeScript Backend Engineering',
    slug: 'rust-typescript-backend-engineering',
    summary:
      'Backend services built in Rust or TypeScript, chosen per-service on latency and safety requirements rather than habit.',
    body: null,
    icon: 'code-xml',
    order: 2,
    deliverables: [
      { id: 1, text: 'API and service design reviewed against real failure modes' },
      {
        id: 2,
        text: 'Rust for latency- or memory-critical paths; TypeScript where iteration speed wins',
      },
      { id: 3, text: 'Test coverage and CI that catches regressions before your users do' },
    ],
  },
  {
    id: 3,
    documentId: 'fallback-service-3',
    title: 'Cloud Cost & Reliability Audits',
    slug: 'cloud-cost-reliability-audits',
    summary:
      'A focused audit of your cloud spend and failure points, with a prioritized, actionable remediation plan.',
    body: null,
    icon: 'search-check',
    order: 3,
    deliverables: [
      { id: 1, text: 'Line-by-line cost breakdown against actual usage' },
      { id: 2, text: 'Single points of failure identified and ranked by blast radius' },
      { id: 3, text: 'A written plan your team can execute without ongoing involvement from me' },
    ],
  },
  {
    id: 4,
    documentId: 'fallback-service-4',
    title: 'Fractional Platform Ownership',
    slug: 'fractional-platform-ownership',
    summary:
      'Ongoing, part-time ownership of your platform for teams that need senior judgment on tap without a full-time hire.',
    body: null,
    icon: 'shield-check',
    order: 4,
    deliverables: [
      { id: 1, text: 'A fixed weekly block of hands-on platform work' },
      { id: 2, text: 'Direct incident response for the systems I own' },
      { id: 3, text: 'A monthly written report your leadership can actually read' },
    ],
  },
];

export const projects: Project[] = [
  {
    id: 1,
    documentId: 'fallback-project-1',
    title: 'Migrating a monolith to a Talos Kubernetes platform',
    slug: 'monolith-to-talos-kubernetes-platform',
    client: 'Series A logistics platform',
    year: 2025,
    summary:
      'Replaced a hand-managed fleet of VMs with an immutable, GitOps-driven Kubernetes platform on Talos Linux.',
    body: 'The client was running their entire product on a handful of manually patched VMs, with deploys done over SSH and no reliable rollback path. I designed and delivered a Talos-based Kubernetes platform with ArgoCD as the sole path to production, moved every service into it incrementally behind feature flags, and trained the two in-house engineers to operate it independently.',
    cover: null,
    gallery: [],
    tags: ['kubernetes', 'talos', 'gitops', 'argocd'],
    outcome:
      'Deploy time dropped from a 40-minute manual runbook to under 3 minutes, fully automated.',
    url: null,
    order: 1,
    seo: null,
  },
  {
    id: 2,
    documentId: 'fallback-project-2',
    title: 'A Rust ingestion service for high-volume telemetry',
    slug: 'rust-ingestion-service-telemetry',
    client: 'B2B observability startup',
    year: 2024,
    summary:
      'Replaced a Node.js ingestion path that was falling over under load with a Rust service built for backpressure.',
    body: "The existing ingestion service, written in Node.js, was dropping events under peak load and had no clear backpressure strategy. I rebuilt the hot path in Rust using Tokio, added a proper backpressure and batching strategy against the downstream store, and kept the surrounding TypeScript control plane untouched so the client's team could keep shipping features against it.",
    cover: null,
    gallery: [],
    tags: ['rust', 'tokio', 'observability', 'performance'],
    outcome:
      'Sustained 12x the previous peak throughput on the same hardware, with zero dropped events.',
    url: null,
    order: 2,
    seo: null,
  },
  {
    id: 3,
    documentId: 'fallback-project-3',
    title: 'Cutting a six-figure cloud bill down to size',
    slug: 'cloud-cost-reliability-turnaround',
    client: 'Seed-stage SaaS company',
    year: 2024,
    summary:
      'A two-week audit turned into a phased remediation that cut cloud spend by more than half without a reliability regression.',
    body: 'The client suspected they were overspending on cloud infrastructure but had no way to attribute cost to actual usage. I ran a structured audit across compute, storage, and data transfer, identified oversized reserved instances and an unbounded log retention policy as the two largest offenders, and delivered a phased plan the in-house team executed over six weeks.',
    cover: null,
    gallery: [],
    tags: ['finops', 'aws', 'cost-optimization'],
    outcome: 'Monthly cloud spend fell by 54% with no measurable change in latency or error rate.',
    url: null,
    order: 3,
    seo: null,
  },
];

export const posts: Post[] = [
  {
    id: 1,
    documentId: 'fallback-post-1',
    title: 'Why I run Talos Linux on every cluster I control',
    slug: 'why-i-run-talos-linux',
    excerpt:
      'An immutable, API-managed OS removes an entire category of "someone SSH-ed in and changed something" incidents.',
    body: "Every incident retrospective I've written that involved node-level drift traced back to the same root cause: someone, at some point, SSH-ed into a box and changed something by hand. Talos Linux removes SSH entirely and manages the node through a typed API instead, which sounds like a small change until you've operated a fleet this way for a year and realized you've stopped writing that kind of retrospective.",
    cover: null,
    readingMinutes: 6,
    seo: null,
    publishedAt: '2025-03-11T09:00:00.000Z',
  },
  {
    id: 2,
    documentId: 'fallback-post-2',
    title: 'Picking Rust or TypeScript for a new service, honestly',
    slug: 'picking-rust-or-typescript-honestly',
    excerpt:
      'The choice is rarely about the language you like more — it is about which failure mode you would rather debug at 3am.',
    body: 'I get asked which language to use for a new backend service more often than any other question, and the honest answer is that it depends on which failure mode you can tolerate at 3am. TypeScript gets you to a working service faster and your whole team can read it. Rust costs you more up front but removes entire classes of memory and concurrency bugs before they ever reach production. I pick per-service, not per-company.',
    cover: null,
    readingMinutes: 5,
    seo: null,
    publishedAt: '2025-01-22T09:00:00.000Z',
  },
];
