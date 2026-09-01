import type { Core } from '@strapi/strapi';

/**
 * Idempotent content seed for a solo software & platform engineering
 * consultancy run by Stephane Segning Lambou (Germany).
 *
 * Runs from bootstrap() ONLY when the database has no `site-setting`
 * entry yet (checked by the caller before invoking this module) — see
 * CONTRACT.md "Seed". Every write uses the Document Service API and
 * publishes immediately, since apps/web only ever reads published data.
 *
 * No media files are uploaded here: media fields are left empty and
 * apps/web is expected to fall back gracefully (see CONTRACT.md
 * "Resilience requirement").
 */
export async function seed(strapi: Core.Strapi): Promise<void> {
  const existing = await strapi.documents('api::site-setting.site-setting').findFirst();

  if (existing) {
    strapi.log.info('[bootstrap/seed] site-setting already present, skipping seed');
    return;
  }

  strapi.log.info('[bootstrap/seed] seeding initial content...');

  await strapi.documents('api::site-setting.site-setting').create({
    status: 'published',
    data: {
      siteName: 'Stephane Segning Lambou',
      tagline: 'Platform engineering and backend systems, built to outlast the roadmap.',
      navLinks: [
        { label: 'Home', href: '/', external: false },
        { label: 'Services', href: '/services', external: false },
        { label: 'Work', href: '/work', external: false },
        { label: 'Journal', href: '/journal', external: false },
        { label: 'About', href: '/about', external: false },
        { label: 'Contact', href: '/contact', external: false },
      ],
      footerNote:
        'Built and operated in Germany. Kubernetes by day, Rust by choice, on-call by design.',
      metaDescription:
        'Stephane Segning Lambou is an independent software and platform engineer based in Germany, specializing in Kubernetes platforms, backend systems in Rust and TypeScript, and cloud cost control for teams that need senior technical judgement without a full-time hire.',
      socials: [
        { platform: 'github', url: 'https://github.com/ssegning' },
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/ssegning' },
        { platform: 'mastodon', url: 'https://hachyderm.io/@ssegning' },
        { platform: 'email', url: 'mailto:hello@ssegning.com' },
      ],
    },
  });

  await strapi.documents('api::home-page.home-page').create({
    status: 'published',
    data: {
      heroEyebrow: 'Platform Engineering & Fractional CTO',
      heroHeadline: "I build the infrastructure your product can't outgrow.",
      heroSubline:
        'Independent software and platform engineer based in Germany. I design Kubernetes platforms, harden backend systems in Rust and TypeScript, and bring the technical judgement of a CTO to teams that are not ready to hire one full-time.',
      primaryCta: { label: 'Book an intro call', href: '/contact', external: false },
      secondaryCta: { label: 'See the work', href: '/work', external: false },
      metrics: [
        {
          label: 'Years in platform engineering',
          value: '8+',
          detail: 'From bare-metal clusters to managed cloud, across four industries.',
        },
        {
          label: 'Production clusters run',
          value: '12',
          detail: 'Talos, k3s, EKS and GKE — reconciled by GitOps, not by hand.',
        },
        {
          label: 'Average cost reduction',
          value: '38%',
          detail: 'Typical savings uncovered in a two-week cloud architecture review.',
        },
        {
          label: 'Pages avoided since going GitOps',
          value: 'Most of them',
          detail: 'Self-healing infrastructure means fewer 3am wake-up calls.',
        },
      ],
      introTitle: 'A generalist with a platform-engineering core',
      introBody:
        'Most consultancies specialize in a layer of the stack and hope your problem lives inside it. I work the other way: I start from the system you actually have — the cluster nobody fully trusts, the service that only one person understands, the AWS bill that keeps climbing — and go as deep as the problem requires, whether that means rewriting a hot path in Rust, redesigning the Kubernetes topology underneath it, or sitting in on a board call to explain the technical risk in plain language.\n\nThat range is deliberate. Early-stage and mid-market teams rarely need a narrow specialist first; they need someone who can find the real bottleneck, fix the parts that are actually broken, and leave behind a system the existing team can run without them.',
      seo: {
        metaTitle: 'Stephane Segning Lambou — Platform Engineering & Backend Systems',
        metaDescription:
          'Independent platform engineer and fractional CTO based in Germany. Kubernetes, backend systems in Rust and TypeScript, cloud cost control, and technical due diligence.',
      },
    },
  });

  await strapi.documents('api::about-page.about-page').create({
    status: 'published',
    data: {
      name: 'Stephane Segning Lambou',
      role: 'Software & Platform Engineer',
      bio: "I'm a software and platform engineer based in Germany, working independently with founders and engineering leaders who need senior technical judgement applied to a specific, bounded problem — not a headcount.\n\nMy background spans backend systems in Rust, TypeScript and Java, and platform work on Kubernetes running on everything from Talos Linux bare metal to managed cloud control planes. I've operated GitOps-driven infrastructure where a merged pull request is the only way changes reach production, and I've been the person paged when that same infrastructure needed to heal itself at 3am. Both experiences shape how I build: I default to systems that are boring to operate, observable by default, and recoverable without a hero.\n\nOutside of client work, I write about the gap between what teams believe about infrastructure and what actually holds up under load — the same instinct that drives the case studies and journal entries on this site. When I take on an engagement, the goal is always the same: leave the system, and the team behind it, better equipped than either was before I arrived.",
      highlights: [
        {
          label: 'Core languages',
          value: 'Rust, TypeScript, Java',
          detail: 'Chosen per problem, not per preference.',
        },
        {
          label: 'Platform',
          value: 'Kubernetes',
          detail: 'Talos, k3s, EKS, GKE — GitOps via ArgoCD and Flux.',
        },
        {
          label: 'Based in',
          value: 'Germany',
          detail: 'Working with clients across the EU and North America.',
        },
        {
          label: 'Engagement style',
          value: 'Fractional & project-based',
          detail: 'No retainers longer than the problem requires.',
        },
      ],
      seo: {
        metaTitle: 'About Stephane Segning Lambou — Software & Platform Engineer',
        metaDescription:
          'Background, engagement style and technical focus of Stephane Segning Lambou, an independent software and platform engineer based in Germany.',
      },
    },
  });

  await strapi.documents('api::contact-page.contact-page').create({
    status: 'published',
    data: {
      headline: "Let's talk about your platform",
      body: "The fastest way to find out if this is a fit is a short call — no deck, no discovery questionnaire beforehand. Tell me what's breaking, what you've already tried, and what a good outcome looks like in three months. If it's a fit, I'll follow up with a scoped proposal within a few days. If it isn't, I'll say so and point you toward what I think will actually help.",
      email: 'hello@ssegning.com',
      location: 'Germany (remote-first, EU time zones)',
      bookingUrl: 'https://cal.com/ssegning/intro-call',
      seo: {
        metaTitle: 'Contact — Stephane Segning Lambou',
        metaDescription:
          'Get in touch to discuss platform engineering, backend systems, cloud cost control or a fractional CTO engagement.',
      },
    },
  });

  await strapi.documents('api::legal-page.legal-page').create({
    status: 'published',
    data: {
      imprint:
        "This website is operated by Stephane Segning Lambou, an independent software and platform engineering consultant based in Germany, trading under his own name. For business correspondence, statutory notices, or press inquiries, please use the contact form on this site or email hello@ssegning.com. Full statutory disclosures required under German law (Impressum per §5 TMG) are maintained in the operator's business records and provided on request to any party with a legitimate legal interest.",
      privacy:
        'This site collects the minimum data necessary to operate: standard web server logs for security and abuse prevention, and any information you voluntarily submit through the contact form or booking link. No advertising trackers or third-party analytics cookies are loaded without explicit consent. Data submitted through the contact form is used solely to respond to your inquiry and is retained only as long as necessary for that purpose, or as required by German commercial and tax law. You may request access to, correction of, or deletion of your data at any time by emailing hello@ssegning.com. This site does not sell or share personal data with third parties for marketing purposes.',
      terms:
        'Any engagement described on this site — platform engineering, backend development, cloud architecture review, or fractional CTO advisory — is subject to a separate, individually negotiated statement of work signed by both parties before work begins. Nothing on this website constitutes a binding offer of services, a guarantee of availability, or professional advice of any kind. Case studies and figures presented are illustrative of past engagements and are not a guarantee of similar results for any future client, whose outcomes depend on the specifics of their systems, team, and constraints.',
    },
  });

  const services = [
    {
      title: 'Platform Engineering & Kubernetes',
      slug: 'platform-engineering-kubernetes',
      summary:
        'Kubernetes platforms that heal themselves, reconciled entirely through GitOps — from bare-metal Talos to managed cloud.',
      body: "I design and operate Kubernetes platforms that your team can trust to run unattended. That means GitOps as the only path to production, sane defaults for storage, ingress and certificates, and observability wired in from day one rather than bolted on after the first outage. Whether you're running on Talos Linux bare metal or a managed control plane, the goal is the same: a platform boring enough that on-call is rare, and recoverable enough that when something does break, the fix is a merged pull request, not a 3am kubectl session.",
      icon: 'server',
      order: 1,
      deliverables: [
        { text: 'GitOps-managed clusters with ArgoCD or Flux' },
        { text: 'Zero-downtime upgrades and node lifecycle automation' },
        { text: 'Observability stack: metrics, logs and traces wired together' },
        { text: 'Incident runbooks the whole team can follow, not just you' },
      ],
    },
    {
      title: 'Backend Systems (Rust, TypeScript & Java)',
      slug: 'backend-systems-rust-typescript-java',
      summary:
        'Backend services designed for correctness and throughput, in the language the problem actually calls for.',
      body: "Backend work spans everything from a TypeScript API that needs to ship this quarter to a hot path that only Rust can make fast enough. I pick the language for the constraint, not the trend: TypeScript when iteration speed and team familiarity matter most, Java when you're already deep in that ecosystem and need pragmatic improvements rather than a rewrite, and Rust when correctness and raw performance are the actual bottleneck. Across all three, the same principles apply: typed boundaries, explicit error handling, and tests that describe one behavior each — not a pile of assertions nobody wants to touch.",
      icon: 'code-2',
      order: 2,
      deliverables: [
        { text: 'API and service design with typed contracts end to end' },
        { text: 'Performance-critical components rewritten in Rust where it matters' },
        { text: 'Test suites that catch regressions, not just pad a coverage number' },
        { text: 'Migration paths that ship incrementally, not a big-bang rewrite' },
      ],
    },
    {
      title: 'Cloud Architecture & Cost Control',
      slug: 'cloud-architecture-cost-control',
      summary:
        'A clear-eyed review of what your cloud bill is actually paying for, and an architecture that scales without scaling the invoice.',
      body: "Most cloud bills grow because nobody has time to ask why, not because the workload genuinely needs the spend. I run a structured review of your infrastructure — compute sizing, storage tiers, data transfer paths, idle environments, and the architectural decisions driving all of it — and come back with a prioritized list of changes, each with an estimated saving and an honest estimate of the engineering effort to get there. Where the architecture itself is the problem, I'll say so, and lay out a migration path that fits your team's capacity rather than a theoretical ideal.",
      icon: 'cloud',
      order: 3,
      deliverables: [
        { text: 'Full infrastructure and billing audit with prioritized findings' },
        { text: 'Right-sizing recommendations backed by real usage data' },
        { text: 'Architecture changes that reduce spend without adding fragility' },
        { text: 'A savings estimate you can take straight to finance' },
      ],
    },
    {
      title: 'Fractional CTO & Technical Due Diligence',
      slug: 'fractional-cto-technical-due-diligence',
      summary:
        'Senior technical judgement for founders and investors, on a schedule that fits a growing company or a live deal.',
      body: "Some decisions need a CTO's judgement before they need a CTO's calendar. I work with founders as a fractional technical lead — reviewing architecture decisions, interviewing and vetting senior engineering hires, and setting technical direction — for as many hours a week as the stage actually requires, scaling up or down as the company changes. For investors, I run technical due diligence on acquisition or investment targets: an honest read on code quality, infrastructure risk, technical debt and team capability, delivered as a report a non-technical partner can act on.",
      icon: 'compass',
      order: 4,
      deliverables: [
        { text: 'Ongoing fractional technical leadership, scoped to your stage' },
        { text: 'Architecture and hiring decisions reviewed before they get expensive' },
        { text: 'Technical due diligence reports for investors and acquirers' },
        { text: 'A direct line to senior judgement without a full-time salary' },
      ],
    },
  ];

  for (const service of services) {
    await strapi.documents('api::service.service').create({
      status: 'published',
      data: service,
    });
  }

  const projects = [
    {
      title: "Cutting a Series-A Fintech's Cloud Bill by 40% Without Touching the Roadmap",
      slug: 'fintech-cloud-cost-reduction',
      client: 'Series A fintech (confidential)',
      year: 2025,
      summary:
        'A two-week infrastructure audit turned into a 40% reduction in monthly cloud spend, with zero changes to the product roadmap.',
      body: "The engineering team had a clear mandate: extend runway without slowing down feature delivery. Their AWS bill had grown in step with the product for two years, and nobody had had time to ask which parts of it were still earning their keep. I ran a two-week audit across compute, storage and data transfer, working alongside the platform team rather than around them, and found the usual culprits hiding behind a healthy-looking dashboard: oversized instance classes chosen once and never revisited, three full staging environments running around the clock, and a logging pipeline shipping far more data than anyone was querying.\n\nThe fix wasn't a rewrite. It was right-sizing compute against real usage data, collapsing staging environments into an on-demand model, and tuning log retention and sampling to match what the team actually looked at during incidents. None of it touched the application code or the product roadmap. Within a month, the monthly bill was down 40%, and the savings were large enough to extend runway by several months — money the founders redirected straight into hiring.",
      outcome: '40% reduction in monthly cloud spend, delivered without any roadmap disruption.',
      tags: ['kubernetes', 'aws', 'cost-optimization'],
      order: 1,
      seo: {
        metaTitle: 'Case Study: 40% Cloud Cost Reduction for a Series A Fintech',
        metaDescription:
          "How a two-week infrastructure audit cut a fintech startup's AWS bill by 40% without any changes to the product roadmap.",
      },
    },
    {
      title: 'Migrating a Logistics Platform from a Monolith to Event-Driven Services',
      slug: 'logistics-platform-event-driven-migration',
      client: 'European logistics platform',
      year: 2024,
      summary:
        'Breaking apart a five-year-old monolith into event-driven services, shipped incrementally with zero downtime.',
      body: "A European logistics platform had outgrown its original monolith: every deploy risked the entire system, and the team that built it had grown from three engineers to twenty without the architecture keeping pace. A full rewrite was on the table, and it was the wrong call — the monolith handled real freight volume every day, and a big-bang replacement would have meant months of parallel systems and eventual breakage.\n\nInstead, I led an incremental migration to event-driven services, starting with the shipment-tracking module that had the clearest boundaries and the most independent release cadence. Each service was extracted behind a message broker, with the monolith continuing to serve traffic for everything not yet migrated, so the system stayed live and correct throughout. Over five months, six services were extracted this way, each shipped and validated in production before the next began.\n\nBy the end of the engagement, deploy frequency for the extracted services had gone from once a month to several times a week, and a single team's mistake could no longer take down freight tracking for the whole platform.",
      outcome:
        'Deploy frequency for extracted services increased from monthly to several times a week, with zero downtime during migration.',
      tags: ['event-driven-architecture', 'typescript', 'microservices'],
      order: 2,
      seo: {
        metaTitle: 'Case Study: Monolith to Event-Driven Migration for a Logistics Platform',
        metaDescription:
          'How an incremental, zero-downtime migration broke a five-year-old logistics monolith into independently deployable event-driven services.',
      },
    },
    {
      title: 'Building a Self-Healing Talos Kubernetes Platform for a Media Startup',
      slug: 'media-startup-talos-kubernetes-platform',
      client: 'Self-hosted media startup',
      year: 2023,
      summary:
        'A from-scratch, GitOps-managed Kubernetes platform on Talos Linux that survives node failures without a human in the loop.',
      body: 'A media startup building on self-hosted infrastructure needed a Kubernetes platform that could run reliably on a small, cost-conscious hardware footprint — without a dedicated platform team to babysit it. I designed and built the platform from scratch on Talos Linux, an immutable, API-managed Kubernetes OS that removes most of the traditional node-maintenance burden by design, paired with ArgoCD so that every change to the platform, from a new ingress route to a database upgrade, went through a pull request rather than a manual command.\n\nStorage was handled with Longhorn for replicated persistent volumes, certificates through cert-manager, and secrets synced from a managed secrets backend rather than committed anywhere near the repository. The result was a platform where a failed node, an expired certificate, or a misconfigured ingress resolved itself automatically, and where the two engineers on the team could safely make infrastructure changes without platform expertise, because the GitOps workflow caught mistakes before they reached production.\n\nEighteen months after handover, the platform is still running with no dedicated platform engineer on staff.',
      outcome:
        'Runs unattended eighteen months after handover, with no dedicated platform engineer on staff.',
      tags: ['kubernetes', 'talos', 'gitops', 'argocd'],
      order: 3,
      seo: {
        metaTitle: 'Case Study: Self-Healing Talos Kubernetes Platform for a Media Startup',
        metaDescription:
          'How a GitOps-managed Kubernetes platform on Talos Linux gave a small media startup a self-healing infrastructure with no dedicated platform team.',
      },
    },
  ];

  for (const project of projects) {
    await strapi.documents('api::project.project').create({
      status: 'published',
      data: project,
    });
  }

  const posts = [
    {
      title: 'Why I Run Talos Instead of a Managed Kubernetes Service',
      slug: 'why-talos-instead-of-managed-kubernetes',
      excerpt:
        'Managed Kubernetes trades operational control for convenience. For some workloads, that trade is exactly backwards.',
      body: "Managed Kubernetes services exist to remove a specific kind of pain: you no longer have to think about the control plane, node provisioning follows a documented API, and upgrades are, in theory, someone else's problem. For a lot of teams, that trade is the right one. But it's not free — you inherit the provider's upgrade cadence, their networking assumptions, and often their pricing model for anything beyond the default node pool, and when something goes wrong at the OS layer, you're debugging through a support ticket instead of a shell.\n\nTalos Linux takes a different approach: there is no shell. The entire OS is managed through a typed API, immutable and minimal by design, which removes an enormous surface area of configuration drift — the kind where a node quietly diverges from its siblings after eighteen months of ad hoc fixes nobody wrote down. Combined with GitOps, this means the actual state of a cluster is always derivable from a git history, not from institutional memory about what someone SSH'd into a box to fix in 2022.\n\nFor self-hosted and cost-sensitive workloads especially, this combination gives you most of the operational safety of a managed service, with none of the vendor lock-in, and a cost profile that scales with hardware rather than a per-node management fee.",
      readingMinutes: 6,
      seo: {
        metaTitle: 'Why I Run Talos Instead of a Managed Kubernetes Service',
        metaDescription:
          'A look at why immutable, API-managed Talos Linux beats managed Kubernetes for cost-sensitive and self-hosted workloads.',
      },
    },
    {
      title: 'The Fractional CTO Playbook: What Founders Actually Need in the First 90 Days',
      slug: 'fractional-cto-playbook-first-90-days',
      excerpt:
        'Most fractional CTO engagements start with the wrong question. Here is the one that actually matters in the first 90 days.',
      body: "Founders usually bring in a fractional CTO with a specific technical worry — the architecture feels shaky, a senior hire didn't work out, or the board is asking questions about technical risk nobody can answer confidently. The instinct is to start there, diving straight into the codebase or the infrastructure. In practice, the first 90 days go better when you start somewhere less obvious: understanding what decisions the founding team is actually equipped to make on their own, and which ones they've been making by default because no one told them there was a choice.\n\nThat distinction changes the whole engagement. If the team can make good architectural decisions but lacks a forcing function to slow down and make them deliberately, the job is process — lightweight design reviews, a habit of writing decisions down, a hiring bar that doesn't erode under pressure. If the gap is genuinely technical judgement, the job looks different: hands-on architecture work, direct involvement in senior hiring, and a clear technical roadmap the team can execute once the engagement ends.\n\nEither way, the measure of a good first 90 days isn't how many decisions you made for the team — it's how much better equipped they are to make the next one without you.",
      readingMinutes: 5,
      seo: {
        metaTitle: 'The Fractional CTO Playbook: The First 90 Days',
        metaDescription:
          'What a fractional CTO should actually focus on in the first 90 days of an engagement, and why it is rarely the technical problem you were hired for.',
      },
    },
  ];

  for (const post of posts) {
    await strapi.documents('api::post.post').create({
      status: 'published',
      data: post,
    });
  }

  strapi.log.info('[bootstrap/seed] seed complete');
}
