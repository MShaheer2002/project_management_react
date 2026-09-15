/**
 * Content for the four legal pages.
 *
 * ⚠️  THESE ARE DRAFTS, NOT LEGAL ADVICE.
 *
 * They were written to describe what this application genuinely does (Clerk
 * for authentication, Neon Postgres for data, AWS S3 for uploads, Stripe for
 * payments, Upstash Redis for queues, OpenRouter for AI inference, Resend for
 * transactional email) rather than being generic boilerplate — but they have
 * NOT been reviewed by a lawyer, and jurisdiction-specific obligations (GDPR
 * representative, CCPA disclosures, data-retention periods, governing law)
 * still need filling in properly before launch.
 *
 * Anything in [SQUARE BRACKETS] is a placeholder that must be replaced.
 */

export type LegalSection = {
  heading: string;
  /** Each string is a paragraph; arrays render as bullet lists. */
  body: (string | string[])[];
};

export type LegalDoc = {
  slug: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const COMPANY = 'Trussen Inc.';
const CONTACT = 'privacy@trussen.app';

export const privacyPolicy: LegalDoc = {
  slug: 'privacy',
  eyebrow: 'Legal',
  title: 'Privacy',
  titleAccent: 'Policy.',
  subtitle:
    'What we collect, why we collect it, and what we do with it — written to be read, not to be survived.',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: 'Who we are',
      body: [
        `${COMPANY} ("Trussen", "we", "us") provides a project management workspace available at trussen.app and on per-company subdomains. This policy explains how we handle personal data when you use it.`,
        `For data protection purposes, ${COMPANY} is the controller of account data, and a processor of the content your organisation stores in its workspace. Questions go to ${CONTACT}.`,
      ],
    },
    {
      heading: 'Information we collect',
      body: [
        'We collect three categories of information:',
        [
          'Account data — your name, email address, profile image and authentication identifiers. Authentication is handled by Clerk, which stores credentials on our behalf; we never see or store your password.',
          'Workspace content — the issues, projects, comments, documents and files your team creates. This belongs to your organisation, not to us.',
          'Usage and technical data — IP address, browser type, pages visited, and timestamps, used to keep the service secure and working.',
        ],
        'We do not buy personal data from third parties, and we do not build advertising profiles.',
      ],
    },
    {
      heading: 'How we use it',
      body: [
        'We use personal data to provide the service, authenticate you, send transactional email (invitations, notifications, password resets), process payments, provide support, detect abuse, and improve the product.',
        'We do not sell personal data. We do not share it with advertisers.',
      ],
    },
    {
      heading: 'Subprocessors',
      body: [
        'We rely on a small number of infrastructure providers, each with access limited to what their function requires:',
        [
          'Clerk — authentication and session management',
          'Neon — the managed Postgres database holding workspace data',
          'DigitalOcean — application hosting',
          'Vercel — frontend hosting and content delivery',
          'Cloudflare — DNS and network protection',
          'Amazon Web Services (S3) — file and attachment storage',
          'Upstash — the Redis instance backing our background job queue',
          'Stripe — payment processing and subscription billing',
          'Resend — transactional email delivery',
          'OpenRouter — AI model inference for assistant features',
        ],
        'A current list is maintained here. We will give notice before adding a subprocessor that materially changes how your data is handled.',
      ],
    },
    {
      heading: 'AI features',
      body: [
        'When you use Trussen AI, the relevant workspace content (for example the issue you are asking about) is sent to our model provider to generate a response. We do not permit providers to train their models on your content.',
        'AI features can be disabled for an entire workspace by an owner in workspace settings.',
      ],
    },
    {
      heading: 'Data retention',
      body: [
        'We keep workspace data for as long as the workspace is active. When a workspace is deleted, its content is removed from production systems within [30] days and from backups within [90] days.',
        'You can request deletion of your personal account at any time by contacting us.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'Depending on where you live, you may have the right to access, correct, export or delete your personal data, to object to certain processing, and to complain to a supervisory authority.',
        `To exercise any of these, email ${CONTACT}. We respond within [30] days.`,
      ],
    },
    {
      heading: 'International transfers',
      body: [
        'Our infrastructure is located in [REGION]. Where data is transferred outside your jurisdiction, we rely on [TRANSFER MECHANISM — e.g. Standard Contractual Clauses] to protect it.',
      ],
    },
    {
      heading: 'Security',
      body: [
        'All traffic is encrypted in transit with TLS, and data is encrypted at rest by our infrastructure providers. Access to production systems is restricted and logged. See our Security page for more detail.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'We will post any changes here and update the date above. For material changes, we will notify workspace owners by email before the change takes effect.',
      ],
    },
  ],
};

export const termsOfService: LegalDoc = {
  slug: 'terms',
  eyebrow: 'Legal',
  title: 'Terms of',
  titleAccent: 'Service.',
  subtitle: 'The agreement between your organisation and Trussen for use of the service.',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: 'Agreement',
      body: [
        `By creating a workspace or using Trussen, you agree to these terms on behalf of yourself and, where applicable, the organisation you represent. If you do not agree, do not use the service.`,
        `These terms are governed by the laws of [JURISDICTION], and disputes will be resolved in the courts of [VENUE].`,
      ],
    },
    {
      heading: 'Accounts',
      body: [
        'You must provide accurate information when creating an account and keep your credentials secure. You are responsible for activity that occurs under your account.',
        'Workspace owners control membership, roles and invite restrictions for their workspace, including which email domains may be invited.',
      ],
    },
    {
      heading: 'Acceptable use',
      body: [
        'You agree not to:',
        [
          'Use the service to store or distribute unlawful, infringing or malicious content',
          'Attempt to gain unauthorised access to another workspace or to our infrastructure',
          'Probe, scan or test the vulnerability of the service without written permission',
          'Resell or white-label the service without a written agreement',
          'Use automated means to place unreasonable load on the service',
        ],
        'We may suspend accounts that breach these rules, with notice where practical.',
      ],
    },
    {
      heading: 'Your content',
      body: [
        'You retain all rights to the content your organisation stores in Trussen. You grant us a limited licence to host, process and display that content solely to provide the service.',
        'You are responsible for having the rights necessary to store the content you upload.',
      ],
    },
    {
      heading: 'Plans and billing',
      body: [
        'Paid plans are billed per member per month in advance. Upgrades take effect immediately and are prorated; downgrades take effect at the end of the current billing period.',
        'Fees are non-refundable except where required by law. We may change pricing with at least [30] days notice to existing customers.',
        'The free plan is provided as-is and may change, subject to reasonable notice.',
      ],
    },
    {
      heading: 'Availability',
      body: [
        'We aim for high availability but do not guarantee uninterrupted service on any plan without a written service level agreement. Planned maintenance will be announced in advance where possible.',
      ],
    },
    {
      heading: 'Termination',
      body: [
        'You may cancel at any time from workspace settings. We may terminate or suspend access for material breach of these terms, non-payment, or where required by law.',
        'On termination you may export your data for [30] days, after which it is deleted in line with our Privacy Policy.',
      ],
    },
    {
      heading: 'Disclaimers and liability',
      body: [
        'The service is provided "as is" without warranties of any kind to the fullest extent permitted by law.',
        'To the maximum extent permitted by law, our aggregate liability arising from these terms is limited to the amount you paid us in the [12] months preceding the claim. We are not liable for indirect or consequential loss, including lost profits or lost data.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'We may update these terms. For material changes we will give at least [30] days notice to workspace owners. Continued use after the effective date constitutes acceptance.',
      ],
    },
  ],
};

export const cookiePolicy: LegalDoc = {
  slug: 'cookies',
  eyebrow: 'Legal',
  title: 'Cookie',
  titleAccent: 'Policy.',
  subtitle: 'What we store in your browser, and why. Short version: only what the product needs to work.',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: 'What cookies we use',
      body: [
        'Trussen uses a deliberately small set of cookies and browser storage:',
        [
          'Authentication — set by Clerk to keep you signed in and to secure the session. Without these you cannot log in.',
          'Preferences — your theme choice (light, dark or system) and interface state such as sidebar width, stored locally in your browser.',
          'Security — short-lived tokens used to protect against cross-site request forgery.',
        ],
        'These are all strictly necessary or functional. We do not use advertising cookies or third-party tracking pixels.',
      ],
    },
    {
      heading: 'Analytics',
      body: [
        'We use [ANALYTICS PROVIDER] to understand aggregate product usage. [Describe whether it is cookie-less, whether IPs are anonymised, and whether consent is required in your jurisdiction.]',
      ],
    },
    {
      heading: 'Managing cookies',
      body: [
        'You can clear or block cookies in your browser settings. Blocking authentication cookies will prevent you from signing in — the application cannot function without them.',
        'Clearing preference storage simply resets the interface to its defaults; no workspace data is affected.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'If we introduce new categories of cookies, we will update this page and, where required, ask for your consent first.',
      ],
    },
  ],
};

export const securityPolicy: LegalDoc = {
  slug: 'security',
  eyebrow: 'Trust',
  title: 'Security at',
  titleAccent: 'Trussen.',
  subtitle:
    'How we protect workspace data, and how to reach us if you find something we missed.',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: 'Infrastructure',
      body: [
        'Trussen runs on managed infrastructure with encryption in transit (TLS 1.2+) and at rest. The application layer is hosted on DigitalOcean, the database on Neon, files on Amazon S3, and the frontend on Vercel behind Cloudflare.',
        'Production access is restricted to a small number of engineers, requires multi-factor authentication, and is logged.',
      ],
    },
    {
      heading: 'Tenant isolation',
      body: [
        'Every workspace is addressed by its own subdomain, but a subdomain only identifies which workspace a request is for — it never grants access to it.',
        'Every request is independently authenticated, and membership of the target workspace is verified server-side against the database before any data is returned. A valid session for one workspace can never read another.',
      ],
    },
    {
      heading: 'Authentication',
      body: [
        'Authentication is handled by Clerk. Passwords are never stored by Trussen. Multi-factor authentication, social sign-in (Google, GitHub) and enterprise SSO are supported.',
        'Workspace owners can restrict which email domains may be invited, limiting membership to their own company domain or an explicit allowlist.',
      ],
    },
    {
      heading: 'Data handling',
      body: [
        'Workspace content is logically separated per tenant and access-controlled by role (owner, admin, member, guest). API keys and integration tokens are stored encrypted, and are scoped to the minimum permissions needed.',
      ],
    },
    {
      heading: 'Backups and recovery',
      body: [
        'The production database supports point-in-time recovery. Restore procedures are documented and tested periodically rather than assumed to work.',
      ],
    },
    {
      heading: 'Responsible disclosure',
      body: [
        'If you believe you have found a vulnerability, email security@trussen.app with enough detail to reproduce it. We will acknowledge within one business day and keep you updated until it is resolved.',
        'We ask that you give us reasonable time to fix an issue before disclosing it publicly, and that you avoid accessing or modifying other users’ data while testing. We will not pursue legal action against researchers who follow this in good faith.',
      ],
    },
    {
      heading: 'Compliance',
      body: [
        '[Describe current status honestly — e.g. "We are not yet SOC 2 certified. A Type II audit is planned for [DATE]." Do not claim certifications that do not exist.]',
      ],
    },
  ],
};

export const legalDocs: Record<string, LegalDoc> = {
  privacy: privacyPolicy,
  terms: termsOfService,
  cookies: cookiePolicy,
  security: securityPolicy,
};
